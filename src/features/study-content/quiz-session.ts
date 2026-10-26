"use client";

import { useState } from "react";

export type QuestionState = {
  selected: string[];
  review: "checked" | "revealed" | null;
};
export const emptyState: QuestionState = { selected: [], review: null };

// Shared between the page and its lazily loaded reader. Never persisted.
export function useQuizSession() {
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState<Record<number, QuestionState>>({});
  function update(number: number, value: QuestionState) {
    setStates((previous) => ({ ...previous, [number]: value }));
  }
  return { index, setIndex, states, update };
}
