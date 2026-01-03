import { store, useDispatchAction, useReadGame } from "game/state";
import { match } from "ts-pattern";
import { useSyncExternalStore } from "react";
import { Store } from "data/Store";
import classNames from "classnames";
import { Stats } from "components/Stats";

const Title = (props: { children: string }) => (
  <h1 className="text-[5vh] font-extrabold text-gray-800 text-center text-shadow-texture letter-spacing-s mb-[3vh]">
    {props.children}
  </h1>
);

const Message = (props: { children: string }) => (
  <h1 className="text-[3vh] text-gray-600 text-center">{props.children}</h1>
);

function ButtonNotification(props: { title: string; onClick: () => void }) {
  return (
    <button
      className="w-full py-2 px-4 bg-gray-300 text-gray-800 shadow-touchable active:shadow-pushed select-none text-[3vh] rounded-xl mb-[3vh] font-bold"
      onClick={props.onClick}
    >
      {props.title}
    </button>
  );
}

function Notification(props: {
  title: string;
  message?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-[40vh] bg-gray-100 p-[2vh] rounded-2xl shadow-2xl flex flex-wrap justify-start items-center flex-col">
      <Title>{props.title}</Title>
      {props.message && <Message>{props.message}</Message>}
      {props.children}
    </div>
  );
}

function Menu(props: { onStartGame(): void; onClose(): void; showStats?: boolean }) {
  return (
    <Notification title="Menu">
      <div>
        <ButtonNotification title="New Game" onClick={props.onStartGame} />
        <ButtonNotification title="Close" onClick={props.onClose} />
      </div>
      {props.showStats && <Stats />}
    </Notification>
  );
}

function BlurredOverlay(props: {
  visible?: boolean;
  over?: React.ReactNode;
  content: React.ReactNode;
  onClick?(): void;
}) {
  return (
    <div onClick={props.onClick}>
      <div
        className={classNames(
          "ease-out-expo transition-all fixed top-0 left-0 flex justify-center items-center z-10 h-screen w-screen bg-gray-400 bg-transparent duration-500",
          {
            "opacity-100 translate-y-[-10vh]": props.visible,
            "opacity-0 pointer-events-none translate-y-0": !props.visible,
          }
        )}
      >
        {props.over}
      </div>
      <div
        className={classNames(
          "ease-out-expo filter transition-filter duration-700",
          {
            "blur-[0.5vh]": props.visible,
          }
        )}
      >
        {props.content}
      </div>
    </div>
  );
}

type NotificationState = { visible: boolean; content: "notification" | "menu" };
class NotificationStore {
  private store: Store<NotificationState>;
  constructor() {
    this.store = Store.create({
      visible: false,
      content: "menu",
    } as NotificationState);
  }
  static create() {
    return new NotificationStore();
  }
  getState = () => this.store.getState();
  subscribe: Store<NotificationState>["subscribe"] = (fn) =>
    this.store.subscribe(fn);
  showNotification = () =>
    this.store.dispatch({ visible: true, content: "notification" });
  showMenu = () => this.store.dispatch({ visible: true, content: "menu" });
  hide = () =>
    this.store.dispatch({
      visible: false,
      content: this.store.getState().content,
    });
}
const notificationStore = NotificationStore.create();
store.subscribe((next) => {
  match(next)
    .with({ status: "boom" }, () => notificationStore.showNotification())
    .with({ status: "overtime" }, () => notificationStore.showNotification())
    .with({ status: "win" }, () => notificationStore.showNotification())
    .otherwise(() => {});
});

const useGetNotificationState = <T,>(selector: (s: NotificationState) => T) =>
  useSyncExternalStore(
    notificationStore.subscribe,
    () => selector(notificationStore.getState()),
    () => selector(notificationStore.getState())
  );

export function Notifications(props: { children: React.ReactNode }) {
  const state = useGetNotificationState((s) => s);

  const gameStatus = useReadGame((s) => s.status);

  const gameOver = match(gameStatus)
    .with("win", () => true)
    .with("overtime", () => true)
    .with("boom", () => true)
    .otherwise(() => false);

  const dispatch = useDispatchAction();
  const restart = () => dispatch({ type: "restart" });

  return (
    <BlurredOverlay
      visible={state.visible}
      onClick={() =>
        match({ state: state, gameOver })
          .with({ state: { visible: true, content: "notification" } }, () =>
            notificationStore.hide()
          )
          .with({ state: { visible: false }, gameOver: true }, () =>
            notificationStore.showMenu()
          )
          .otherwise(() => {})
      }
      over={match({ state, gameStatus })
        .with({ state: { content: "menu" } }, () => (
          <Menu
            onStartGame={() => {
              restart();
              notificationStore.hide();
            }}
            onClose={() => notificationStore.hide()}
            showStats={state.visible}
          />
        ))
        .with({ gameStatus: "win" }, () => (
          <Notification title="You won!" message="All cleared!">
            {state.visible && <Stats />}
          </Notification>
        ))
        .with({ gameStatus: "overtime" }, () => (
          <Notification title="Game Over" message="Time's up!">
            {state.visible && <Stats />}
          </Notification>
        ))
        .with({ gameStatus: "boom" }, () => (
          <Notification title="Game Over" message="You hit a mine!">
            {state.visible && <Stats />}
          </Notification>
        ))
        .otherwise(() => (
          <div />
        ))}
      content={props.children}
    />
  );
}
