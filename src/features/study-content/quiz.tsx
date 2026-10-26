"use client";

import { memo, useId, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
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
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import type { Quiz, QuizQuestion } from "@/types/domain";
import { Markdown } from "./markdown";
import { useQuizSession, emptyState, type QuestionState } from "./quiz-session";

// Selection feedback changes frequently; unchanged rich content need not be parsed again.
const QuizMarkdown = memo(Markdown);

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
        <QuizMarkdown source={q.prompt} />
      </QuestionnaireTitle>
      <QuestionnaireDescription className="quiz-guidance">
        {multiple
          ? "Select all that apply."
          : q.type === "mcq"
            ? "Choose one answer."
            : "Think through your response, then reveal the model answer."}
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
                  <QuizMarkdown source={option.markdown} />
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
      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            key="answer"
            className="answer-expansion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
            onAnimationComplete={(animation) => {
              // AnimatePresence retains the old callback during exit; never focus a panel being removed.
              if (
                typeof animation !== "object" ||
                !("opacity" in animation) ||
                animation.opacity !== 1
              )
                return;
              if (
                multiple &&
                revealed &&
                !answerPanel.current?.closest("[hidden]")
              ) {
                const panel = answerPanel.current;
                panel?.focus({ preventScroll: true });
                const previewScrollArea = panel?.closest(
                  ".import-body, .quiz-focus-scroll",
                );
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
              {multiple && checked ? (
                <p className="quiz-answer-summary">
                  {`Your selection: ${q.options
                    .filter((option) => state.selected.includes(option.label))
                    .map((option) => option.label)
                    .join(", ")}.`}
                </p>
              ) : !multiple ? (
                <QuizMarkdown
                  source={
                    q.type === "mcq"
                      ? (q.options.find((option) => option.label === q.answer)
                          ?.markdown ?? q.answer)
                      : q.answer
                  }
                />
              ) : null}
              <div className="explanation">
                <h3>Explanation</h3>
                <QuizMarkdown source={q.explanation} />
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </QuestionnaireItem>
  );
}

export function QuizReader({
  quiz,
  session,
}: {
  quiz: Quiz;
  session?: ReturnType<typeof useQuizSession>;
}) {
  const localSession = useQuizSession();
  const { index, setIndex, states, update } = session ?? localSession;
  const instanceId = useId();
  const question = quiz.questions[index];
  const active = `${instanceId}-question-${question?.number ?? 0}`;
  const items = useMemo(
    () =>
      question
        ? [
            {
              name: active,
              required: false,
              multiple: question.type === "multiple_response",
              choices: question.options?.map((option) => ({
                value: option.label,
              })),
            },
          ]
        : [],
    [active, question],
  );
  if (!question) return null;
  const state = states[question.number] ?? emptyState;
  const multiple = question.type === "multiple_response";
  const hasNext = index < quiz.questions.length - 1;
  function goTo(next: number) {
    if (next < 0 || next >= quiz.questions.length) return;
    setIndex(next);
    requestAnimationFrame(() => {
      const field = document
        .getElementById(
          `${instanceId}-question-${quiz.questions[next].number}-prompt`,
        )
        ?.closest("fieldset");
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  return (
    <Questionnaire
      items={items}
      item={active}
      className="quiz-reader"
      aria-label={`${quiz.title} self-study questions`}
      onSubmitCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDownCapture={(event) => {
        // Preserve Markdown keyboard interactions and keep survey shortcuts from skipping checks.
        const target = event.target as HTMLElement;
        if (target.closest(".markdown")) {
          event.stopPropagation();
          return;
        }
        // The questionnaire contains only the mounted question. Page navigation
        // stays outside its collection; radio arrow keys keep their native use.
        if (
          (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
          !(target instanceof HTMLInputElement && target.type === "radio")
        ) {
          event.stopPropagation();
          event.preventDefault();
          if (event.repeat) return;
          if (event.key === "ArrowLeft") goTo(index - 1);
          else if (!multiple || state.review) goTo(index + 1);
        }
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
        <div
          data-slot="questionnaire-progress"
          role="progressbar"
          aria-label="Question position"
          aria-valuemin={1}
          aria-valuemax={quiz.questions.length}
          aria-valuenow={index + 1}
          aria-valuetext={`Question ${index + 1} of ${quiz.questions.length}`}
          aria-live="polite"
        >
          Question {index + 1} of {quiz.questions.length}
        </div>
      </div>
      <Question
        key={question.number}
        name={active}
        question={question}
        state={state}
        onChange={(value) => update(question.number, value)}
      />
      <QuestionnaireActions className="quiz-navigation">
        {quiz.questions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            disabled={index === 0}
            aria-label="Previous question"
            onClick={() => goTo(index - 1)}
            className="quiz-previous"
          >
            <ArrowLeft data-icon="inline-start" />
            <span>Previous</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="quiz-reveal"
          onClick={() =>
            update(question.number, {
              ...state,
              review: state.review ? null : "revealed",
            })
          }
          aria-expanded={state.review !== null}
          aria-controls={state.review ? `${active}-answer` : undefined}
        >
          <Eye data-icon="inline-start" />
          {state.review
            ? multiple
              ? "Hide answers"
              : "Hide answer"
            : multiple
              ? "Reveal answers"
              : "Reveal answer"}
        </Button>
        {multiple ? (
          <Button
            size="sm"
            className="quiz-check-next"
            disabled={!state.review && !state.selected.length}
            aria-controls={state.review ? undefined : `${active}-answer`}
            onClick={() => {
              if (!state.review)
                update(question.number, { ...state, review: "checked" });
              else if (hasNext) goTo(index + 1);
              else {
                update(question.number, emptyState);
                goTo(index);
              }
            }}
          >
            {state.review ? (hasNext ? "Next" : "Try again") : "Check answers"}
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
          quiz.questions.length > 1 && (
            <Button
              size="sm"
              className="quiz-check-next"
              disabled={!hasNext}
              onClick={() => goTo(index + 1)}
            >
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
          )
        )}
      </QuestionnaireActions>
    </Questionnaire>
  );
}
