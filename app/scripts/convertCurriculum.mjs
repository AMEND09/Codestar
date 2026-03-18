import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const markdownPath = path.join(repoRoot, "course_content", "curriculum.md");
const outputPaths = [
  path.join(repoRoot, "course_content", "curriculum.json"),
  path.join(process.cwd(), "public", "data", "curriculum.json"),
];

function extractCodeBlock(text) {
  const blockMatch = text.match(/```(?:python)?\r?\n([\s\S]*?)```/i);
  return blockMatch ? blockMatch[1].trim() : "";
}

function extractPrompt(text) {
  const lines = text.split("\n").map((line) => line.trim());
  const promptLine = lines.find(
    (line) => line.startsWith("*") && line.endsWith("*") && line.length > 2,
  );
  return promptLine ? promptLine.slice(1, -1) : "";
}

function normalizeQuestionType(rawType) {
  const lowered = rawType.toLowerCase();
  if (lowered.includes("trace")) return "trace_output";
  if (lowered.includes("spot the bug")) return "spot_bug";
  if (lowered.includes("multiple choice")) return "multiple_choice";
  if (lowered.includes("fill in the blank")) return "fill_blank";
  if (lowered.includes("arrange the blocks")) return "arrange_blocks";
  if (lowered.includes("fix the code")) return "fix_code";
  if (lowered.includes("write from scratch")) return "write_from_scratch";
  if (lowered.includes("complexity")) return "complexity_choice";
  if (lowered.includes("match the pairs")) return "match_pairs";
  return "mixed";
}

function extractChoices(text) {
  const choices = [];
  const choiceRegex = /^-\s+([A-Z])\)\s+(.+)$/gm;
  let choiceMatch;

  while ((choiceMatch = choiceRegex.exec(text)) !== null) {
    choices.push({
      key: choiceMatch[1],
      text: choiceMatch[2].replace("✅", "").trim(),
      isCorrect: choiceMatch[2].includes("✅"),
    });
  }

  return choices;
}

function extractCorrectAnswer(text, choices) {
  const explicit = text.match(/\*\*Correct answer:\*\*\s*`?([^`\n]+)`?/);
  if (explicit) return explicit[1].trim();

  const correctChoice = choices.find((choice) => choice.isCorrect);
  if (!correctChoice) return "";

  return correctChoice.key;
}

function extractFeedback(text) {
  const feedbackMatch = text.match(/\*\*Feedback(?:\s*\(wrong\))?:\*\*\s*([\s\S]*?)(?:\n---|$)/);
  return feedbackMatch ? feedbackMatch[1].trim() : "";
}

function extractFunctionName(code) {
  const match = code.match(/^\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/m);
  return match ? match[1] : "";
}

function extractTestCases(code) {
  const tests = [];
  const regex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*\([^)]*\))\s*->\s*(.+)$/gm;
  let match;

  while ((match = regex.exec(code)) !== null) {
    tests.push({
      call: match[1].trim(),
      expected: match[2].trim(),
    });
  }

  return tests;
}

function parseOverviewTable(markdown) {
  const lines = markdown.split("\n");
  const startIndex = lines.findIndex((line) => line.includes("| Unit | Topic | Lessons | XP |"));

  if (startIndex === -1) {
    return [];
  }

  const rows = [];
  for (let i = startIndex + 2; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;

    const parts = line
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 4) continue;

    rows.push({
      unit: Number(parts[0]),
      topic: parts[1],
      lessons: Number(parts[2]),
      xp: Number(parts[3]),
    });
  }

  return rows;
}

function parseQuestionTypes(markdown) {
  const lines = markdown.split("\n");
  const startIndex = lines.findIndex((line) => line.includes("| Type | Description | Cognitive Level |"));

  if (startIndex === -1) {
    return [];
  }

  const rows = [];
  for (let i = startIndex + 2; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;

    const parts = line
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 3) continue;

    rows.push({
      type: parts[0].replaceAll("**", ""),
      description: parts[1],
      cognitiveLevel: parts[2],
    });
  }

  return rows;
}

function parseQuestions(section, lessonId) {
  const questionRegex =
    /\*\*Question\s+(\d+)\s+[—-]\s+([^*]+)\*\*\r?\n([\s\S]*?)(?=\r?\n\*\*Question\s+\d+\s+[—-]|\r?\n###\s+|$)/g;
  const questions = [];
  let questionMatch;

  while ((questionMatch = questionRegex.exec(section)) !== null) {
    const index = Number(questionMatch[1]);
    const title = questionMatch[2].trim();
    const body = questionMatch[3].trim();
    const choices = extractChoices(body);

    const code = extractCodeBlock(body);
    const functionName = extractFunctionName(code);
    const tests = extractTestCases(code);

    questions.push({
      id: `${lessonId}-q${index}`,
      index,
      title,
      type: normalizeQuestionType(title),
      prompt: extractPrompt(body),
      code,
      functionName,
      tests,
      choices,
      correctAnswer: extractCorrectAnswer(body, choices),
      feedback: extractFeedback(body),
      rawMarkdown: body,
    });
  }

  return questions;
}

function parseLessons(unitSection, unitNumber) {
  const lessonRegex = /^###\s+(.+)$/gm;
  const matches = [...unitSection.matchAll(lessonRegex)];

  if (matches.length === 0) {
    return [];
  }

  return matches.map((match, index) => {
    const lessonTitle = match[1].trim();
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : unitSection.length;
    const lessonBody = unitSection.slice(start, end).trim();

    const lessonId = `u${unitNumber}-l${index + 1}`;
    const conceptMatch = lessonBody.match(/\*\*Concept introduced:\*\*\s*(.+)/);

    return {
      id: lessonId,
      unit: unitNumber,
      index: index + 1,
      title: lessonTitle,
      conceptIntroduced: conceptMatch ? conceptMatch[1].trim() : "",
      questions: parseQuestions(lessonBody, lessonId),
      rawMarkdown: lessonBody,
    };
  });
}

function parseUnits(markdown, overviewRows) {
  const unitRegex = /^##\s+Unit\s+(\d+):\s+(.+)$/gm;
  const matches = [...markdown.matchAll(unitRegex)];

  return matches.map((match, index) => {
    const unitNumber = Number(match[1]);
    const unitName = match[2].trim();
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    const unitBody = markdown.slice(start, end).trim();

    const overview = overviewRows.find((row) => row.unit === unitNumber);

    const descriptionMatch = unitBody.match(/^\*(.+?)\*/m);

    return {
      id: `unit-${unitNumber}`,
      number: unitNumber,
      title: unitName,
      topic: overview ? overview.topic : unitName,
      lessonsPlanned: overview ? overview.lessons : 0,
      xp: overview ? overview.xp : 0,
      description: descriptionMatch ? descriptionMatch[1].trim() : "",
      lessons: parseLessons(unitBody, unitNumber),
    };
  });
}

function buildPlacementQuiz(units) {
  const candidates = [];

  for (const unit of units) {
    for (const lesson of unit.lessons) {
      for (const question of lesson.questions) {
        if (question.code && question.choices.length >= 2 && question.correctAnswer) {
          candidates.push({
            unitNumber: unit.number,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            question,
          });
        }
      }
    }
  }

  const targetUnits = [1, 2, 4, 6, 8, 10, 11, 12];
  const selected = [];

  for (const unitNumber of targetUnits) {
    const match = candidates.find((candidate) => candidate.unitNumber === unitNumber);
    if (match) selected.push(match);
    if (selected.length === 6) break;
  }

  return selected.map((item, index) => ({
    id: `placement-${index + 1}`,
    sourceUnit: item.unitNumber,
    sourceLessonId: item.lessonId,
    sourceLessonTitle: item.lessonTitle,
    title: item.question.title,
    prompt: item.question.prompt,
    code: item.question.code,
    choices: item.question.choices.map((choice) => ({
      id: choice.key,
      text: choice.text,
    })),
    correctAnswer: item.question.correctAnswer,
    feedback: item.question.feedback,
    xp: 10,
  }));
}

function writeJsonFiles(data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;

  for (const outputPath of outputPaths) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, "utf8");
  }
}

function main() {
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const overview = parseOverviewTable(markdown);
  const questionTypes = parseQuestionTypes(markdown);
  const units = parseUnits(markdown, overview);

  const courseData = {
    metadata: {
      title: "Codestar: Python DSA Curriculum",
      subtitle: "A Duolingo-Style Course for Data Structures & Algorithms",
      totalUnits: overview.length,
      totalLessons: overview.reduce((sum, row) => sum + row.lessons, 0),
      totalXp: overview.reduce((sum, row) => sum + row.xp, 0),
      philosophy:
        "Students encounter realistic code first, commit to an answer, and then receive targeted feedback.",
    },
    questionTypes,
    overview,
    placementQuiz: buildPlacementQuiz(units),
    units,
    source: {
      markdownPath: "course_content/curriculum.md",
      convertedAt: new Date().toISOString(),
    },
  };

  writeJsonFiles(courseData);

  console.log(
    `Converted curriculum to JSON with ${units.length} units and ${courseData.placementQuiz.length} placement questions.`,
  );
}

main();
