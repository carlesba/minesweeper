import classnames from "classnames";
const DEBUG = false;

const Tile = (props: {
  id: string;
  onClick?(): void;
  className: string;
  content?: string;
}) => (
  <div
    className={classnames(
      "aspect-square rounded-full relative flex justify-center items-center transition-colors font-bold text-[3vh]",
      props.className
    )}
    data-id={props.id}
    onClick={props.onClick}
  >
    {props.content}
    {!!props.content && (
      <div className="absolute inset-0 flex justify-center items-center text-transparent text-shadow-texture">
        {props.content}
      </div>
    )}
  </div>
);

export const MineTile = (props: { id: string; solved?: boolean }) => (
  <Tile
    className={classnames("shadow-pushed", {
      "bg-red-600": !props.solved,
      "bg-green-600": props.solved,
    })}
    id={props.id}
    content="💣"
  />
);

const classNames = [
  "text-transparent",
  "text-sky-700",
  "text-green-700",
  "text-yellow-700",
  "text-orange-700",
  "text-purple-700",
  "text-pink-700",
  "text-indigo-700",
  "text-red-700",
  "text-gray-900",
];

export const SafeTile = (props: { id: string; count: number }) => (
  <Tile
    className={classnames(
      classNames[props.count],
      "bg-transparent shadow-pushed"
    )}
    id={props.id}
    content={props.count.toString()}
  />
);

export const UnCheckedTile = (props: {
  id: string;
  flagged?: boolean;
  type: "mine" | "safe";
  onClick(): void;
}) => (
  <Tile
    className="bg-gray-300 shadow-touchable hover:shadow-pushed"
    id={props.id}
    onClick={props.onClick}
    content={
      props.flagged ? "🚩" : !DEBUG ? "" : props.type === "mine" ? "💣" : ""
    }
  />
);
