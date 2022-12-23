import { Free } from "../src/Free";
import { Just, maybe, Maybe, Nothing } from "../src/Maybe";

interface Pos {
  x: number;
  y: number;
}
type PosId = string; // `${number}-${number}`;

type Tile =
  | { type: "mine" }
  | { type: "mine" | "safe"; count: number; checked: boolean };

interface Game {
  status: "on" | "over";
  tiles: Map<PosId, Tile>;
  size: Pos;
}

const List = {
  randomBetween: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min),
  everyItem: <T,>(length: number, fn: (index: number) => T): T[] =>
    Array.from({ length }, (_, i) => fn(i)),
};

const Position = {
  idFromPosition: (p: Pos): PosId => `${p.x}-${p.y}`,

  positionFromId: (p: PosId): Pos => {
    const [x, y] = p.split("-").map((x) => Number(x as any as number));
    return { x, y };
  },

  randomPosition: (max: Pos) => ({
    x: List.randomBetween(0, max.x),
    y: List.randomBetween(0, max.y),
  }),

  randomPositionId: (max: Pos): PosId =>
    Free(Position.randomPosition(max)).map(Position.idFromPosition).value(),

  available: (positions: Set<PosId>, id: PosId): Maybe<PosId> =>
    positions.has(id) ? Nothing : Just(id),

  everyDirection: (p: Pos) =>
    [-1, 0, -1].reduce(
      (total, x) =>
        total.concat([-1, 0, 1].map((y) => ({ x: x + p.x, y: +p.y }))),
      [] as Pos[]
    ),
  add: (a: Pos, b: Pos): Pos => ({
    x: a.x + b.x,
    y: a.y + b.y,
  }),
};

const Board = {
  everyTile: (size: Pos, fn: (p: Pos) => void) =>
    List.everyItem(size.x, (x) => List.everyItem(size.y, (y) => fn({ x, y }))),

  isPositionInside: (size: Pos, p: Pos) =>
    0 < p.x && p.x < size.x && 0 < p.y && p.y < size.y,

  getNeighbours: (size: Pos, target: Pos): Pos[] =>
    Position.everyDirection(target).filter((p) =>
      Board.isPositionInside(size, p)
    ),
};

const Game = {
  _anyLeft: (n: number): Maybe<number> => (n === 0 ? Nothing : Just(n)),
  _generatePositions: (
    size: Pos,
    mines: number,
    positions: Set<PosId>
  ): Set<PosId> =>
    Game._anyLeft(mines)
      .map(() => Position.randomPositionId(size))
      .map((p) =>
        Position.available(positions, p)
          .map((p) => new Set(positions).add(p))
          .cata({
            Nothing: () => Game._generatePositions(size, mines, positions),
            Just: (ps) => Game._generatePositions(size, mines - 1, ps),
          })
      )
      .cata({
        Just: (ps) => ps,
        Nothing: () => positions,
      }),
  create(size: Pos, mines: number): Game {
    const tiles = new Map<PosId, Tile>();

    let minePositions = Game._generatePositions(size, mines, new Set<PosId>());

    Board.everyTile(size, (pos) => {
      const id = Position.idFromPosition(pos);
      maybe(id)
        .chain((id) => (minePositions.has(id) ? Nothing : Just(pos)))
        .map(
          () =>
            Board.getNeighbours(size, pos).filter((p) =>
              minePositions.has(Position.idFromPosition(p))
            ).length
        )
        .cata({
          Nothing() {
            tiles.set(id, { type: "mine" });
          },
          Just(count) {
            tiles.set(id, { type: "safe", checked: false, count });
          },
        });
    });

    return {
      size,
      status: "on",
      tiles,
    };
  },

  _getTile: (game: Game, p: Pos): Tile =>
    Free(p)
      .map(Position.idFromPosition)
      .map((id) => game.tiles.get(id)!)
      .value(),

  _maybeSafePosition: (game: Game, p: PosId): Maybe<Tile> =>
    maybe(p)
      .map((id) => game.tiles.get(id)!)
      .chain((tile) => (tile.type === "safe" ? maybe(tile) : Nothing)),

  _maybeClearedPosition: (game: Game, p: PosId): Maybe<Tile> =>
    maybe(p)
      .map((id) => game.tiles.get(id)!)
      .chain((tile) =>
        tile.type === "safe" && tile.count === 0 ? maybe(tile) : Nothing
      ),

  _checkTile: (game: Game, position: PosId) => ({
    ...game,
    tiles: new Map(game.tiles).set(position, {
      ...game.tiles.get(position)!,
      checked: true,
    }),
  }),
  _gameOver: (game: Game): Game => ({ ...game, status: "over" }),

  select: (game: Game, position: Pos): Game =>
    Free(Game._getTile(game, position))
      .chain(
        (tile): Free<Game> =>
          tile.type === "mine"
            ? Free(game)
                .map((g) =>
                  Game._checkTile(g, Position.idFromPosition(position))
                )
                .map(Game._gameOver)
            : tile.count > 0
            ? Free(game).map((g) =>
                Game._checkTile(g, Position.idFromPosition(position))
              )
            : Free(game)
                .map((g) =>
                  Game._checkTile(g, Position.idFromPosition(position))
                )
                .map((g) =>
                  Board.getNeighbours(game.size, position).reduce(
                    Game.select,
                    g
                  )
                )
      )
      .value(),
};

export default function Home() {
  return <div>home</div>;
}
