const fs = require("fs");
function dedupeLessons(lessons) { return [...new Set(lessons)] }
function parseCompletedLessons(raw) {
  if (Array.isArray(raw)) return raw.filter(value => typeof value === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(value => typeof value === "string");
    } catch { return []; }
  }
  return [];
}
function normalizeCourseProgress(value) {
  const startLessonId = typeof value?.startLessonId === "string" ? value.startLessonId : "";
  const completedLessons = parseCompletedLessons(value?.completedLessons);
  return { startLessonId, completedLessons: dedupeLessons(completedLessons) };
}
function parseCourseProgressMap(raw) {
  if (!raw) return {};
  let target = raw;
  let attempts = 0;
  while (typeof target === "string" && attempts < 3) {
    try { target = JSON.parse(target); attempts++; } catch { break; }
  }
  if (typeof target !== "object" || target === null || Array.isArray(target)) return {};
  if (Object.keys(target).length === 1 && target.courseProgressBySlug) {
    const unnested = target.courseProgressBySlug;
    if (typeof unnested === "object" && unnested !== null && !Array.isArray(unnested)) { target = unnested; }
  }
  const parsed = {};
  for (const [slug, value] of Object.entries(target)) {
    if (!slug) continue;
    parsed[slug] = normalizeCourseProgress(value);
  }
  return parsed;
}

const dbString = JSON.stringify({
  "courseProgressBySlug": {
    "python-dsa": {
      "startLessonId": "u2-l2",
      "completedLessons": ["u1-l1", "u1-l2", "u1-l3", "u1-l4", "u1-l5", "u1-l6", "u2-l1"]
    }
  }
});
const mapped = parseCourseProgressMap(dbString);
console.log(JSON.stringify(mapped));

