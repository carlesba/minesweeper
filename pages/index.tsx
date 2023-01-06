import { Panel } from "components/Panel";
import { Board } from "components/Board";

const Title = () => (
  <h1
    className="text-[5vmin] font-extrabold text-gray-800 inline-block text-shadow-texture"
    style={{ letterSpacing: "-0.3vmin" }}
  >
    Minesweeper
  </h1>
);

export default function Home() {
  return (
    <div className="h-screen w-screen bg-gray-400 flex flex-wrap justify-between items-center flex-col">
      <div className="h-[10vmin] w-[80vmin]">
        <Title />
      </div>
      <div className="h-[80vmin] w-[80vmin]">
        <Board />
      </div>

      <div className="h-[10vmin] w-[80vmin]">
        <Panel />
      </div>
    </div>
  );
}
