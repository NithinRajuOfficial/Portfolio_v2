"use client";

import type { HTMLAttributes, ElementType } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface RevealSectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  delay?: number;
}

export default function RevealSection({
  as: Component = "div",
  delay = 0,
  className = "",
  children,
  ...rest
}: RevealSectionProps) {
  const { ref, revealClass } = useScrollReveal<HTMLElement>();

  return (
    <Component
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${className} ${revealClass}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
}
