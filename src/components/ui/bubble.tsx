import * as React from "react";

type BubbleProps = {
  id: string;
  x: number;
  y: number;
  size?: number;
  opacity?: number;
};

export default function Bubble({ id, x, y, size = 14, opacity = 0.85 }: BubbleProps) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 0 8px rgba(255,255,255,0.6)",
    opacity,
    pointerEvents: "none",
    transition: "top 0.08s linear, left 0.08s linear, opacity 0.2s linear, transform 0.2s linear",
  };

  return <div key={id} data-bubble-id={id} style={style} />;
}
