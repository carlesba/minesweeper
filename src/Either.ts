export type Either<Left, Right> = {
  ap: <A>(r: Either<Left, A>) => Either<Left, A>;
  map: <A>(cb: (arg: Right) => A) => Either<Left, A>;
  mapErr: <A>(cb: (arg: Left) => A) => Either<A, Right>;
  chain: <A>(cb: (arg: Right) => Either<Left, A>) => Either<Left, A>;
  chainErr: <A>(cb: (arg: Left) => Either<A, Right>) => Either<A, Right>;
  swap: () => Either<Left, Right>;
  bimap: <B, A>(ok: (arg: Right) => A, err: (arg: Left) => B) => Either<B, A>;
  cata: <B, A>(obj: { Ok: (arg: Right) => A; Err: (arg: Left) => B }) => A | B;
  inspect: () => string;
  isErr: () => boolean;
  isOk: () => boolean;
};

const _Right = <O>(arg: O): Either<any, O> => ({
  ap: <A>(r: Either<any, A>) =>
    typeof arg === "function" ? r.map((x) => arg(x)) : Left(),
  map: <A>(cb: (a: O) => A): Either<any, A> => _Right(cb(arg)),
  mapErr: (): Either<any, O> => _Right(arg),
  chain: <A>(cb: (a: O) => Either<any, A>): Either<A, any> => cb(arg),
  chainErr: () => _Right(arg),
  swap: () => _Left(arg),
  bimap: (ok, _) => _Right(ok(arg)),
  cata: (obj) => obj.Ok(arg),
  inspect: () => `Right(${arg})`,
  isErr: () => false,
  isOk: () => true,
});

const _Left = <E>(arg: E): Either<E, any> => ({
  ap: () => _Left(arg),
  map: () => _Left(arg),
  mapErr: <A>(cb: (a: E) => A): Either<A, any> => _Left(cb(arg)),
  chain: () => _Left(arg),
  chainErr: (cb) => cb(arg),
  swap: () => _Right(arg),
  bimap: (_, err) => _Left(err(arg)),
  cata: (obj) => obj.Err(arg),
  inspect: () => `Left(${arg})`,
  isErr: () => true,
  isOk: () => false,
});

export function Right(): Either<any, any>;
export function Right<O>(arg: O): Either<O, any>;
export function Right<O>(arg?: O): Either<O | undefined, any> {
  return _Right(arg);
}

export function Left(): Either<any, any>;
export function Left<E>(arg: E): Either<any, E>;
export function Left<E>(arg?: E): Either<any, E | undefined> {
  return _Left(arg);
}
