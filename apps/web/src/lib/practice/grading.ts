export interface AnswerRule {
  canonical?: string | string[];
  canonical_example?: string;
  accepted?: Array<string | string[]>;
  unit?: string;
  validator?: {
    greater_than?: string;
    less_than?: string;
  };
}

function answerToText(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join(" > ") : answer;
}

export function normalizeAnswer(answer: string) {
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
  if (mixedNumber) return Number(mixedNumber[1]) + Number(mixedNumber[2]) / Number(mixedNumber[3]);

  const fraction = normalized.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return Number(normalized);
}

function getAcceptedAnswers(rule: AnswerRule, options?: Record<string, string>) {
  const canonical = rule.canonical ?? rule.canonical_example ?? "";
  const canonicalText = answerToText(canonical);
  const optionText = options?.[canonicalText];
  const accepted = (rule.accepted ?? []).map(answerToText);

  return [canonicalText, ...accepted, optionText, rule.unit ? `${canonicalText}${rule.unit}` : undefined]
    .filter((answer): answer is string => Boolean(answer));
}

export function gradeAnswer(rule: AnswerRule, response: string, options?: Record<string, string>) {
  if (rule.validator?.greater_than && rule.validator.less_than) {
    const value = parseNumber(response);
    return value > Number(rule.validator.greater_than) && value < Number(rule.validator.less_than);
  }

  const normalizedResponse = normalizeAnswer(response);
  return getAcceptedAnswers(rule, options).some(
    (acceptedAnswer) => normalizedResponse === normalizeAnswer(acceptedAnswer),
  );
}

export function getCanonicalAnswer(rule: AnswerRule, options?: Record<string, string>) {
  const canonical = rule.canonical ?? rule.canonical_example ?? "待確認";
  const canonicalText = answerToText(canonical);
  return options?.[canonicalText] ?? canonicalText;
}
