"use client";
import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Quiz, QuizQuestion } from "@/types/domain";
import { Markdown } from "./markdown";
function Question({ question: q }: { question: QuizQuestion }) {
  const reduced = useReducedMotion();
  const id = useId();
  const [selection, setSelection] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <section className="quiz-question" aria-labelledby={`${id}-question`}>
      <div className="question-heading">
        <span className="question-number">
          {String(q.number).padStart(2, "0")}
        </span>
        <h2 id={`${id}-question`}>
          {q.type === "mcq" ? "Multiple choice" : "Written · self-check"}
        </h2>
      </div>
      <Markdown source={q.prompt} />
      {q.options && (
        <RadioGroup
          value={selection}
          onValueChange={setSelection}
          aria-label={`Question ${q.number} options`}
          className="quiz-options"
        >
          {q.options.map((o) => (
            <div
              key={o.label}
              className={`quiz-option ${selection === o.label ? "is-selected" : ""} ${revealed && q.answer === o.label ? "is-answer" : ""}`}
            >
              <RadioGroupItem
                value={o.label}
                id={`${id}-${o.label}`}
                aria-labelledby={`${id}-${o.label}-text`}
              />
              <label htmlFor={`${id}-${o.label}`} className="option-label">
                {o.label}
              </label>
              <div className="option-content" id={`${id}-${o.label}-text`}>
                <Markdown source={o.markdown} />
              </div>
              {revealed && q.answer === o.label && (
                <Check
                  size={16}
                  className="accent"
                  aria-label="Correct answer"
                />
              )}
            </div>
          ))}
        </RadioGroup>
      )}
      {q.type === "written" && (
        <p className="self-check-note">
          Think through your response, then compare it with the model answer.
        </p>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setRevealed((v) => !v)}
        aria-expanded={revealed}
        aria-controls={`${id}-answer`}
      >
        {revealed ? "Hide answer" : "Show answer"}
        {revealed ? (
          <ChevronUp data-icon="inline-end" />
        ) : (
          <ChevronDown data-icon="inline-end" />
        )}
      </Button>
      <AnimatePresence initial={false}>
        {revealed && (
          <motion.div
            key="answer"
            className="answer-expansion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}
          >
            <div id={`${id}-answer`} className="answer-panel">
              <div className="answer-label">
                <Lightbulb size={16} />
                {q.type === "mcq"
                  ? `Correct answer · ${q.answer}`
                  : "Model answer"}
              </div>
              <Markdown
                source={
                  q.type === "mcq"
                    ? (q.options?.find((o) => o.label === q.answer)?.markdown ??
                      q.answer)
                    : q.answer
                }
              />
              <div className="explanation">
                <span className="eyebrow">Explanation</span>
                <Markdown source={q.explanation} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
export function QuizReader({ quiz }: { quiz: Quiz }) {
  return (
    <div className="quiz-reader">
      {quiz.questions.map((q) => (
        <Question key={q.number} question={q} />
      ))}
    </div>
  );
}
