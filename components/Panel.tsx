import {
  MINES,
  SECONDS,
  SIZE,
  useDispatchAction,
  useReadGame,
} from "game/store";
import { match } from "ts-pattern";

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

function FlagsPanel() {
  return <button className="text-[3vmin] font-extrabold text-gray-800 text-shadow-texture grayscale" onClick={() => {}}>🚩 Flags</button>;
}

function TimerPanel() {
  const seconds = useReadGame((s) => s.secondsLeft);
  return (
    <div
      className={`text-[5vmin] font-extrabold text-shadow-texture ${match(
        seconds
      )
        .when(
          (s) => s <= 10,
          () => "text-pink-900"
        )
        .otherwise(() => "text-gray-800")}`}
    >
      {seconds + '"'}
    </div>
  );
}

export function Panel() {
  return (
    <div className="flex justify-around w-full">
      <FlagsPanel />
      <TimerPanel />
    </div>
  );
}
