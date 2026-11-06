"use client";

import { useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useIntersectionObserver } from "./useIntersectionObserver";

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useIntersectionObserver(
    () => [ref.current],
    ([entry], observer) => {
      if (entry?.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    },
    { threshold: 0.15 },
  );

  const isRevealed = prefersReducedMotion || isVisible;

  const revealClass = prefersReducedMotion
    ? ""
    : `transition-all duration-700 ease-out ${
        isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`;

  return { ref, revealClass };
}
