"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookIcon, CheckIcon, CloseIcon } from "@/components/icons";
import { Badge, ProgressBar } from "@/components/ui";
import type { PracticeQuestion } from "@/lib/domain/types";
import { selectPracticeQuestions } from "@/lib/practice/select-practice-questions";
import { siteConfig } from "@/lib/site-config";

function normalizeAnswer(answer: string) {
  return answer
    .trim()
    .toLocaleLowerCase("zh-Hant-HK")
    .replaceAll("／", "/")
    .replace(/[，,＞]/g, ">")
    .replaceAll(" ", "");
}

function parseNumber(answer: string) {
  const normalized = answer.trim().replaceAll("／", "/");
  const mixedNumber = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedNumber) {
    const [, whole, numerator, denominator] = mixedNumber;
    return Number(whole) + Number(numerator) / Number(denominator);
  }

  const fraction = normalized.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return Number(normalized);
}

function isAnswerCorrect(question: PracticeQuestion, answer: string) {
  if (question.answerValidator?.kind === "number-range") {
    const value = parseNumber(answer);
    return value > question.answerValidator.greaterThan && value < question.answerValidator.lessThan;
  }

  return (question.acceptedAnswers ?? [question.correctAnswer]).some(
    (acceptedAnswer) => normalizeAnswer(answer) === normalizeAnswer(acceptedAnswer),
  );
}

export function PracticeSession({ paperId, paperTitle, questionPool }: { paperId: string; paperTitle: string; questionPool: PracticeQuestion[] }) {
  const questions = useMemo(() => selectPracticeQuestions(questionPool), [questionPool]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gradedQuestions, setGradedQuestions] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedScore, setSavedScore] = useState<number>();

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] ?? "";
  const isCurrentGraded = gradedQuestions[currentQuestion.id] ?? false;
  const isCurrentCorrect = isCurrentGraded && isAnswerCorrect(currentQuestion, currentAnswer);
  const gradedCount = Object.keys(gradedQuestions).length;
  const score = questions.filter((question) => gradedQuestions[question.id] && isAnswerCorrect(question, answers[question.id] ?? "")).length;

  function updateAnswer(answer: string) {
    if (isCurrentGraded) return;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion.id]: answer }));
  }

  function gradeCurrentQuestion() {
    if (!currentAnswer) return;
    setGradedQuestions((currentQuestions) => ({ ...currentQuestions, [currentQuestion.id]: true }));
  }

  function goToNextQuestion() {
    if (currentIndex === questions.length - 1) {
      finishPractice();
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  async function finishPractice() {
    setIsSaving(true);
    setSaveError("");
    const wrongQuestionIds = questions
      .filter((question) => !isAnswerCorrect(question, answers[question.id] ?? ""))
      .map((question) => question.id);

    try {
      const response = await fetch("/api/practice/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, questionIds: questions.map(({ id }) => id), answers }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "未能儲存練習紀錄");

      window.localStorage.setItem("wrong-question-ids", JSON.stringify(wrongQuestionIds));
      setSavedScore(result.score);
      setIsFinished(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "未能儲存練習紀錄");
    } finally {
      setIsSaving(false);
    }
  }

  if (isFinished) {
    return (
      <main className="practice-layout">
        <aside className="practice-sidebar"><Link className="brand" href="/dashboard"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link></aside>
        <section className="practice-main" style={{ display: "grid", placeItems: "center" }}>
          <div className="result-card">
            <div className="result-score">{savedScore ?? score}/{questions.length}</div>
            <h1>{(savedScore ?? score) >= 12 ? "做得很好！" : "完成了，再進一步。"}</h1>
            <p>正確率 {Math.round(((savedScore ?? score) / questions.length) * 100)}%。練習紀錄及答錯題目已經保存。</p>
            <div className="result-actions"><Link className="button button-primary" href="/wrong-book">查看錯題本</Link><button className="button button-secondary" onClick={() => window.location.reload()} type="button">再做一次</button></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="practice-layout">
      <aside className="practice-sidebar">
        <Link className="brand" href="/dashboard"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
        <h2>{paperTitle}</h2><p>系統已從合資格題目抽出15題</p>
        <div className="question-index">
          {questions.map((question, index) => <button className={`${index === currentIndex ? "current" : ""} ${gradedQuestions[question.id] ? "answered" : ""}`} key={question.id} onClick={() => setCurrentIndex(index)} type="button">{index + 1}</button>)}
        </div>
      </aside>
      <section className="practice-main">
        <div className="practice-topbar">
          <div><p>四年級 · 數學 · 智能練習</p><strong>{gradedCount}題已批改</strong></div>
          <div className="practice-progress"><ProgressBar value={(gradedCount / questions.length) * 100} label={`${gradedCount}/${questions.length}`} /></div>
        </div>
        <article className="question-card">
          <div className="question-heading"><span className="question-number">練習第 {currentIndex + 1} 題{currentQuestion.sourceNumber ? ` · 原卷第 ${currentQuestion.sourceNumber} 題` : ""}</span><Badge tone={currentQuestion.difficulty === "easy" ? "mint" : currentQuestion.difficulty === "hard" ? "coral" : "blue"}>{currentQuestion.topic}</Badge></div>
          {currentQuestion.stimulusPath ? <div className="question-source-image question-stimulus"><Image alt="題目共用圖表" height={900} priority={currentIndex === 0} src={currentQuestion.stimulusPath} unoptimized width={1200} /></div> : null}
          {currentQuestion.imagePath ? <div className="question-source-image"><Image alt={`原卷第${currentQuestion.sourceNumber}題`} height={700} priority={currentIndex === 0} src={currentQuestion.imagePath} unoptimized width={1200} /></div> : <h1>{currentQuestion.prompt}</h1>}
          {currentQuestion.imagePath ? <p className="question-accessible-prompt">{currentQuestion.prompt}</p> : null}
          {currentQuestion.type === "multiple-choice" ? (
            <div className="answer-options">{currentQuestion.options?.map((option, index) => <button className={`answer-option ${currentAnswer === option ? "selected" : ""}`} key={option} onClick={() => updateAnswer(option)} type="button"><span className="option-letter">{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
          ) : (
            <input aria-label="輸入答案" className="number-answer" disabled={isCurrentGraded} inputMode="decimal" onChange={(event) => updateAnswer(event.target.value)} placeholder="在此輸入答案" value={currentAnswer} />
          )}

          {isCurrentGraded ? (
            <div className={`feedback-box ${isCurrentCorrect ? "feedback-correct" : "feedback-wrong"}`}>
              {isCurrentCorrect ? <CheckIcon /> : <CloseIcon />}
              <div><strong>{isCurrentCorrect ? "答對了！" : `正確答案：${currentQuestion.correctAnswer}`}</strong><p>{currentQuestion.explanation}</p></div>
            </div>
          ) : null}

          <div className="question-actions">
            <button className="button button-secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} type="button">上一題</button>
            {isCurrentGraded ? <button className="button button-primary" disabled={isSaving} onClick={goToNextQuestion} type="button">{isSaving ? "正在儲存…" : currentIndex === questions.length - 1 ? "完成練習" : "下一題"}</button> : <button className="button button-primary" disabled={!currentAnswer} onClick={gradeCurrentQuestion} type="button">核對答案</button>}
          </div>
          {saveError ? <p className="form-error" role="alert">{saveError}</p> : null}
        </article>
      </section>
    </main>
  );
}
