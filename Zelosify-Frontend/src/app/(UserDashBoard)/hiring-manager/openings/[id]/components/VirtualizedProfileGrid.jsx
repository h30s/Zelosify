"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProfileCard from "./ProfileCard";

const ROW_HEIGHT = 390;
const GAP = 20;

export default function VirtualizedProfileGrid({ profiles, cardProps }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setWidth(container.clientWidth));
    observer.observe(container);
    setWidth(container.clientWidth);
    return () => observer.disconnect();
  }, []);

  const columns = width >= 768 ? 2 : 1;
  const rowCount = Math.ceil(profiles.length / columns);
  const visible = useMemo(() => {
    const viewportHeight = containerRef.current?.clientHeight || 720;
    const firstRow = Math.max(0, Math.floor(scrollTop / (ROW_HEIGHT + GAP)) - 1);
    const lastRow = Math.min(
      rowCount,
      Math.ceil((scrollTop + viewportHeight) / (ROW_HEIGHT + GAP)) + 1
    );
    return profiles.slice(firstRow * columns, lastRow * columns).map((profile, index) => ({
      profile,
      itemIndex: firstRow * columns + index,
    }));
  }, [columns, profiles, rowCount, scrollTop]);

  if (profiles.length <= 50) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {profiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} {...cardProps(profile)} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      className="relative h-[72vh] min-h-[520px] overflow-auto"
      aria-label="Candidate profiles"
    >
      <div className="relative" style={{ height: rowCount * (ROW_HEIGHT + GAP) }}>
        {visible.map(({ profile, itemIndex }) => {
          const column = itemIndex % columns;
          const row = Math.floor(itemIndex / columns);
          const widthStyle = columns === 1 ? "100%" : `calc((100% - ${GAP}px) / 2)`;
          return (
            <div
              key={profile.id}
              className="absolute"
              style={{
                top: row * (ROW_HEIGHT + GAP),
                left: columns === 1 ? 0 : `calc(${column * 50}% + ${column * GAP * 0.5}px)`,
                width: widthStyle,
                minHeight: ROW_HEIGHT,
              }}
            >
              <ProfileCard profile={profile} {...cardProps(profile)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
