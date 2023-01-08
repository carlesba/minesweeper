import { match } from "ts-pattern";
import { Free } from "data/Free";
import { Just, maybe, Maybe, Nothing } from "data/Maybe";

interface Pos {
  x: number;
  y: number;
}
export type PosId = string; // `${number}-${number}`;

type Tile =
  | { type: "mine"; checked: boolean }
  | { type: "safe"; count: number; checked: boolean };

export interface Game {
  mines: number;
  time: number;
  secondsLeft: number;
  status: "idle" | "on" | "overtime" | "boom" | "win";
  tiles: Map<PosId, Tile>;
  size: Pos;
  flags: Set<PosId>;
  flagging: boolean;
  tilesLeft: number;
}

export const List = {
  randomBetween: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min),
  everyItem: <T>(length: number, fn: (index: number) => T): T[] =>
    Array.from({ length }, (_, i) => fn(i)),
};

export const Position = {
  generate: (limit: Pos, count: number, state: Set<PosId>): Set<PosId> =>
    Just(count)
      .chain((n) => (n === 0 ? Nothing : maybe(n)))
      .map(() => Position.randomPositionId(limit))
      .map((p) =>
        Position.available(state, p)
          .map((p) => new Set(state).add(p))
          .cata({
            Nothing: () => Position.generate(limit, count, state),
            Just: (ps) => Position.generate(limit, count - 1, ps),
          })
      )
      .cata({
        Just: (ps) => ps,
        Nothing: () => state,
      }),

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
    [-1, 0, 1].reduce(
      (total, x) =>
        total.concat(
          [-1, 0, 1]
            .filter((y) => !(y === 0 && x === 0))
            .map((y) => ({ x: x + p.x, y: y + p.y }))
        ),
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
    0 <= p.x && p.x < size.x && 0 <= p.y && p.y < size.y,

  getNeighbours: (size: Pos, target: Pos): Pos[] =>
    Position.everyDirection(target).filter((p) =>
      Board.isPositionInside(size, p)
    ),
};

const Game = {
  getTile: (game: Game, p: Pos): Tile =>
    Free(p)
      .map(Position.idFromPosition)
      .map((id) => game.tiles.get(id)!)
      .value(),

  revealTile: (game: Game, position: PosId): Game => ({
    ...game,
    tilesLeft: game.tilesLeft - 1,
    tiles: new Map(game.tiles).set(position, {
      ...game.tiles.get(position)!,
      checked: true,
    }),
    flags: !game.flags.has(position)
      ? game.flags
      : Free(game.flags)
          .map((f) => new Set(f))
          .map((f) => {
            f.delete(position);
            return f;
          })
          .value(),
  }),

  updateStatus: (game: Game, position: Pos): Game =>
    match<{ game: Game; tile: Tile }, Game>({
      game,
      tile: Game.getTile(game, position),
    })
      .with({ tile: { type: "mine" } }, () => ({ ...game, status: "boom" }))
      .with({ game: { secondsLeft: 0 } }, () => ({
        ...game,
        status: "overtime",
      }))
      .with({ game: { tilesLeft: 0 } }, () => ({ ...game, status: "win" }))
      .otherwise(() => game),
  flag: (game: Game, position: Pos): Game => ({
    ...game,
    flags: Free(position)
      .map(Position.idFromPosition)
      .map((id) => new Set(game.flags).add(id))
      .value(),
  }),
  unflag: (game: Game, position: Pos): Game => ({
    ...game,
    flags: Free(position)
      .map(Position.idFromPosition)
      .map((id) => {
        let s = new Set(game.flags);
        s.delete(id);
        return s;
      })
      .value(),
  }),
  isFlagged: (game: Game, position: Pos) =>
    game.flags.has(Position.idFromPosition(position)),
  maybeFlagsAvailable: (game: Game) =>
    game.flags.size < game.mines ? Just(game) : Nothing,
  foldAction: <T, K>(
    game: Game,
    handler: { flag(game: Game): T; select(game: Game): K }
  ) => (game.flagging ? handler.flag(game) : handler.select(game)),
};

const Actions = {
  createGame(size: Pos, mines: number, seconds: number): Game {
    const tiles = new Map<PosId, Tile>();

    let minePositions = Position.generate(size, mines, new Set<PosId>());

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
            tiles.set(id, { type: "mine", checked: false });
          },
          Just(count) {
            tiles.set(id, { type: "safe", checked: false, count });
          },
        });
    });
    const tilesLeft = size.x * size.y - mines;
    return {
      flagging: false,
      mines,
      time: seconds,
      secondsLeft: seconds,
      size,
      status: "idle",
      tiles,
      flags: new Set(),
      tilesLeft,
    };
  },
  reveal: (game: Game, position: Pos): Game =>
    match<{ game: Game; id: string }, Game>({
      game,
      id: Position.idFromPosition(position),
    })
      .with({ game: { status: "on" } }, (p) =>
        match<{ game: Game; tile: Tile; id: PosId }, Game>({
          game: Game.revealTile(p.game, p.id),
          id: p.id,
          tile: Game.getTile(game, position),
        })
          .with({ tile: { checked: true } }, () => game)
          .with({ tile: { type: "mine" } }, (p) =>
            Game.updateStatus(p.game, position)
          )
          .with({ tile: { type: "safe", count: 0 } }, (p) =>
            Board.getNeighbours(game.size, position).reduce(
              (g, p) =>
                Free(g)
                  .map((g) => Actions.reveal(g, p))
                  .map((g) => Game.updateStatus(g, p))
                  .value(),
              p.game
            )
          )
          .otherwise((p) => Game.updateStatus(p.game, position))
      )
      .otherwise((p) => p.game),
  select: (game: Game, position: Pos): Game =>
    Game.foldAction(game, {
      flag: (g) =>
        Game.isFlagged(g, position)
          ? Game.unflag(g, position)
          : Game.maybeFlagsAvailable(g)
              .map((g) => Game.flag(g, position))
              .valueOr(g),
      select: (g) =>
        Game.isFlagged(g, position) ? g : Actions.reveal(g, position),
    }),
  time: (game: Game): Game =>
    match<Game, Game>(game)
      .with({ secondsLeft: 1 }, (g) => ({
        ...g,
        secondsLeft: 0,
        status: "overtime",
      }))
      .otherwise((g) => ({ ...g, secondsLeft: g.secondsLeft - 1 })),
  toggleFlagging: (game: Game): Game =>
    game.status !== "on" ? game : { ...game, flagging: !game.flagging },
};

type GameActions =
  | { type: "flag"; position: Pos }
  | { type: "select"; position: Pos }
  | { type: "restart" }
  | { type: "start"; size: Pos; mines: number; seconds: number }
  | { type: "time" }
  | { type: "toggleFlagging" };

export class Minesweeper {
  private listeners: Set<(game: Game) => void>;
  private game: Game;
  private timer: ReturnType<typeof setTimeout> | null;
  constructor(size: Pos, mines: number, seconds: number) {
    this.listeners = new Set();
    this.game = Actions.createGame(size, mines, seconds);
    this.timer = null;
  }
  static create(size: Pos, mines: number, seconds: number) {
    return new Minesweeper(size, mines, seconds);
  }
  subscribe = (listener: (game: Game) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  _applyAction(action: GameActions) {
    switch (action.type) {
      case "select": {
        if (this.game.status === "idle") {
          this.setNextTick();
          this.game = { ...this.game, status: "on" };
        }
        return Actions.select(this.game, action.position);
      }
      case "time": {
        if (this.game.status === "on") {
          this.setNextTick();
        }
        return Actions.time(this.game);
      }
      case "restart": {
        this.setNextTick();
        this.game = Actions.createGame(
          this.game.size,
          this.game.mines,
          this.game.time
        );
        this.game = { ...this.game, status: "on" };
        return this.game;
      }
      case "start": {
        this.game = Actions.createGame(
          action.size,
          action.mines,
          action.seconds
        );
        this.game = { ...this.game, status: "on" };
        this.setNextTick();
        return this.game;
      }
      case "toggleFlagging": {
        this.game = Actions.toggleFlagging(this.game);
        return this.game;
      }
      default: {
        return this.game;
      }
    }
  }
  setNextTick = () => {
    this.timer = setTimeout(() => this.dispatch({ type: "time" }), 1000);
  };
  dispatch = (action: GameActions) => {
    const game = this._applyAction(action);
    this.game = game;
    if (game.status !== "on" && this.timer) {
      clearTimeout(this.timer);
    }
    this.listeners.forEach((fn) => fn(game));
  };
  getState = () => this.game;
}
