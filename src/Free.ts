export type Free<A> = {
  // ap: <B>(m: Free<any>) => Free<B>
  map: <B>(cb: (arg: A) => B) => Free<B>;
  chain: <B>(cb: (arg: A) => Free<B>) => Free<B>;
  inspect: () => string;
  value: () => A;
};

export const Free = <A>(arg: A): Free<A> => ({
  // ap: <B>(m: Free<B>): Free<B> => typeof arg === 'function' ? m.map(v => arg(v)) : ,
  map: <B>(cb: (a: A) => B): Free<B> => Free(cb(arg)),
  chain: <B>(cb: (a: A) => Free<B>): Free<B> => cb(arg),
  inspect: () => `Free(${arg})`,
  value: () => arg,
});
