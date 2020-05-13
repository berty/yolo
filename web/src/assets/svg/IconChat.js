import * as React from 'react'

function IconChat({ stroke }) {
  return (
    <svg width="1.75em" height="1.75em" viewBox="0 0 35 27">
      <g
        stroke={stroke}
        strokeWidth={2}
        fill="none"
        fillRule="evenodd"
        strokeLinejoin="round"
      >
        <path
          d="M14.32 20.209c-.94.3-1.585.368-2.605.369a9.57 9.57 0 01-4.286-1L1 21.688l2.143-6.332a9.198 9.198 0 01-1.015-4.223c.001-3.576 2.054-6.845 5.301-8.444a9.571 9.571 0 014.286-1h.564c3.427.186 5.474 1.575 7.357 4.294"
          strokeLinecap="round"
        />
        <path d="M13 15.133a9.312 9.312 0 001 4.222 9.444 9.444 0 008.444 5.223 9.311 9.311 0 004.223-1L33 25.688l-2.111-6.333a9.311 9.311 0 001-4.222 9.444 9.444 0 00-5.222-8.444 9.312 9.312 0 00-4.223-1h-.555A9.422 9.422 0 0013 14.578v.555z" />
      </g>
    </svg>
  )
}

export default IconChat
