import { type ReactNode, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Flame,
  Gem,
  Heart,
  Lock,
  Play,
  Shield,
  Stars,
} from 'lucide-react';
import courseData from './data/course.json';
import type {
  Character,
  CourseData,
  Lesson,
  LessonQuestion,
  Placement,
  PlacementLevel,
  PlacementQuestion,
  Unit,
} from './types';
import './App.css';

type View = 'placement' | 'home' | 'lesson';

const data = courseData as CourseData;

interface Stats {
  streak: number;
  hearts: number;
  gems: number;
  xp: number;
}

function App() {
  const [view, setView] = useState<View>('placement');
  const [recommendedUnit, setRecommendedUnit] = useState<string>('unit-1');
  const [unlockedUnits, setUnlockedUnits] = useState<Set<string>>(new Set(['unit-1']));
  const [selectedLesson, setSelectedLesson] = useState<{ unitId: string; lesson: Lesson } | null>(null);
  const [stats, setStats] = useState<Stats>({ streak: 3, hearts: 5, gems: 150, xp: 0 });

  const unlockChain = (unitId: string) => {
    const index = data.units.findIndex((u) => u.id === unitId);
    if (index === -1) return;
    const next = new Set<string>();
    data.units.slice(0, index + 1).forEach((u) => next.add(u.id));
    setUnlockedUnits(next);
  };

  const handlePlacementComplete = (_score: number, unitId: string) => {
    setRecommendedUnit(unitId);
    unlockChain(unitId);
    setView('home');
  };

  const handleStartLesson = (unitId: string, lesson: Lesson) => {
    setSelectedLesson({ unitId, lesson });
    setView('lesson');
  };

  const handleLessonComplete = (earnedXp: number) => {
    setStats((prev) => ({
      ...prev,
      xp: prev.xp + earnedXp,
      gems: prev.gems + 15,
      streak: prev.streak + 1,
    }));
    setSelectedLesson(null);
    setView('home');
  };

  const handleMiss = () => {
    setStats((prev) => ({ ...prev, hearts: Math.max(prev.hearts - 1, 0) }));
  };

  const decoratedUnits: Unit[] = useMemo(
    () =>
      data.units.map((unit) => ({
        ...unit,
        status: unlockedUnits.has(unit.id) ? 'unlocked' : 'locked',
      })),
    [unlockedUnits],
  );

  return (
    <div className="app-shell">
      <header className="hero-bar">
        <div className="brand-mark">
          <div className="brand-glyph">{'{ }'}</div>
          <div>
            <p className="eyebrow">CodeQuest</p>
            <h1>Codestar</h1>
            <p className="subtitle">{data.tagline}</p>
          </div>
        </div>
        {view !== 'placement' && <StatsHeader stats={stats} />}
      </header>

      {view === 'placement' && (
        <PlacementScreen
          placement={data.placement}
          characters={data.characters}
          onComplete={handlePlacementComplete}
        />
      )}

      {view === 'home' && (
        <HomeScreen
          units={decoratedUnits}
          recommendedUnit={recommendedUnit}
          characters={data.characters}
          onSelectLesson={handleStartLesson}
        />
      )}

      {view === 'lesson' && selectedLesson && (
        <LessonPlayer
          lesson={selectedLesson.lesson}
          character={data.characters.find((c) => c.id === selectedLesson.lesson.mascot)!}
          onExit={() => setView('home')}
          onComplete={() => handleLessonComplete(selectedLesson.lesson.xp)}
          onMiss={handleMiss}
          stats={stats}
        />
      )}
    </div>
  );
}

function StatsHeader({ stats }: { stats: Stats }) {
  return (
    <div className="stat-row">
      <StatPill icon={<Flame />} label="Streak" value={`${stats.streak} day`} tone="warm" />
      <StatPill icon={<Heart />} label="Lives" value={`${stats.hearts}`} tone="danger" />
      <StatPill icon={<Gem />} label="Gems" value={`${stats.gems}`} tone="accent" />
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  tone = 'base',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: 'base' | 'accent' | 'warm' | 'danger';
}) {
  return (
    <div className={`pill pill-${tone}`}>
      <div className="pill-icon">{icon}</div>
      <div>
        <p className="pill-label">{label}</p>
        <p className="pill-value">{value}</p>
      </div>
    </div>
  );
}

function PlacementScreen({
  placement,
  characters,
  onComplete,
}: {
  placement: Placement;
  characters: Character[];
  onComplete: (score: number, unitId: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [revealed, setRevealed] = useState(false);

  const question = placement.questions[currentIndex];
  const percent = Math.round(((currentIndex + 1) / placement.questions.length) * 100);

  const handleSelect = (value: string | number) => {
    setResponses((prev) => ({ ...prev, [question.id]: value }));
    setRevealed(false);
  };

  const isCorrect = () => {
    const response = responses[question.id];
    if (question.type === 'fill_in') {
      return typeof response === 'string' && response.trim() === (question.answerText ?? '');
    }
    return response === question.answerIndex;
  };

  const handleContinue = () => {
    const response = responses[question.id];
    const noResponse = response === undefined || response === null || response === '';
    if (noResponse) {
      setRevealed(true);
      return;
    }
    if (currentIndex < placement.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setRevealed(false);
      return;
    }

    const score = placement.questions.reduce((total, q) => {
      const response = responses[q.id];
      const correct =
        q.type === 'fill_in'
          ? typeof response === 'string' && response.trim() === (q.answerText ?? '')
          : response === q.answerIndex;
      return correct ? total + q.weight : total;
    }, 0);

    const level: PlacementLevel =
      placement.scoring
        .slice()
        .sort((a, b) => b.minScore - a.minScore)
        .find((option) => score >= option.minScore) ?? placement.scoring[0];

    onComplete(score, level.unitId);
  };

  return (
    <section className="placement">
      <div className="placement-card">
        <div className="placement-head">
          <div>
            <p className="eyebrow">Placement quiz</p>
            <h2>Find your starting point</h2>
            <p className="muted">{placement.lead}</p>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <CharacterStack characters={characters.slice(0, 3)} />
        </div>

        <QuestionCard
          question={question}
          response={responses[question.id]}
          onSelect={handleSelect}
          reveal={revealed}
        />

        <div className="placement-actions">
          <button className="ghost-btn" onClick={() => setRevealed(true)}>
            <Shield size={18} />
            Mark unsure
          </button>
          <button className="primary-btn" onClick={handleContinue}>
            {currentIndex === placement.questions.length - 1 ? 'See my placement' : 'Next question'}
          </button>
        </div>
        {revealed && responses[question.id] && (
          <div className={`feedback ${isCorrect() ? 'feedback-good' : 'feedback-bad'}`}>
            <Stars size={18} />
            <span>{isCorrect() ? 'On track — moving you up.' : 'Not quite — we will start with more support.'}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function CharacterStack({ characters }: { characters: Character[] }) {
  return (
    <div className="character-stack">
      {characters.map((character) => (
        <div key={character.id} className="mascot-pill" style={{ background: character.color }}>
          <span className="mascot-glyph">{character.glyph}</span>
          <span className="mascot-eyes" />
        </div>
      ))}
    </div>
  );
}

function QuestionCard({
  question,
  response,
  onSelect,
  reveal,
}: {
  question: PlacementQuestion | LessonQuestion;
  response: string | number | undefined;
  onSelect: (value: string | number) => void;
  reveal?: boolean;
}) {
  return (
    <div className="question-card">
      <div className="question-meta">
        <BookOpen size={16} />
        <span>{question.prompt}</span>
      </div>

      {question.code && (
        <pre className="code-block">
          {question.code.map((line) => (
            <code key={line}>{line}</code>
          ))}
        </pre>
      )}

      {question.type === 'multiple_choice' && question.choices && (
        <div className="choice-grid">
          {question.choices.map((choice, idx) => (
            <button
              key={choice}
              className={`choice ${response === idx ? 'choice-selected' : ''}`}
              onClick={() => onSelect(idx)}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {question.type === 'fill_in' && (
        <input
          className="input-field"
          placeholder="Type your answer"
          value={typeof response === 'string' ? response : ''}
          onChange={(e) => onSelect(e.target.value)}
        />
      )}

      {reveal && <p className="muted">Choose an option or type an answer to continue.</p>}
    </div>
  );
}

function HomeScreen({
  units,
  recommendedUnit,
  characters,
  onSelectLesson,
}: {
  units: Unit[];
  recommendedUnit: string;
  characters: Character[];
  onSelectLesson: (unitId: string, lesson: Lesson) => void;
}) {
  return (
    <section className="home">
      <div className="roadmap">
        {units.map((unit, unitIndex) => {
          const isRecommended = unit.id === recommendedUnit;
          const firstLesson = unit.lessons[0];
          return (
            <div key={unit.id} className={`roadmap-card ${unit.status === 'locked' ? 'roadmap-locked' : ''}`}>
              <div className="roadmap-head">
                <div className="unit-pill">
                  <span>Unit {unitIndex + 1}</span>
                  {unit.status === 'locked' ? <Lock size={14} /> : <Play size={14} />}
                </div>
                <p className="unit-title">{unit.title}</p>
                <p className="muted">{unit.tagline}</p>
                <div className="unit-meta">
                  <span>{unit.xp} XP</span>
                  {isRecommended && <span className="chip chip-accent">Placed here</span>}
                </div>
              </div>

              <div className="lesson-path">
                {unit.lessons.length === 0 && (
                  <p className="muted">Content coming from the syllabus.</p>
                )}
                {unit.lessons.map((lesson, lessonIdx) => (
                  <div key={lesson.id} className="lesson-node">
                    <div className="node-connector" />
                    <button
                      className={`node ${unit.status === 'locked' ? 'node-locked' : ''}`}
                      disabled={unit.status === 'locked'}
                      onClick={() => onSelectLesson(unit.id, lesson)}
                    >
                      <NodeFace character={characters.find((c) => c.id === lesson.mascot)} fallback={lessonIdx + 1} />
                      <div>
                        <p className="node-title">{lesson.title}</p>
                        <p className="muted">{lesson.focus}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {unit.status === 'unlocked' && firstLesson && (
                <button className="primary-btn block-btn" onClick={() => onSelectLesson(unit.id, firstLesson)}>
                  Continue
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NodeFace({ character, fallback }: { character?: Character; fallback: number }) {
  return (
    <div
      className="node-face"
      style={{ background: character?.color ?? '#6de100', boxShadow: 'inset 0 -8px 0 rgba(0,0,0,0.08)' }}
    >
      <span className="node-eyes" />
      <span className="node-glyph">{character?.glyph ?? fallback}</span>
    </div>
  );
}

function LessonPlayer({
  lesson,
  character,
  onExit,
  onComplete,
  onMiss,
  stats,
}: {
  lesson: Lesson;
  character: Character;
  onExit: () => void;
  onComplete: () => void;
  onMiss: () => void;
  stats: Stats;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const question = lesson.questions[currentIndex];

  const handleSelect = (value: string | number) => {
    setResponses((prev) => ({ ...prev, [question.id]: value }));
  };

  const answerIsCorrect = () => {
    const response = responses[question.id];
    if (question.type === 'fill_in') {
      return typeof response === 'string' && response.trim() === (question.answerText ?? '');
    }
    return response === question.answerIndex;
  };

  const handleCheck = () => {
    const response = responses[question.id];
    const noResponse = response === undefined || response === null || response === '';
    if (noResponse) {
      setShowFeedback(true);
      return;
    }

    if (answerIsCorrect()) {
      const next = currentIndex + 1;
      if (next >= lesson.questions.length) {
        onComplete();
      } else {
        setCurrentIndex(next);
        setShowFeedback(false);
      }
    } else {
      onMiss();
      setShowFeedback(true);
    }
  };

  const progress = Math.round(((currentIndex + 1) / lesson.questions.length) * 100);

  return (
    <section className="lesson">
      <div className="lesson-head">
        <button className="ghost-btn" onClick={onExit}>
          <ArrowLeft size={16} />
          Back to roadmap
        </button>
        <div className="progress slim">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <StatsHeader stats={stats} />
      </div>

      <div className="lesson-body">
        <div className="lesson-hero">
          <div className="lesson-avatar" style={{ background: character.accent }}>
            <span className="lesson-eyes" />
            <span className="lesson-glyph">{character.glyph}</span>
          </div>
          <div>
            <p className="eyebrow">Lesson</p>
            <h2>{lesson.title}</h2>
            <p className="muted">{lesson.focus}</p>
          </div>
        </div>

        <QuestionCard question={question} response={responses[question.id]} onSelect={handleSelect} />

        {showFeedback && (
          <div className={`feedback ${answerIsCorrect() ? 'feedback-good' : 'feedback-bad'}`}>
            {answerIsCorrect() ? <CheckCircle2 size={18} /> : <Shield size={18} />}
            <span>
              {answerIsCorrect()
                ? 'Nice — keep the streak alive.'
                : 'Close call. Review the code and try again.'}
            </span>
          </div>
        )}

        <div className="placement-actions">
          <button className="primary-btn" onClick={handleCheck}>
            {currentIndex === lesson.questions.length - 1 ? 'Complete lesson' : 'Check answer'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default App;
