import { useSyncExternalStore } from "react";
import { Minesweeper, Game, List, Position } from "./minesweeper";

export const SIZE = { x: 10, y: 10 };
export const MINES = 20;
export const SECONDS = 60;


const store = Minesweeper.create(SIZE, MINES, SECONDS);

export const allPositions = List.everyItem(SIZE.y, (y) =>
  List.everyItem(SIZE.x, (x) => Position.idFromPosition({ x, y }))
);

export const useReadGame = <T,>(selector: (g: Game) => T) =>
  useSyncExternalStore(
    (fn) => store.subscribe(fn),
    () => selector(store.getState()),
    () => selector(store.getState())
  );

export const useDispatchAction = () =>
  useSyncExternalStore(
    (fn) => store.subscribe(fn),
    () => store.dispatch,
    () => store.dispatch
  );
