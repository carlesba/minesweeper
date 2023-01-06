import { Fragment } from "react";
import * as Tiles from "./Tiles";
import { allPositions, useDispatchAction, useReadGame } from "game/store";
import { Position } from "game/minesweeper";
import { match } from "ts-pattern";

function GameTile(props: { id: string }) {
  const tile = useReadGame((s) => s.tiles.get(props.id)!);
  const gameOver = useReadGame(
    (s) => s.status === "overtime" || s.status === "boom"
  );
  const dispatch = useDispatchAction();
  const flagged = useReadGame((s) => s.flags.has(props.id));
  const reveal = () =>
    dispatch({ type: "select", position: Position.positionFromId(props.id) });

  return match({ tile, gameOver })
    .with({ gameOver: true, tile: { type: "mine" } }, () => (
      <Tiles.MineTile id={props.id} />
    ))
    .with({ gameOver: true, tile: { type: "safe" } }, (t) => (
      <Tiles.SafeTile id={props.id} count={t.tile.count} />
    ))
    .with({ tile: { checked: false } }, () => (
      <Tiles.UnCheckedTile id={props.id} flagged={flagged} onClick={reveal} />
    ))
    .with({ tile: { type: "safe", count: 0 } }, () => (
      <Tiles.SafeTile id={props.id} count={0} />
    ))
    .with({ tile: { type: "safe" } }, (t) => (
      <Tiles.SafeTile id={props.id} count={t.tile.count} />
    ))
    .otherwise(() => <Tiles.MineTile id={props.id} />);
}

export function Board() {
  const size = useReadGame((s) => s.size);
  return (
    <div
      className="grid aspect-square w-full gap-[1vmin]"
      style={{
        gridTemplateColumns: `repeat(${size.x}, 1fr)`,
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
