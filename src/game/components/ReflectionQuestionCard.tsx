import { useState } from 'react';
import type { ReflectionQuestion } from '../campaign/types';

interface ReflectionQuestionCardProps {
  question: ReflectionQuestion;
  /** 1-based number shown before the prompt. */
  number: number;
}

/** A single inline multiple-choice reflection: answer, then see feedback. */
export function ReflectionQuestionCard({ question, number }: ReflectionQuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === question.correctIndex;

  return (
    <div className="reflection">
      <p className="reflection__prompt">
        {number}. {question.prompt}
      </p>

      <div className="reflection__options">
        {question.options.map((option, i) => {
          const cls = !answered
            ? ''
            : i === question.correctIndex
              ? 'reflection__option--correct'
              : i === selected
                ? 'reflection__option--wrong'
                : '';
          return (
            <button
              key={option}
              type="button"
              className={`reflection__option ${cls}`.trim()}
              disabled={answered}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`reflection__result ${correct ? 'reflection__result--correct' : 'reflection__result--wrong'}`}
          role="status"
        >
          <strong>{correct ? 'Correct!' : 'Not quite —'}</strong>
          {question.explanation && <p>{question.explanation}</p>}
        </div>
      )}
    </div>
  );
}
