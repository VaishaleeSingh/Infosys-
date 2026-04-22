"use client";

/**
 * Thin draggable splitter. Renders a 4px-ish strip; on pointer drag it
 * calls `onDrag(fraction)` with the new 0–1 position of the split,
 * measured relative to the parent element it's placed inside.
 *
 * Two flavours:
 *   <Splitter orientation="vertical" ... />   — draggable along X (for
 *   a left|right split; sits between two columns)
 *   <Splitter orientation="horizontal" ... /> — draggable along Y (for
 *   a top/bottom split; sits between two rows)
 *
 * Parent must be `position: relative` (or be the direct flex/grid
 * container containing the two panes whose split we manipulate).
 */

import { useCallback, useEffect, useRef } from "react";
import clsx from "clsx";

type Props = {
  orientation: "vertical" | "horizontal";
  /** Called with the new fraction 0–1. Clamping is up to the store. */
  onDrag: (fraction: number) => void;
  /** Title/tooltip for a11y. */
  title?: string;
};

export function Splitter({ orientation, onDrag, title }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const el = ref.current;
      if (!el?.parentElement) return;
      const rect = el.parentElement.getBoundingClientRect();
      if (orientation === "vertical") {
        const f = (e.clientX - rect.left) / rect.width;
        onDrag(f);
      } else {
        const f = (e.clientY - rect.top) / rect.height;
        onDrag(f);
      }
    },
    [orientation, onDrag]
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  return (
    <div
      ref={ref}
      role="separator"
      title={title}
      aria-orientation={orientation === "vertical" ? "vertical" : "horizontal"}
      onPointerDown={onPointerDown}
      className={clsx(
        "relative group z-10 select-none",
        orientation === "vertical"
          ? "w-[6px] cursor-col-resize bg-panelBorder hover:bg-infy-400/70"
          : "h-[6px] cursor-row-resize bg-panelBorder hover:bg-infy-400/70",
        "transition-colors"
      )}
    >
      {/* Grabber dots — visual hint in the middle of the splitter. */}
      <div
        className={clsx(
          "absolute flex gap-0.5 opacity-60 group-hover:opacity-100",
          orientation === "vertical"
            ? "left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex-col"
            : "top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex-row"
        )}
      >
        <span className="w-[2px] h-[2px] bg-gray-500 rounded-full" />
        <span className="w-[2px] h-[2px] bg-gray-500 rounded-full" />
        <span className="w-[2px] h-[2px] bg-gray-500 rounded-full" />
      </div>
    </div>
  );
}
