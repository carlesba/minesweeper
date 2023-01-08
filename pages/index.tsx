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
    className="text-[5vh] font-extrabold text-gray-800 text-center text-shadow-texture"
    style={{ letterSpacing: "-0.3vh" }}
  >
    Minesweeper
  </h1>
);

function Notification(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-[40vh] bg-gray-100 p-[2vh] rounded-2xl shadow-2xl flex flex-wrap justify-start items-center flex-col">
      <h1
        className="text-[5vh] font-extrabold text-gray-800 text-center text-shadow-texture"
        style={{ letterSpacing: "-0.3vh" }}
      >
        {props.title}
      </h1>
      {props.children}
    </div>
  );
}

function ButtonNotification(props: { title: string; onClick: () => void }) {
  return (
    <button
      className="w-full py-2 px-4 bg-gray-300 text-gray-800 shadow-touchable active:shadow-pushed select-none text-[3vh] rounded-xl mt-[3vh] font-bold"
      onClick={props.onClick}
    >
      {props.title}
    </button>
  );
}

function Notifications() {
  const status = useReadGame((s) => s.status);
  const dispatch = useDispatchAction();
  const start = () =>
    dispatch({ type: "restart", mines: MINES, seconds: SECONDS, size: SIZE });

  return (
    <Notification
      title={match(status)
        .with("win", () => "All cleared!")
        .with("boom", () => "Mine found!")
        .with("overtime", () => "Time is up!")
        .with("idle", () => "Welcome to Minesweeper!")
        .otherwise(() => "")}
    >
      {match(status)
        .with("win", () => (
          <ButtonNotification title="Play again" onClick={start} />
        ))
        .with("idle", () => "")
        .otherwise(() => (
          <ButtonNotification title="Play again" onClick={start} />
        ))}
    </Notification>
  );
}

function NotificationController(props: { children: React.ReactNode }) {
  const status = useReadGame((s) => s.status);
  const notificationVisible = status !== "on";

  return (
    <div>
      <div
        className={`transition-transform fixed top-0 left-0 flex justify-center items-center z-10 h-screen w-screen bg-gray-400 bg-transparent duration-200 ${
          notificationVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 pointer-events-none translate-y-[10vh]"
        }`}
      >
        <Notifications />
      </div>
      <div
        className={`filter transition-filter duration-200 ${
          notificationVisible ? "blur-[0.5vh]" : ""
        }`}
      >
        {props.children}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <NotificationController>
      <div className="h-screen w-screen bg-gray-100 flex flex-wrap justify-start items-center flex-col">
        <div className="h-[10vh] w-[40vh]">
          <Title />
        </div>
        <div className="w-[40vh]">
          <Board />
        </div>
        <div className="w-[40vh] pt-[3vh]">
          <Panel />
        </div>
      </div>
    </NotificationController>
  );
}
