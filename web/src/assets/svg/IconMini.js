import * as React from "react";

function IconMini({ stroke = "" }) {
  return (
    <svg width="1.75em" height="1.75em" viewBox="0 0 35 27">
      <g
        transform="translate(2 2)"
        stroke={stroke || undefined}
        strokeWidth={2}
        fill="none"
        fillRule="evenodd"
      >
        <rect x={-1} y={-1} width={33} height={25} rx={3} />
        <path
          d="M4 16l5-3-5-3M28 3.5h-1M24 3.5h-1M20 3.5h-1M12 15.5h4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default IconMini;
