import { DEFAULT_SUBJECTS, type DefaultSubjectCode } from "./default-taxonomy";

const SUBJECT_ALIASES: Record<DefaultSubjectCode, string[]> = {
  chinese: ["中文", "中國語文", "語文", "chinese", "chi", "cn"],
  english: ["英文", "英國語文", "english", "eng", "en"],
  math: ["數學", "數學科", "math", "maths", "mathematics", "ma"],
  humanities: ["人文", "人文科", "humanities", "humanity", "常識", "常識科", "general studies", "gs"],
  science: ["科學", "科學科", "science", "sci"],
};

function normalizeAlias(value: string) {
  return value.trim().toLowerCase().replace(/[\s　_-]+/g, "");
}

export function resolveLegacySubjectCode(value: string | null | undefined): DefaultSubjectCode | null {
  if (!value) return null;
  const normalized = normalizeAlias(value);
  for (const subject of DEFAULT_SUBJECTS) {
    if (normalizeAlias(subject.code) === normalized || normalizeAlias(subject.nameZh) === normalized || normalizeAlias(subject.nameEn) === normalized) {
      return subject.code;
    }
    if (SUBJECT_ALIASES[subject.code].some((alias) => normalizeAlias(alias) === normalized)) return subject.code;
  }
  return null;
}

export function normalizeTopicLabel(value: string | null | undefined) {
  return (value ?? "未設定").trim().replace(/[\s　]+/g, "") || "未設定";
}

function stableHash(value: string) {
  let hash = 5381;
  for (const char of value) hash = ((hash << 5) + hash + char.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}

export function createStableCode(prefix: string, label: string) {
  const normalized = label.trim().toLowerCase();
  const asciiSlug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (asciiSlug) return asciiSlug;
  return `${prefix}-${stableHash(label)}`;
}

export function createTopicCode(label: string) {
  return createStableCode("topic", normalizeTopicLabel(label));
}

export function createKnowledgePointCode(label: string) {
  return createStableCode("kp", normalizeTopicLabel(label));
}
