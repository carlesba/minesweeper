import { Maybe, maybe, Nothing } from "data/Maybe";
import { Store } from "data/Store";
import { match } from "ts-pattern";
import { store } from "./state";

type StatsReason = "time" | "win" | "mine";

type Rank = { date: number; time: number };
type StatsData = Record<StatsReason, number>;

const LATEST_VERSION = "2";

export type StatsState = { version: string; ranks: Rank[]; data: StatsData };

const initialState: StatsState = {
  version: LATEST_VERSION,
  ranks: [],
  data: { time: 0, win: 0, mine: 0 },
};

const maybeLocalStorage = () =>
  typeof localStorage === "object" ? maybe(localStorage) : Nothing;

const readStorage = (): Maybe<StatsState> =>
  maybeLocalStorage()
    .map((s) => s.getItem("stats"))
    .chain((s) => (!s ? Nothing : maybe(s)))
    .map(JSON.parse)
    .chain((s) => (s.version !== LATEST_VERSION ? Nothing : maybe(s)));

class StatsStore {
  private store: Store<StatsState>;
  private date = new Date().getTime();
  constructor(s: StatsState) {
    this.store = Store.create(s);
  }
  static create(s: StatsState) {
    return new StatsStore(s);
  }
  getState = () => this.store.getState();
  subscribe = (fn: (next: StatsState, prev: StatsState) => void) =>
    this.store.subscribe(fn);

  register = (props: { date: number; time: number; reason: StatsReason }) => {
    const state = this.store.getState();
    const version = state.version;
    const data = { ...state.data };
    let ranks = state.ranks;
    this.date = props.date;

    match(props)
      .with({ reason: "time" }, () => {
        data.time += 1;
      })
      .with({ reason: "mine" }, () => {
        data.mine += 1;
      })
      .with({ reason: "win" }, ({ date, time }) => {
        data.win += 1;

        ranks = [...state.ranks, { date, time }]
          .sort((a, b) => a.time - b.time)
          .slice(0, 10);
      })
      .otherwise(() => {});

    maybeLocalStorage().map((s) => {
      s.setItem("stats", JSON.stringify({ ranks, data }));
    });

    this.store.dispatch({ version, ranks, data });
  };
  getLatestDate = () => this.date;
}

export const statsStore = StatsStore.create(
  readStorage().cata({
    Nothing: () => initialState,
    Just: (s) => s,
  })
);

store.subscribe((next) => {
  const register = (reason: StatsReason) =>
    statsStore.register({
      date: new Date().getTime(),
      time: next.time - next.secondsLeft,
      reason,
    });

  match(next)
    .with({ status: "boom" }, () => register("mine"))
    .with({ status: "overtime" }, () => register("time"))
    .with({ status: "win" }, () => register("win"))
    .otherwise(() => {});
});
