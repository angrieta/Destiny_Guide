"use client";

import { useEffect } from "react";

/**
 * Publishes the real header height as --header-h on :root.
 *
 * The header wraps its nav onto a second row, so its height depends on the
 * viewport and on how long the translated menu labels are. Sticky offsets that
 * hard-code a height end up overlapping the header or floating below it, so they
 * read this variable instead.
 */
export function useHeaderHeight() {
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    const publish = () => {
      const height = Math.round(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--header-h", `${height}px`);
    };

    const observer = new ResizeObserver(publish);
    observer.observe(header);
    observer.observe(document.documentElement);
    publish();

    return () => observer.disconnect();
  }, []);
}
