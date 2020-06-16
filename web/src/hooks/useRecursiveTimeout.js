import { useEffect, useRef } from 'react'

/**
 * Source: https://www.aaron-powell.com/posts/2019-09-23-recursive-settimeout-with-react-hooks/
 */
export const useRecursiveTimeout = (
  callback = () => { },
  delay = 0,
) => {
  const savedCallback = useRef(callback)

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the timeout loop.
  // eslint-disable-next-line consistent-return
  useEffect(() => {
    let timerId
    function tick() {
      savedCallback.current()

      if (delay !== null) {
        timerId = setTimeout(tick, delay)
      }
    }
    if (delay !== null) {
      timerId = setTimeout(tick, delay)
      return () => timerId && clearTimeout(timerId)
    }
  }, [delay])
}
