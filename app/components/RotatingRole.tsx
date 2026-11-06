"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

const roles = ["Developer", "Problem Solver", "MERN Engineer"];

export default function RotatingRole() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    let fadeTimeout: ReturnType<typeof setTimeout>;

    const interval = setInterval(() => {
      setIsVisible(false);

      fadeTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % roles.length);
        setIsVisible(true);
      }, 300);
    }, 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimeout);
    };
  }, [prefersReducedMotion]);

  return (
    <span
      className={`inline-block transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {roles[index]}
    </span>
  );
}
