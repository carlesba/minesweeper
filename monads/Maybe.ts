export type Maybe<A> = {
  ap: <B>(m: Maybe<any>) => Maybe<B>;
  map: <B>(cb: (arg: A) => B) => Maybe<B>;
  chain: <B>(cb: (arg: A) => Maybe<B>) => Maybe<B>;
  cata: <B, C>(obj: { Just: (arg: A) => B; Nothing: () => C }) => B | C;
  fold: <B, C>(nothing: () => C, just: (arg: A) => B) => B | C;
  swap: <B>(m: B) => Maybe<A> | Maybe<B>;
  inspect: () => string;
  isNothing: () => boolean;
  isJust: () => boolean;
  valueOr: <T>(v: T) => A | T;
};

export const Just = <A>(arg: A): Maybe<A> => ({
  ap: <B>(m: Maybe<B>): Maybe<B> =>
    typeof arg === "function" ? m.map((v) => arg(v)) : Nothing,
  map: <B>(cb: (a: A) => B): Maybe<B> => Just(cb(arg)),
  chain: <B>(cb: (a: A) => Maybe<B>): Maybe<B> => cb(arg),
  cata: (obj) => obj.Just(arg),
  fold: (_, just) => just(arg),
  swap: () => Nothing,
  inspect: () => `Just(${arg})`,
  isNothing: () => false,
  isJust: () => true,
  valueOr: () => arg,
});

export const Nothing: Maybe<any> = {
  ap: (): Maybe<any> => Nothing,
  map: (): Maybe<any> => Nothing,
  chain: (): Maybe<any> => Nothing,
  cata: (obj) => obj.Nothing(),
  fold: (nothing, _just) => nothing(),
  swap: (m) => Just(m),
  inspect: () => `Nothing`,
  isNothing: () => true,
  isJust: () => false,
  valueOr: (v) => v,
};

export const maybe = <T>(arg?: T): Maybe<NonNullable<T>> =>
  arg === null || arg === undefined ? Nothing : Just(arg);
