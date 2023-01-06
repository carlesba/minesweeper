import { Fragment } from "react";
import * as Tiles from "./Tiles";
import { allPositions, useDispatchAction, useReadGame } from "game/store";
import { Position } from "game/minesweeper";
import { match } from "ts-pattern";

function GameTile(props: { id: string }) {
  const tile = useReadGame((s) => s.tiles.get(props.id)!);
  const dispatch = useDispatchAction();
  const reveal = () =>
    dispatch({ type: "reveal", position: Position.positionFromId(props.id) });

  return match(tile)
    .with({ checked: false }, () => (
      <Tiles.UnCheckedTile id={props.id} onClick={reveal} />
    ))
    .with({ type: "safe", count: 0 }, () => (
      <Tiles.SafeTile id={props.id} count={0} />
    ))
    .with({ type: "safe" }, (t) => (
      <Tiles.SafeTile id={props.id} count={t.count} />
    ))
    .otherwise(() => <Tiles.MineTile id={props.id} />);
}

export function Board() {
  return (
    <div
      className="grid aspect-square w-full gap-[1vmin]"
      style={{
        gridTemplateColumns: "repeat(10, 1fr)",
        gridAutoRows: "1fr",
      }}
    >
      {allPositions.map((row, index) => (
        <Fragment key={index}>
          {row.map((id) => (
            <GameTile key={id} id={id} />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
