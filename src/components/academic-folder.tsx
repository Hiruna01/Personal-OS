"use client";

import Folder, { type FolderItem } from "@/components/react-bits/Folder";

/** Shared folder treatment for the academic hierarchy. */
export function AcademicFolder({
  label,
  href,
  items,
  current = false,
}: {
  label: string;
  href: string;
  items: FolderItem[];
  current?: boolean;
}) {
  return (
    <Folder
      label={label}
      href={href}
      items={items}
      mode="flap"
      variant="matte"
      color={current ? "#bcbcbc" : "#d4d4d4"}
      paperColor="#ffffff"
      tabPosition="left"
      size={0.78}
      theme="light"
      open={false}
      draggable={false}
      zoomOnClick={false}
      intro={false}
      tilt={0}
      bounce={0}
      speed={2.5}
      peek
    />
  );
}
