"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

import GridLayout from "./GridLayout";

const navLinks = [
  { hash: "home", label: "Home" },
  { hash: "about", label: "About" },
  // { hash: "skills", label: "Skills" },
  { hash: "projects", label: "Projects" },
  { hash: "contact", label: "Contact" },
];

// How far from the top of the viewport a section's top edge must be to count
// as "active". Matches roughly the navbar height + a small buffer.
const SCROLL_OFFSET = 80;

function getActiveSection(): string {
  // Work backwards through sections — the last one whose top is at or above
  // the offset line is the one currently in view.
  for (let i = navLinks.length - 1; i >= 0; i--) {
    const el = document.getElementById(navLinks[i].hash);
    if (el && el.getBoundingClientRect().top <= SCROLL_OFFSET) {
      return navLinks[i].hash;
    }
  }
  return navLinks[0].hash;
}

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isClickScrollingRef = useRef(false);
  const clickScrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync active section on scroll.
  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrollingRef.current) return;
      setActiveSection(getActiveSection());
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount to handle direct hash links (e.g. /#contact).
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // After hydration, scroll to the section in the URL hash if present.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && navLinks.some((link) => link.hash === hash)) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  // Close mobile menu when viewport reaches the sm breakpoint.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMenuOpen(false);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    return () => clearTimeout(clickScrollTimeoutRef.current);
  }, []);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, hash: string) => {
    event.preventDefault();
    const element = document.getElementById(hash);
    if (element) {
      isClickScrollingRef.current = true;
      setActiveSection(hash);
      element.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", `#${hash}`);
      clearTimeout(clickScrollTimeoutRef.current);
      clickScrollTimeoutRef.current = setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 1000);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="px-4 py-6 bg-gradient-slant w-full z-30 bg-transparent fixed sm:px-20">
      <GridLayout />
      <div className="flex justify-between items-center">
        <button
          type="button"
          className="text-white sm:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {isMenuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>

        <ul
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } absolute top-full left-0 w-full flex-col items-center gap-4 py-6 bg-darkPurple sm:static sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-10 sm:bg-transparent sm:py-0 text-white font-semibold`}
        >
          {navLinks.map(({ hash, label }) => (
            <li key={hash}>
              <a
                href={`#${hash}`}
                onClick={(event) => handleNavClick(event, hash)}
                className={`hover:scale-110 duration-300 inline-block ${
                  activeSection === hash ? "text-amber-400 font-bold" : ""
                }`}
              >
                {label}
              </a>
            </li>
          ))}

          <li>
            <a
              href="https://drive.google.com/file/d/1FUwUARk3KkgSCCufRIVN25nj-ODkBmPC/view?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 duration-300 inline-block"
            >
              Resume
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
