import { Fragment, useSyncExternalStore } from "react";
import { match } from "ts-pattern";
import { Free } from "../src/Free";
import { Just, maybe, Maybe, Nothing } from "../src/Maybe";

interface Pos {
  x: number;
  y: number;
}
type PosId = string; // `${number}-${number}`;

type Tile =
  | { type: "mine"; checked: boolean }
  | { type: "safe"; count: number; checked: boolean };

interface Game {
  secondsLeft: number;
  status: "on" | "overtime" | "boom" | "win";
  tiles: Map<PosId, Tile>;
  size: Pos;
  flags: Set<PosId>;
  tilesLeft: number;
}

const SIZE = { x: 10, y: 10 };
const MINES = 20;
const SECONDS = 60;

const log =
  (m: string) =>
  <T,>(v: T) => {
    console.log(m, v);
    return v;
  };

const List = {
  randomBetween: (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1) + min),
  everyItem: <T,>(length: number, fn: (index: number) => T): T[] =>
    Array.from({ length }, (_, i) => fn(i)),
};

const Position = {
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

  flag: (game: Game, position: Pos) => ({
    ...game,
    flags: Free(position)
      .map(Position.idFromPosition)
      .map((id) => new Set(game.flags).add(id))
      .value(),
  }),
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
      secondsLeft: seconds,
      size,
      status: "on",
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

  flag: (game: Game, position: Pos): Game =>
    maybe(Game.getTile(game, position))
      .chain((tile) => (tile.checked ? Nothing : maybe(game)))
      .map((g) => Game.flag(g, position))
      .cata({
        Just: (g) => g,
        Nothing: () => game,
      }),
  time: (game: Game): Game =>
    match<Game, Game>(game)
      .with({ secondsLeft: 1 }, (g) => ({
        ...g,
        secondsLeft: 0,
        status: "overtime",
      }))
      .otherwise((g) => ({ ...g, secondsLeft: g.secondsLeft - 1 })),
};

type GameActions =
  | { type: "flag"; position: Pos }
  | { type: "reveal"; position: Pos }
  | { type: "start" }
  | { type: "restart"; size: Pos; mines: number; seconds: number }
  | { type: "time" };

class GameStore {
  private listeners: Set<(game: Game) => void>;
  private game: Game;
  private timer: ReturnType<typeof setTimeout> | null;
  constructor(size: Pos, mines: number, seconds: number) {
    this.listeners = new Set();
    this.game = Actions.createGame(size, mines, seconds);
    this.timer = null;
  }
  static create(size: Pos, mines: number, seconds: number) {
    return new GameStore(size, mines, seconds);
  }
  subscribe = (listener: (game: Game) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  _applyAction(action: GameActions) {
    switch (action.type) {
      case "flag": {
        return Actions.flag(this.game, action.position);
      }
      case "reveal": {
        return Actions.reveal(this.game, action.position);
      }
      case "time": {
        if (this.game.status === "on") {
          this.setNextTick();
        }
        return Actions.time(this.game);
      }
      case "start": {
        this.setNextTick();
        return this.game;
      }
      case "restart": {
        this.game = Actions.createGame(
          action.size,
          action.mines,
          action.seconds
        );
        this.setNextTick();
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
const store = GameStore.create(SIZE, MINES, SECONDS);

const useReadGame = <T,>(selector: (g: Game) => T) =>
  useSyncExternalStore(
    (fn) => store.subscribe(fn),
    () => selector(store.getState()),
    () => selector(store.getState())
  );

const useDispatchAction = () =>
  useSyncExternalStore(
    (fn) => store.subscribe(fn),
    () => store.dispatch,
    () => store.dispatch
  );

const allPositions = List.everyItem(SIZE.y, (y) =>
  List.everyItem(SIZE.x, (x) => Position.idFromPosition({ x, y }))
);

function TileView(props: { id: PosId }) {
  const tile = useReadGame((s) => s.tiles.get(props.id)!);
  const dispatch = useDispatchAction();
  const reveal = () =>
    dispatch({ type: "reveal", position: Position.positionFromId(props.id) });

  return match(tile)
    .with({ checked: false }, () => (
      <div className="bg-teal-500" data-id={props.id} onClick={reveal} />
    ))
    .with({ type: "safe", count: 0 }, () => (
      <div className="bg-sky-600" data-id={props.id} />
    ))
    .with({ type: "safe" }, (t) => (
      <div
        className="bg-sky-600 aspect-square flex justify-center items-center"
        data-id={props.id}
      >
        {t.count}
      </div>
    ))
    .otherwise(() => (
      <div
        className="bg-red-600 aspect-square flex justify-center items-center"
        data-id={props.id}
      >
        X
      </div>
    ));
}

function ButtonStart() {
  const dispatch = useDispatchAction();
  const start = () =>
    dispatch({ type: "restart", size: SIZE, mines: MINES, seconds: SECONDS });

  return <button onClick={start}>Start</button>;
}

function StatusPanel() {
  const status = useReadGame((s) => s.status);
  return <div>{status}</div>;
}
function TimerPanel() {
  const seconds = useReadGame((s) => s.secondsLeft);
  return <div>{seconds}</div>;
}
function BoardView() {
  return (
    <div
      className="grid aspect-square w-full bg-cyan-900 gap-1 p-1"
      style={{
        gridTemplateColumns: "repeat(10, 1fr)",
        gridAutoRows: "1fr",
      }}
    >
      {allPositions.map((row, index) => (
        <Fragment key={index}>
          {row.map((id) => (
            <TileView key={id} id={id} />
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="h-screen w-screen flex justify-center">
      <div className="h-full w-1/2 flex justify-center items-center flex-col">
        <div className="flex justify-around w-full">
          <ButtonStart />
          <TimerPanel />
          <StatusPanel />
        </div>
        <BoardView />
      </div>
    </div>
  );
}
