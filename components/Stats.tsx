import classNames from "classnames";
import { StatsState, statsStore } from "game/stats";
import { useSyncExternalStore } from "react";

const useGetStats = <T,>(selector: (s: StatsState) => T) =>
  useSyncExternalStore(
    statsStore.subscribe,
    () => selector(statsStore.getState()),
    () => selector(statsStore.getState())
  );

const useGetCurrentDate = () =>
  useSyncExternalStore(
    statsStore.subscribe,
    () => statsStore.getLatestDate(),
    () => statsStore.getLatestDate()
  );

const Title = (props: { children: string }) => (
  <h2 className="text-[3vh] font-bold text-gray-800 text-center mt-[1vh]">
    {props.children}
  </h2>
);

const formatTime = (time: number) => {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = date.getDate();
  const hours = date.getHours();
  let minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

function DisplayPercentage(props: { title: string; value: number }) {
  return (
    <div>
      <div className="text-[3vh] text-gray-600 text-center text-shadow-texture">
        {Math.round(100 * props.value)}%
      </div>
      <div className="text-[1vh] text-gray-600 text-center text-shadow-texture">
        {props.title}
      </div>
    </div>
  );
}

const Rank = (props: {
  position: number;
  date: number;
  seconds: number;
  current?: boolean;
}) => (
  <div
    className={classNames(
      "text-[2vh] text-gray-800 text-center flex justify-around",
      {
        "bg-yellow-100": props.current,
      }
    )}
  >
    <span className="font-bold">#{props.position}</span>
    <span>{formatTime(props.date)}</span>
    <span>{props.seconds + '"'}</span>
  </div>
);
export function Stats() {
  const stats = useGetStats((s) => s);
  const statsWin = useGetStats((s) => s.data.win || 0);
  const statsMine = useGetStats((s) => s.data.mine || 0);
  const statsTime = useGetStats((s) => s.data.time || 0);

  const currentDate = useGetCurrentDate();
  const total = statsWin + statsMine + statsTime;
  return (
    <div className="w-full">
      <Title>Stats</Title>
      {stats.ranks.slice(0, 3).map((r, i) => (
        <Rank
          key={i}
          position={i + 1}
          date={r.date}
          seconds={r.time}
          current={currentDate === r.date}
        />
      ))}
      {stats.ranks.length > 0 && <hr className="my-[1vh]" />}
      <div className="flex justify-around">
        <DisplayPercentage title="Win" value={statsWin / total} />
        <DisplayPercentage title="Mines" value={statsMine / total} />
        <DisplayPercentage title="Time" value={statsTime / total} />
      </div>
    </div>
  );
}
