import { Maybe, maybe, Nothing } from "data/Maybe";
import { Store } from "data/Store";
import { match } from "ts-pattern";
import { store } from "./state";

type StatsReason = "time" | "win" | "mine";

type Rank = { date: number; timeLeft: number };
type StatsData = Map<StatsReason, number>;

export type StatsState = { ranks: Rank[]; data: StatsData };

const initialState: StatsState = { ranks: [], data: new Map() };

const maybeLocalStorage = () =>
  typeof localStorage === "object" ? maybe(localStorage) : Nothing;

const readStorage = (): Maybe<StatsState> =>
  maybeLocalStorage()
    .map((s) => s.getItem("stats"))
    .chain((s) => (!s ? Nothing : maybe(s)))
    .map(JSON.parse);

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

  register = (props: {
    date: number;
    timeLeft: number;
    reason: StatsReason;
  }) => {
    const state = this.store.getState();
    const data = new Map(state.data);
    let ranks = state.ranks;
    this.date = props.date;

    match(props)
      .with({ reason: "time" }, () => {
        const dataTime = data.get("time") || 0;
        data.set("time", dataTime + 1);
      })
      .with({ reason: "mine" }, () => {
        const d = data.get("mine") || 0;
        data.set("mine", d + 1);
      })
      .with({ reason: "win" }, ({ date, timeLeft }) => {
        const d = data.get("win") || 0;
        data.set("win", d + 1);

        ranks = [...state.ranks, { date, timeLeft }]
          .sort((a, b) => a.timeLeft - b.timeLeft)
          .slice(0, 10);
      })
      .otherwise(() => {});

    maybeLocalStorage().map((s) => {
      s.setItem("stats", JSON.stringify({ ranks, data }));
    });

    this.store.dispatch({ ranks, data });
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
      timeLeft: next.secondsLeft,
      reason,
    });

  match(next)
    .with({ status: "boom" }, () => register("mine"))
    .with({ status: "overtime" }, () => register("time"))
    .with({ status: "win" }, () => register("win"))
    .otherwise(() => {});
});
