"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookIcon, ChartIcon, CheckIcon, CloseIcon, PaperIcon } from "@/components/icons";
import { Badge, ProgressBar } from "@/components/ui";
import type { PracticeQuestion } from "@/lib/domain/types";
import { selectPracticeQuestions } from "@/lib/practice/select-practice-questions";
import { isTextAnswerType } from "@/lib/practice/question-type";
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

function isTextAnswerQuestion(question: PracticeQuestion) {
  return isTextAnswerType(question.type);
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
  const [isFocusMode, setIsFocusMode] = useState(false);
  const answerInputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] ?? "";
  const isCurrentGraded = gradedQuestions[currentQuestion.id] ?? false;
  const isCurrentCorrect = isCurrentGraded && isAnswerCorrect(currentQuestion, currentAnswer);
  const gradedCount = Object.keys(gradedQuestions).length;
  const progressPercent = Math.round((gradedCount / questions.length) * 100);
  const remainingCount = questions.length - gradedCount;
  const score = questions.filter((question) => gradedQuestions[question.id] && isAnswerCorrect(question, answers[question.id] ?? "")).length;
  const currentDifficultyTone = currentQuestion.difficulty === "easy" ? "mint" : currentQuestion.difficulty === "hard" ? "coral" : "blue";
  const currentDifficultyLabel = currentQuestion.difficulty === "easy" ? "基礎" : currentQuestion.difficulty === "hard" ? "挑戰" : "標準";

  function updateAnswer(answer: string) {
    if (isCurrentGraded) return;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [currentQuestion.id]: answer }));
  }

  function gradeCurrentQuestion() {
    if (!currentAnswer) return;
    setGradedQuestions((currentQuestions) => ({ ...currentQuestions, [currentQuestion.id]: true }));
  }

  // Keyboard shortcuts: Enter to grade/advance, arrows to navigate
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.key === "Enter" && !isCurrentGraded && currentAnswer) {
          event.preventDefault();
          gradeCurrentQuestion();
        } else if (event.key === "Enter" && isCurrentGraded) {
          event.preventDefault();
          goToNextQuestion();
        }
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setCurrentIndex((index) => Math.min(questions.length - 1, index + 1));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setCurrentIndex((index) => Math.max(0, index - 1));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Auto-focus answer input on question change
  useEffect(() => {
    answerInputRef.current?.focus();
  }, [currentIndex]);

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
    const finalScore = savedScore ?? score;
    const finalPercent = Math.round((finalScore / questions.length) * 100);

    return (
      <main className="practice-layout practice-layout-redesign">
        <aside className="practice-sidebar practice-sidebar-redesign">
          <Link className="brand" href="/dashboard"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
          <div className="practice-side-panel">
            <p className="eyebrow">練習已完成</p>
            <h2>{paperTitle}</h2>
            <p>今次紀錄已保存，錯題會自動放入錯題本，方便下一次針對弱項重練。</p>
          </div>
        </aside>
        <section className="practice-main practice-result-main">
          <div className="result-card result-card-redesign">
            <div className="result-score-ring"><span>{finalScore}</span><small>/ {questions.length}</small></div>
            <p className="eyebrow">正確率 {finalPercent}%</p>
            <h1>{finalScore >= 12 ? "做得很好，節奏穩定。" : "完成了，下一步追錯題。"}</h1>
            <p>練習紀錄及答錯題目已經保存。建議先睇錯題解析，再安排下一次15題短練習。</p>
            <div className="result-summary-grid">
              <div><ChartIcon /><strong>{finalPercent}%</strong><span>正確率</span></div>
              <div><CloseIcon /><strong>{questions.length - finalScore}</strong><span>需要重練</span></div>
              <div><PaperIcon /><strong>15</strong><span>題任務完成</span></div>
            </div>
            <div className="result-actions"><Link className="button button-primary" href="/wrong-book">查看錯題本</Link><button className="button button-secondary" onClick={() => window.location.reload()} type="button">再做一次</button></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="practice-layout practice-layout-redesign">
      <aside className={`practice-sidebar practice-sidebar-redesign${isFocusMode ? " practice-sidebar-hidden" : ""}`}>
        <div className="practice-sidebar-top">
          <Link className="brand" href="/dashboard"><span className="brand-mark"><BookIcon /></span>{siteConfig.name}</Link>
          <span className="practice-mode-pill">15題</span>
        </div>
        <div className="practice-side-panel">
          <p className="eyebrow">今日任務</p>
          <h2>{paperTitle}</h2>
          <p>系統已抽出15題，逐題核對答案；不需要一次過追求快，重點係即時知道錯在哪裏。</p>
          <div className="practice-side-stats">
            <div><strong>{score}</strong><span>暫時答對</span></div>
            <div><strong>{remainingCount}</strong><span>尚未批改</span></div>
          </div>
        </div>
        <div className="question-index" aria-label="題目進度">
          {questions.map((question, index) => <button className={`${index === currentIndex ? "current" : ""} ${gradedQuestions[question.id] ? "answered" : ""}`} key={question.id} onClick={() => setCurrentIndex(index)} type="button">{index + 1}</button>)}
        </div>
        <div className="practice-sidebar-legend"><span><i />目前題目</span><span><i />已批改</span></div>
      </aside>
      <section className="practice-main practice-main-redesign">
        <div className="practice-topbar practice-topbar-redesign">
          <div><p>四年級 · 數學 · 智能練習</p><strong>{gradedCount}題已批改 · {score}題答對</strong></div>
          <div className="practice-progress"><ProgressBar value={progressPercent} label={`${gradedCount}/${questions.length}`} /></div>
          <button className="practice-focus-toggle" onClick={() => setIsFocusMode((mode) => !mode)} title={isFocusMode ? "顯示側欄" : "專注模式"} type="button">{isFocusMode ? "顯示側欄" : "專注"}</button>
          <span className="practice-kbd-hint" title="Enter 核對 · ←→ 導航">⌨️ Enter 核對 · ←→ 導航</span>
        </div>
        <article className="question-card question-card-redesign" key={currentIndex}>
          <div className="question-heading question-heading-redesign">
            <div>
              <span className="question-number">練習第 {currentIndex + 1} 題{currentQuestion.sourceNumber ? ` · 原卷第 ${currentQuestion.sourceNumber} 題` : ""}</span>
              <p>{currentQuestion.topic || "未設定課題"}</p>
            </div>
            <Badge tone={currentDifficultyTone}>{currentDifficultyLabel}</Badge>
          </div>
          {currentQuestion.stimulusPath ? <div className="question-source-image question-stimulus"><Image alt="題目共用圖表" height={900} priority={currentIndex === 0} src={currentQuestion.stimulusPath} unoptimized width={1200} /></div> : null}
          {currentQuestion.imagePath ? <div className="question-source-image"><Image alt={`原卷第${currentQuestion.sourceNumber}題`} height={700} priority={currentIndex === 0} src={currentQuestion.imagePath} unoptimized width={1200} /></div> : <h1>{currentQuestion.prompt}</h1>}
          {currentQuestion.imagePath ? <p className="question-accessible-prompt">{currentQuestion.prompt}</p> : null}
          {currentQuestion.type === "multiple-choice" ? (
            <div className="answer-options">{currentQuestion.options?.map((option, index) => <button className={`answer-option ${currentAnswer === option ? "selected" : ""}`} key={option} onClick={() => updateAnswer(option)} type="button"><span className="option-letter">{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
          ) : (
            <input
              aria-label="輸入答案"
              autoCapitalize={isTextAnswerQuestion(currentQuestion) ? "none" : undefined}
              className="number-answer"
              disabled={isCurrentGraded}
              inputMode={isTextAnswerQuestion(currentQuestion) ? "text" : "decimal"}
              onChange={(event) => updateAnswer(event.target.value)}
              placeholder={isTextAnswerQuestion(currentQuestion) ? "在此輸入文字答案，例如：正方形" : "在此輸入答案"}
              ref={answerInputRef}
              type="text"
              value={currentAnswer}
            />
          )}

          {isCurrentGraded ? (
            <div className={`feedback-box ${isCurrentCorrect ? "feedback-correct" : "feedback-wrong"}`}>
              {isCurrentCorrect ? <CheckIcon /> : <CloseIcon />}
              <div><strong>{isCurrentCorrect ? "答對了！" : `正確答案：${currentQuestion.correctAnswer}`}</strong><p>{currentQuestion.explanation}</p></div>
            </div>
          ) : (
            <div className="question-hint-box"><CheckIcon /><span>選好答案後先核對，再進入下一題；答錯會自動加入錯題本。</span></div>
          )}

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
