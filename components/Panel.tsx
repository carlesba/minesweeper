import { useDispatchAction, useReadGame } from "game/store";
import { match } from "ts-pattern";

function FlagsButton() {
  const flagging = useReadGame((s) => s.flagging);
  const dispatch = useDispatchAction();
  const toggleFlagging = () => dispatch({ type: "toggleFlagging" });
  return (
    <button
      className={`text-[3vh] font-extrabold text-gray-800 text-shadow-texture rounded-full h-full aspect-square ${
        flagging ? "bg-gray-400 shadow-pushed" : "bg-transparent grayscale"
      }`}
      onClick={toggleFlagging}
    >
      🚩
    </button>
  );
}

function FlagsCounter() {
  const count = useReadGame((s) => s.mines - s.flags.size);
  return (
    <div className="text-[5vh] font-extrabold text-shadow-texture">
      {count}
    </div>
  );
}

function TimerPanel() {
  const seconds = useReadGame((s) => s.secondsLeft);
  return (
    <div
      className={`text-[5vh] font-extrabold text-shadow-texture ${match(
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
    <div className="flex justify-center items-stretch w-full">
      <div className="w-2/6 text-center">
        <FlagsCounter />
      </div>
      <div className="w-2/6 text-center">
        <FlagsButton />
      </div>
      <div className="w-2/6 text-center">
        <TimerPanel />
      </div>
    </div>
  );
}
