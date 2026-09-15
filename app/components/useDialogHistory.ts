"use client";

import { useEffect, useRef } from "react";
import "../../scripts/modal-history.js";

type DialogControls = { open(): void; close(): void };
declare global {
  interface Window {
    DestinyModalHistory?: {
      readonly pending: boolean;
      bind(id: string, show: () => void, hide: () => void, root?: Element | null): DialogControls;
      navigate(url: string): void;
    };
  }
}

export function useDialogHistory(id: string, value: boolean | string | null, close: () => void, restore: () => void, detailParam?: string) {
  const dismiss = useRef(close);
  const reopen = useRef(restore);
  const controls = useRef<DialogControls | null>(null);
  dismiss.current = close;
  useEffect(() => {
    if (!controls.current) {
      controls.current = window.DestinyModalHistory?.bind(id, () => reopen.current(), () => dismiss.current()) ?? null;
    }
    if (value) {
      // Keep the last open value for Forward; a closing render has no selection.
      if (detailParam) {
        const url = new URL(window.location.href);
        url.searchParams.delete(detailParam);
        window.history.replaceState(window.history.state, "", url);
      }
      reopen.current = restore;
      controls.current?.open();
    } else {
      controls.current?.close();
    }
  }, [id, value]);
}
