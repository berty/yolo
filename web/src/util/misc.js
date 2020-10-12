import { useEffect, useRef } from 'react'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function usePrevious(value) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}
