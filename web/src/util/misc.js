import { useEffect, useRef } from "react";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const scramble = (str) =>
  String.fromCharCode(...Array.from(str).map((_, i) => str.charCodeAt(i) + 1));
