import { Panel } from "components/Panel";
import { Board } from "components/Board";
import { Notifications } from "components/Notifications";

const Title = () => (
  <h1 className="text-[5vh] font-extrabold text-gray-800 text-center text-shadow-texture letter-spacing-s">
    Minesweeper
  </h1>
);

export default function Home() {
  return (
    <Notifications>
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
    </Notifications>
  );
}
