import * as React from "react";

type BubbleProps = {
  id: string;
  x: number;
  y: number;
  size?: number;
  opacity?: number;
};

export default function Bubble({ id, x, y, size = 14, opacity = 0.95 }: BubbleProps) {
  const imgStyle: React.CSSProperties = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    opacity,
    transition: "top 0.08s linear, left 0.08s linear, opacity 0.18s linear, transform 0.18s linear",
    willChange: "top, left, opacity",
  };

  return (
    <img
      key={id}
      data-bubble-id={id}
      src="/bubble.png"
      alt="bubble"
      style={imgStyle}
    />
  );
}
