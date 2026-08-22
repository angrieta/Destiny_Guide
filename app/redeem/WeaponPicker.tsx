"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import styles from "./redeem.module.css";

/** A native datalist drops 466 rows over the page in one column. This shows the
 *  matches for what has been typed, inside the panel, and lets them be scrolled
 *  or arrow-keyed. */
const SHOWN = 60;

export function WeaponPicker({
  value,
  options,
  placeholder,
  label,
  moreLabel,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  label: string;
  /** Rendered with the hidden count, e.g. "23 more - keep typing". */
  moreLabel: (count: number) => string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const query = value.trim().toLowerCase();
  const found = useMemo(
    () => (query ? options.filter((option) => option.toLowerCase().includes(query)) : options),
    [options, query],
  );
  const matches = found.slice(0, SHOWN);
  const hidden = found.length - matches.length;

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row visible while arrowing through a long list.
  useEffect(() => {
    if (!open || active < 0) return;
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (option: string) => {
    onChange(option);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => {
        const next = current + step;
        if (next < 0) return matches.length - 1;
        if (next >= matches.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Enter" && open && active >= 0 && matches[active]) {
      event.preventDefault();
      choose(matches[active]);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className={styles.combo} ref={wrap}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && matches.length > 0 && (
        <ul className={styles.comboList} id={listId} role="listbox" ref={list}>
          {matches.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option === value}
              className={index === active ? styles.comboActive : undefined}
              // The input keeps focus, so the click has to land before blur.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {option}
            </li>
          ))}
          {hidden > 0 && <li className={styles.comboMore}>{moreLabel(hidden)}</li>}
        </ul>
      )}
    </div>
  );
}
