export type StoreListener<T> = (next: T, prev: T) => void;
export class Store<T> {
  private state: T;
  private listeners: Set<StoreListener<T>>;
  constructor(initialState: T) {
    this.state = initialState;
    this.listeners = new Set();
  }
  static create<T>(initialState: T): Store<T> {
    return new Store(initialState);
  }
  getState = () => {
    return this.state;
  };
  subscribe = (fn: StoreListener<T>) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  dispatch = (next: T) => {
    const prev = this.state;
    this.state = next;
    this.listeners.forEach((fn) => {
      fn(next, prev);
    });
  };
}
