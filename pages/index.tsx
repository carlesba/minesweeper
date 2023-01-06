import { Panel } from "components/Panel";
import { Board } from "components/Board";
import {
  MINES,
  SECONDS,
  SIZE,
  useDispatchAction,
  useReadGame,
} from "game/store";
import { match } from "ts-pattern";

const Title = () => (
  <h1
    className="text-[5vmin] font-extrabold text-gray-800 text-center text-shadow-texture"
    style={{ letterSpacing: "-0.3vmin" }}
  >
    Minesweeper
  </h1>
);

function NotificationController(props: { children: React.ReactNode }) {
  const status = useReadGame((s) => s.status);
  const notificationVisible = status !== "on";
  const dispatch = useDispatchAction();
  const start = () =>
    dispatch({ type: "restart", mines: MINES, seconds: SECONDS, size: SIZE });

  return (
    <div className="transition-all">
      <div
        style={{
          transform: notificationVisible ? "translateY(0)" : "translateY(10vh)",
          transitionDuration: "0.2s",
        }}
        className={`fixed top-0 left-0 flex justify-center items-center z-10 h-screen w-screen bg-gray-400 bg-transparent ${
          notificationVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[40vh] bg-gray-500 p-[2vh] rounded-2xl shadow-2xl flex flex-wrap justify-start items-center flex-col ">
          <h1
            className="text-[5vmin] font-extrabold text-gray-800 text-center text-shadow-texture"
            style={{ letterSpacing: "-0.3vmin" }}
          >
            {match(status)
              .with("win", () => "All cleared!")
              .with("boom", () => "Mine found!")
              .with("overtime", () => "Time is up!")
              .with("idle", () => "Welcome to Minesweeper!")
              .otherwise(() => "")}
          </h1>
          <button
            className="w-full py-2 px-4 bg-gray-400 text-[3vh] rounded-xl mt-[3vh] font-bold"
            onClick={start}
          >
            {match(status)
              .with("idle", () => "Play")
              .otherwise(() => "Play again")}
          </button>
        </div>
      </div>
      <div
        style={notificationVisible ? { filter: "blur(2px)" } : { filter: "" }}
      >
        {props.children}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <NotificationController>
      <div className="h-screen w-screen bg-gray-400 flex flex-wrap justify-between items-center flex-col">
        <div className="h-[10vh] w-[40vmin]">
          <Title />
        </div>
        <div className="h-[80vh] w-[40vh]">
          <Board />
        </div>
        <div className="h-[10vh] w-[40vmin]">
          <Panel />
        </div>
      </div>
    </NotificationController>
  );
}
