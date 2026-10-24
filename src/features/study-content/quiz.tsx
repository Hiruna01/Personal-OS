"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Eye,
  Lightbulb,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import type { Quiz, QuizQuestion } from "@/types/domain";
import { Markdown } from "./markdown";

type QuestionState = {
  selected: string[];
  review: "checked" | "revealed" | null;
};
const emptyState: QuestionState = { selected: [], review: null };

function Question({
  question: q,
  name,
  state,
  onChange,
}: {
  question: QuizQuestion;
  name: string;
  state: QuestionState;
  onChange: (state: QuestionState) => void;
}) {
  const reduced = useReducedMotion();
  const answerPanel = useRef<HTMLElement>(null);
  const multiple = q.type === "multiple_response";
  const revealed = state.review !== null;
  const checked = state.review === "checked";
  const correct = q.type === "written" ? [] : multiple ? q.answer : [q.answer];
  const missed = correct.filter((label) => !state.selected.includes(label));
  const incorrect = state.selected.filter((label) => !correct.includes(label));
  const exact = !missed.length && !incorrect.length;
  return (
    <QuestionnaireItem
      name={name}
      multiple={multiple}
      required={false}
      aria-labelledby={`${name}-prompt`}
      className="study-question"
    >
      <QuestionnaireTitle
        id={`${name}-prompt`}
        render={<div />}
        className="quiz-prompt"
      >
        <Markdown source={q.prompt} />
      </QuestionnaireTitle>
      <QuestionnaireDescription className="quiz-guidance">
        {multiple
          ? revealed
            ? "Change a selection to check again, or continue when you’re ready."
            : "Select all that apply. Check your choices when you’re ready."
          : q.type === "mcq"
            ? "Choose an option, or reveal the answer when you’re ready."
            : "Think through your response, then compare it with the model answer."}
      </QuestionnaireDescription>
      {q.options && (
        <QuestionnaireChoices className="quiz-options">
          {q.options.map((option) => {
            const labelId = `${name}-${option.label}-label`;
            const selected = state.selected.includes(option.label);
            const answer = revealed && correct.includes(option.label);
            const wrong = checked && selected && !answer;
            const status = answer
              ? checked && !selected
                ? "Missed"
                : "Correct"
              : wrong
                ? "Not correct"
                : "";
            return (
              <QuestionnaireChoice
                key={option.label}
                value={option.label}
                checked={selected}
                onChange={() =>
                  onChange({
                    selected: multiple
                      ? selected
                        ? state.selected.filter(
                            (label) => label !== option.label,
                          )
                        : [...state.selected, option.label]
                      : [option.label],
                    review: multiple ? null : state.review,
                  })
                }
                render={<div />}
                contentRender={<div />}
                inputProps={{ "aria-labelledby": labelId }}
                className={`quiz-option ${answer ? "is-answer" : ""} ${wrong ? "is-incorrect" : ""}`}
              >
                <div className="quiz-option-body" id={labelId}>
                  <span className="option-label">{option.label}</span>
                  <Markdown source={option.markdown} />
                  {status && (
                    <span
                      className={`quiz-choice-result ${wrong ? "is-incorrect" : ""}`}
                    >
                      {wrong ? (
                        <X aria-hidden="true" />
                      ) : (
                        <Check aria-hidden="true" />
                      )}
                      {multiple ? (
                        <span>{status}</span>
                      ) : (
                        <span className="sr-only">Correct answer</span>
                      )}
                    </span>
                  )}
                </div>
              </QuestionnaireChoice>
            );
          })}
        </QuestionnaireChoices>
      )}
      <div className="quiz-reveal-actions">
        <Button
          variant={multiple ? "ghost" : revealed ? "outline" : "default"}
          size="sm"
          onClick={() =>
            onChange({ ...state, review: revealed ? null : "revealed" })
          }
          aria-expanded={revealed}
          aria-controls={`${name}-answer`}
        >
          {multiple && !revealed && <Eye data-icon="inline-start" />}
          {multiple
            ? revealed
              ? "Hide answers"
              : "Reveal answers"
            : revealed
              ? "Hide answer"
              : "Show answer"}
          {revealed ? (
            <ChevronUp data-icon="inline-end" />
          ) : (
            !multiple && <ChevronDown data-icon="inline-end" />
          )}
        </Button>
        <span>
          {multiple
            ? "For self-study"
            : q.type === "mcq"
              ? "Selection is optional"
              : "Written · self-check"}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            key="answer"
            className="answer-expansion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
            onAnimationComplete={() => {
              if (
                multiple &&
                revealed &&
                !answerPanel.current?.closest("[hidden]")
              ) {
                const panel = answerPanel.current;
                panel?.focus({ preventScroll: true });
                const previewScrollArea = panel?.closest(".import-body");
                if (panel && previewScrollArea) {
                  previewScrollArea.scrollBy({
                    top:
                      panel.getBoundingClientRect().top -
                      previewScrollArea.getBoundingClientRect().top -
                      16,
                    behavior: "instant",
                  });
                } else
                  panel?.scrollIntoView({
                    block: "start",
                    behavior: "instant",
                  });
              }
            }}
          >
            <section
              ref={answerPanel}
              tabIndex={multiple ? -1 : undefined}
              id={`${name}-answer`}
              className="answer-panel"
              aria-labelledby={`${name}-answer-label`}
            >
              {multiple && checked && (
                <div className="quiz-check-feedback" role="status">
                  {exact ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <CircleHelp aria-hidden="true" />
                  )}
                  <div>
                    <strong>
                      {exact ? "All answers correct" : "Review your selections"}
                    </strong>
                    <p>
                      {exact
                        ? "You selected every correct option and no incorrect ones."
                        : `${missed.length ? `${missed.length} correct ${missed.length === 1 ? "option" : "options"} missed` : "No correct options missed"}${incorrect.length ? ` · ${incorrect.length} incorrect ${incorrect.length === 1 ? "option" : "options"} selected` : ""}.`}
                    </p>
                  </div>
                </div>
              )}
              <h2 id={`${name}-answer-label`} className="answer-label">
                <Lightbulb aria-hidden="true" />
                {multiple
                  ? `Correct answers · ${q.answer.join(", ")}`
                  : q.type === "mcq"
                    ? `Correct answer · ${q.answer}`
                    : "Model answer"}
              </h2>
              {multiple ? (
                <p className="quiz-answer-summary">
                  {checked
                    ? `Your selection: ${q.options
                        .filter((option) =>
                          state.selected.includes(option.label),
                        )
                        .map((option) => option.label)
                        .join(", ")}.`
                    : "Answers revealed for self-study. Read the reasoning for each option below."}
                </p>
              ) : (
                <Markdown
                  source={
                    q.type === "mcq"
                      ? (q.options.find((option) => option.label === q.answer)
                          ?.markdown ?? q.answer)
                      : q.answer
                  }
                />
              )}
              <div className="explanation">
                <h3>Explanation</h3>
                <Markdown source={q.explanation} />
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionnaireItem>
  );
}

export function QuizReader({ quiz }: { quiz: Quiz }) {
  const instanceId = useId();
  const items = useMemo(
    () =>
      quiz.questions.map((question) => ({
        name: `${instanceId}-question-${question.number}`,
        required: false,
        multiple: question.type === "multiple_response",
        choices: question.options?.map((option) => ({ value: option.label })),
      })),
    [instanceId, quiz.questions],
  );
  const [active, setActive] = useState(items[0]?.name ?? "");
  const [states, setStates] = useState<Record<number, QuestionState>>({});
  const index = Math.max(
    0,
    items.findIndex((item) => item.name === active),
  );
  const question = quiz.questions[index];
  if (!question) return null;
  const state = states[question.number] ?? emptyState;
  const multiple = question.type === "multiple_response";
  const hasNext = index < items.length - 1;
  function update(number: number, value: QuestionState) {
    setStates((previous) => ({ ...previous, [number]: value }));
  }
  return (
    <Questionnaire
      items={items}
      item={active}
      onItemChange={setActive}
      className="quiz-reader"
      aria-label={`${quiz.title} self-study questions`}
      onSubmitCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDownCapture={(event) => {
        // Preserve Markdown keyboard interactions and keep survey shortcuts from skipping checks.
        const target = event.target as HTMLElement;
        if (target.closest(".markdown")) event.stopPropagation();
        if (
          event.key === "Enter" &&
          (event.metaKey ||
            event.ctrlKey ||
            (target instanceof HTMLInputElement &&
              ["radio", "checkbox"].includes(target.type)))
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div className="quiz-position">
        <QuestionnaireProgress aria-label="Question position" />
        <span>
          {multiple
            ? "Multiple answers"
            : question.type === "mcq"
              ? "Multiple choice"
              : "Written question"}
        </span>
      </div>
      <div className="quiz-position-track" aria-hidden="true">
        <span style={{ width: `${((index + 1) / items.length) * 100}%` }} />
      </div>
      {quiz.questions.map((entry, itemIndex) => (
        <Question
          key={entry.number}
          name={items[itemIndex].name}
          question={entry}
          state={states[entry.number] ?? emptyState}
          onChange={(value) => update(entry.number, value)}
        />
      ))}
      {(multiple || items.length > 1) && (
        <QuestionnaireActions className="quiz-navigation">
          <QuestionnairePrevious size="sm">
            <ArrowLeft data-icon="inline-start" />
            Previous
          </QuestionnairePrevious>
          <span className="quiz-navigation-note">
            {multiple
              ? state.review
                ? hasNext
                  ? "Continue when you’re ready"
                  : "Last question"
                : state.selected.length
                  ? `${state.selected.length} selected`
                  : "Select answers to check"
              : !hasNext
                ? "Last question"
                : "Move at your own pace"}
          </span>
          {multiple ? (
            <Button
              size="sm"
              className="quiz-check-next"
              disabled={!state.review && !state.selected.length}
              aria-controls={state.review ? undefined : `${active}-answer`}
              onClick={() => {
                if (!state.review)
                  update(question.number, { ...state, review: "checked" });
                else if (hasNext) setActive(items[index + 1].name);
                else update(question.number, emptyState);
              }}
            >
              {state.review
                ? hasNext
                  ? "Next"
                  : "Try again"
                : "Check answers"}
              {state.review ? (
                hasNext ? (
                  <ArrowRight data-icon="inline-end" />
                ) : (
                  <RotateCcw data-icon="inline-end" />
                )
              ) : (
                <Check data-icon="inline-end" />
              )}
            </Button>
          ) : (
            <QuestionnaireNext
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                if (hasNext) setActive(items[index + 1].name);
              }}
            >
              Next
              <ArrowRight data-icon="inline-end" />
            </QuestionnaireNext>
          )}
        </QuestionnaireActions>
      )}
    </Questionnaire>
  );
}
