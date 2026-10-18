"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityDialog } from "@/components/entity-dialog";
import { Status, campusPath, dateLabel } from "@/components/page-parts";
import type { Lecture } from "@/types/domain";

export type LectureMaterialCounts = {
  notes: number;
  quizzes: number;
  tutorials: number;
  practicals: number;
  essays: number;
};

export function LectureChapter({
  lecture,
  index,
  total,
  counts,
  base,
  demo,
  pending,
  onMove,
}: {
  lecture: Lecture;
  index: number;
  total: number;
  counts: LectureMaterialCounts;
  base: string;
  demo: boolean;
  pending: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const materialLabels = [
    [counts.notes, "note", "notes"],
    [counts.quizzes, "quiz", "quizzes"],
    [counts.tutorials, "tutorial", "tutorials"],
    [counts.practicals, "practical", "practicals"],
    [counts.essays, "essay", "essays"],
  ] as const;
  const materials = materialLabels.filter(([count]) => count > 0);
  return (
    <>
      <Item
        variant="outline"
        className="chapter-card"
        role="listitem"
        render={<article />}
        aria-busy={pending}
      >
        <ItemMedia
          className="chapter-number"
          aria-label={`Lecture ${index + 1}`}
        >
          {String(index + 1).padStart(2, "0")}
        </ItemMedia>
        <ItemContent className="chapter-content">
          <ItemTitle>
            <h2>
              <Link
                className="chapter-link"
                href={`${base}${campusPath}/lectures/${lecture.id}`}
              >
                {lecture.title}
              </Link>
            </h2>
          </ItemTitle>
          {lecture.topic && (
            <ItemDescription className="chapter-topic">
              {lecture.topic}
            </ItemDescription>
          )}
          <div className="chapter-materials">
            {lecture.lecture_date && (
              <span className="chapter-date">
                <CalendarDays aria-hidden="true" />
                {dateLabel(lecture.lecture_date)}
              </span>
            )}
            {materials.length ? (
              materials.map(([count, singular, plural]) => (
                <span key={singular}>
                  {count} {count === 1 ? singular : plural}
                </span>
              ))
            ) : (
              <span>No materials yet</span>
            )}
          </div>
        </ItemContent>
        <ItemActions className="chapter-actions">
          <Status value={lecture.study_status} />
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                ref={menuTrigger}
                variant="ghost"
                size="icon-sm"
                className="chapter-menu"
                aria-label={`Actions for ${lecture.title}`}
                disabled={pending}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="chapter-menu-content"
              onCloseAutoFocus={(event) => {
                if (editing) event.preventDefault();
              }}
            >
              <DropdownMenuItem
                onSelect={() => {
                  setMenuOpen(false);
                  setEditing(true);
                }}
              >
                <Pencil />
                Edit lecture
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={demo || pending || index === 0}
                onSelect={() => onMove(lecture.id, -1)}
              >
                <ArrowUp />
                Move up
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={demo || pending || index === total - 1}
                onSelect={() => onMove(lecture.id, 1)}
              >
                <ArrowDown />
                Move down
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemActions>
      </Item>
      <EntityDialog
        kind="lecture"
        initial={lecture}
        demo={demo}
        open={editing}
        onOpenChange={setEditing}
        hideTrigger
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          menuTrigger.current?.focus();
        }}
      />
    </>
  );
}
