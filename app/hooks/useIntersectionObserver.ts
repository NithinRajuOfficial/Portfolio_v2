"use client";

import { useEffect } from "react";

export function useIntersectionObserver<T extends Element>(
  getElements: () => (T | null)[],
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const elements = getElements().filter((el): el is T => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(callback, options);

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
