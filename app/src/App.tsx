import { useEffect, useMemo, useState } from 'react'
import { Check, Flame, Gem, Heart, Lock, Play, X } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/themes/prism-tomorrow.css'
import EditorLib from 'react-simple-code-editor'
const Editor = (EditorLib as any).default || EditorLib
import './App.css'

type CourseQuestion = {
  id: string
  title: string
  type: string
  prompt: string
  code: string
  functionName?: string
  tests?: CodeTest[]
  choices: Array<{ key: string; text: string; isCorrect: boolean }>
  correctAnswer: string
  feedback: string
}

type CourseLesson = {
  id: string
  index: number
  title: string
  conceptIntroduced: string
  questions: CourseQuestion[]
}

type CourseUnit = {
  id: string
  number: number
  topic: string
  title: string
  lessons: CourseLesson[]
}

type PlacementQuestion = {
  id: string
  title: string
  prompt: string
  code: string
  choices: Array<{ id: string; text: string }>
  correctAnswer: string
  feedback: string
}

type CourseData = {
  units: CourseUnit[]
  placementQuiz: PlacementQuestion[]
}

type Screen = 'loading' | 'placement' | 'home' | 'lesson' | 'results'

type CodeTest = {
  call: string
  expected: string
}

type PlayQuestion = {
  id: string
  title: string
  prompt: string
  code: string
  type: 'multiple_choice' | 'fill_blank' | 'insight' | 'code_challenge'
  choices?: Array<{ id: string; text: string }>
  correctAnswer?: string
  feedback: string
  xp: number
  functionName?: string
  tests?: CodeTest[]
}

const STRINGS = ['{}', '()', ';', '[]', '</>', '=>', '!=', '::']

function stripMarkdown(text: string) {
  return text
    .replaceAll('`', '')
    .replaceAll('**', '')
    .replaceAll('*', '')
    .replaceAll('✅', '')
    .trim()
}

function lessonLabel(title: string) {
  const parts = title.split('—')
  return parts.length > 1 ? parts[1].trim() : title
}

function sanitizeForCompare(value: string) {
  return stripMarkdown(value).toLowerCase().replaceAll(' ', '')
}

function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [course, setCourse] = useState<CourseData | null>(null)
  
  const [streak, setStreak] = useState(() => {
    const val = localStorage.getItem('cs_streak')
    return val !== null ? Number(val) : 7
  })
  const [lives, setLives] = useState(() => {
    const val = localStorage.getItem('cs_lives')
    return val !== null ? Number(val) : 5
  })
  const [gems, setGems] = useState(() => {
    const val = localStorage.getItem('cs_gems')
    return val !== null ? Number(val) : 120
  })

  const [placementIndex, setPlacementIndex] = useState(0)
  const [placementScore, setPlacementScore] = useState(0)
  const [placementChoice, setPlacementChoice] = useState<string>('')
  const [placementFeedback, setPlacementFeedback] = useState('')

  const [feedbackVisible, setFeedbackVisible] = useState(false)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const [pyodide, setPyodide] = useState<any | null>(null)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [codeAnswer, setCodeAnswer] = useState('')
  const [codeChecking, setCodeChecking] = useState(false)

  const [startLessonId, setStartLessonId] = useState<string>(() => localStorage.getItem('cs_startLessonId') || '')
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const val = localStorage.getItem('cs_completedLessons')
    return val ? JSON.parse(val) : []
  })

  const [activeLessonId, setActiveLessonId] = useState('')
  const [lessonIndex, setLessonIndex] = useState(0)
  const [lessonChoice, setLessonChoice] = useState('')
  const [blankAnswer, setBlankAnswer] = useState('')
  const [lessonFeedback, setLessonFeedback] = useState('')
  const [lessonCorrect, setLessonCorrect] = useState(0)
  const [lastLessonTotal, setLastLessonTotal] = useState(0)

  useEffect(() => {
    async function loadCourse() {
      const response = await fetch('/data/curriculum.json')
      const payload = (await response.json()) as CourseData
      setCourse(payload)
      if (localStorage.getItem('cs_startLessonId')) {
        setScreen('home')
      } else {
        setScreen('placement')
      }
    }

    loadCourse().catch(() => setScreen('loading'))
  }, [])

  useEffect(() => {
    localStorage.setItem('cs_streak', streak.toString())
    localStorage.setItem('cs_lives', lives.toString())
    localStorage.setItem('cs_gems', gems.toString())
    localStorage.setItem('cs_startLessonId', startLessonId)
    localStorage.setItem('cs_completedLessons', JSON.stringify(completedLessons))
  }, [streak, lives, gems, startLessonId, completedLessons])

  useEffect(() => {
    async function initPyodide() {
      if (pyodideReady) return

      if (typeof (window as any).loadPyodide !== 'function') {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js'
          script.async = true
          script.onload = () => resolve()
          document.body.appendChild(script)
        })
      }

      const py = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/',
      })
      setPyodide(py)
      setPyodideReady(true)
    }

    initPyodide().catch(() => {
      console.warn('Failed to load Pyodide; code challenges will be disabled.')
    })
  }, [pyodideReady])

  const lessonTrack = useMemo(() => {
    if (!course) return []

    return course.units.flatMap((unit) =>
      unit.lessons.map((lesson) => ({
        ...lesson,
        unitNumber: unit.number,
        unitTitle: unit.topic,
      })),
    )
  }, [course])

  const startIndex = useMemo(() => {
    if (!startLessonId) return 0
    const found = lessonTrack.findIndex((lesson) => lesson.id === startLessonId)
    return found < 0 ? 0 : found
  }, [lessonTrack, startLessonId])

  const nextLessonId = useMemo(() => {
    const upcoming = lessonTrack.find((lesson, index) => {
      if (index < startIndex) return false
      return !completedLessons.includes(lesson.id)
    })

    return upcoming ? upcoming.id : ''
  }, [completedLessons, lessonTrack, startIndex])

  const activeLesson = useMemo(
    () => lessonTrack.find((lesson) => lesson.id === activeLessonId),
    [lessonTrack, activeLessonId],
  )

  const playableQuestions = useMemo<PlayQuestion[]>(() => {
    if (!activeLesson) return []

    return activeLesson.questions.map((question) => {
      const hasTests = Array.isArray(question.tests) && question.tests.length > 0
      const hasChoices = question.choices.length > 1
      const hasBlank = question.type === 'fill_blank' && question.correctAnswer

      if (hasTests) {
        return {
          id: question.id,
          title: stripMarkdown(question.title),
          prompt: stripMarkdown(question.prompt),
          code: question.code,
          type: 'code_challenge',
          functionName: question.functionName || '',
          tests: question.tests,
          feedback: stripMarkdown(question.feedback),
          xp: 18,
        }
      }

      if (hasChoices) {
        return {
          id: question.id,
          title: stripMarkdown(question.title),
          prompt: stripMarkdown(question.prompt),
          code: question.code,
          type: 'multiple_choice',
          choices: question.choices.map((choice) => ({
            id: choice.key,
            text: stripMarkdown(choice.text),
          })),
          correctAnswer: question.correctAnswer,
          feedback: stripMarkdown(question.feedback),
          xp: 10,
        }
      }

      if (hasBlank) {
        return {
          id: question.id,
          title: stripMarkdown(question.title),
          prompt: stripMarkdown(question.prompt),
          code: question.code,
          type: 'fill_blank',
          choices: [],
          correctAnswer: stripMarkdown(question.correctAnswer),
          feedback: stripMarkdown(question.feedback),
          xp: 12,
        }
      }

      return {
        id: question.id,
        title: stripMarkdown(question.title),
        prompt: stripMarkdown(question.prompt) || 'Read the snippet and lock in the pattern.',
        code: question.code,
        type: 'insight',
        choices: [],
        correctAnswer: 'understood',
        feedback: stripMarkdown(question.feedback) || 'Great. You are now ready for the next challenge.',
        xp: 8,
      }
    })
  }, [activeLesson])

  const currentPlacement = course?.placementQuiz[placementIndex]
  const currentQuestion = playableQuestions[lessonIndex]
  const progressPercent = playableQuestions.length
    ? Math.round((lessonIndex / playableQuestions.length) * 100)
    : 0

  useEffect(() => {
    if (currentQuestion?.type === 'code_challenge') {
      setCodeAnswer(currentQuestion.code)
    }
  }, [currentQuestion])

  function finishPlacement() {
    if (!course) return

    const percentage = course.placementQuiz.length
      ? (placementScore / course.placementQuiz.length) * 100
      : 0

    let targetUnit = 1
    if (percentage >= 88) targetUnit = 11
    else if (percentage >= 75) targetUnit = 9
    else if (percentage >= 60) targetUnit = 6
    else if (percentage >= 45) targetUnit = 4
    else if (percentage >= 30) targetUnit = 2

    const target = lessonTrack.find((lesson) => lesson.unitNumber >= targetUnit)
    const start = target ? target.id : lessonTrack[0]?.id ?? ''
    const startAt = lessonTrack.findIndex((lesson) => lesson.id === start)

    setStartLessonId(start)
    setCompletedLessons(lessonTrack.slice(0, Math.max(startAt, 0)).map((lesson) => lesson.id))
    setScreen('home')
    setPlacementIndex(0)
    setPlacementChoice('')
    setPlacementFeedback('')
  }

  function checkPlacementQuestion() {
    if (!currentPlacement || !placementChoice) return

    const correct = placementChoice === currentPlacement.correctAnswer
    if (correct) setPlacementScore((score) => score + 1)

    const feedback = correct
      ? 'Nice work — your reading is on point.'
      : stripMarkdown(currentPlacement.feedback) || 'Not quite — check the pattern and try again.'

    setPlacementFeedback(feedback)
    setFeedbackCorrect(correct)
    setFeedbackMessage(feedback)
    setFeedbackVisible(true)
  }

  function continuePlacement() {
    if (!course) return

    const next = placementIndex + 1
    if (next >= course.placementQuiz.length) {
      finishPlacement()
      return
    }

    setPlacementIndex(next)
    setPlacementChoice('')
    setPlacementFeedback('')
    setFeedbackVisible(false)
  }

  function startLesson(lessonId: string) {
    setFeedbackVisible(false)
    setActiveLessonId(lessonId)
    setLessonIndex(0)
    setLessonChoice('')
    setBlankAnswer('')
    setLessonFeedback('')
    setLessonCorrect(0)
    setScreen('lesson')
  }

  async function runCodeChallenge() {
    if (!currentQuestion || !pyodide) return

    setCodeChecking(true)
    setFeedbackVisible(false)

    try {
      const tests = currentQuestion.tests ?? []
      const fnName = currentQuestion.functionName || ''
      const code = codeAnswer || currentQuestion.code

      const pyCode = `
import json, traceback
ns = {}
results = []
fn_name = ${JSON.stringify(fnName)}
try:
    exec(${JSON.stringify(code)}, ns)
    fn = ns.get(fn_name)
    if fn is None:
        raise NameError('Function ' + fn_name + ' not defined')

    for t in ${JSON.stringify(tests)}:
        try:
            res = eval(t['call'], ns)
            expected = eval(t['expected'], ns)
            results.append({
                'ok': res == expected,
                'call': t['call'],
                'result': res,
                'expected': expected,
            })
        except Exception as e:
            results.append({
                'ok': False,
                'call': t.get('call', ''),
                'error': str(e),
            })
except Exception as e:
    results = [{'ok': False, 'error': traceback.format_exc()}]

json.dumps(results)
      `

      const resultJson = await pyodide.runPythonAsync(pyCode)
      const results = JSON.parse(resultJson as string)
      const failed = results.find((r: any) => !r.ok)

      if (failed) {
        const error = failed.error ? `${failed.error}` : ''
        const call = failed.call ? `\nTest: ${failed.call}` : ''
        const msg = `Not quite. ${error}${call}`
        setLessonFeedback(msg)
        setFeedbackCorrect(false)
        setFeedbackMessage(msg)
        setFeedbackVisible(true)
        setLives((value) => Math.max(0, value - 1))
      } else {
        setLessonCorrect((count) => count + 1)
        setGems((value) => value + currentQuestion.xp)
        const msg = currentQuestion.feedback || 'Nice work — tests passed.'
        setLessonFeedback(msg)
        setFeedbackCorrect(true)
        setFeedbackMessage(msg)
        setFeedbackVisible(true)
      }
    } catch (err) {
      const msg = `Error running code: ${err}`
      setLessonFeedback(msg)
      setFeedbackCorrect(false)
      setFeedbackMessage(msg)
      setFeedbackVisible(true)
      setLives((value) => Math.max(0, value - 1))
    } finally {
      setCodeChecking(false)
    }
  }

  function checkLesson() {
    if (!currentQuestion) return

    if (currentQuestion.type === 'insight') {
      setLessonCorrect((count) => count + 1)
      const msg = currentQuestion.feedback
      setLessonFeedback(msg)
      setFeedbackCorrect(true)
      setFeedbackMessage(msg)
      setFeedbackVisible(true)
      return
    }

    if (currentQuestion.type === 'code_challenge') {
      void runCodeChallenge()
      return
    }

    if (currentQuestion.type === 'multiple_choice' && !lessonChoice) return
    if (currentQuestion.type === 'fill_blank' && !blankAnswer.trim()) return

    let correct = false
    if (currentQuestion.type === 'multiple_choice') {
      correct = lessonChoice === currentQuestion.correctAnswer
    } else if (currentQuestion.type === 'fill_blank') {
      correct =
        sanitizeForCompare(blankAnswer) ===
        sanitizeForCompare(currentQuestion.correctAnswer ?? '')
    }

    if (correct) {
      setLessonCorrect((count) => count + 1)
      setGems((value) => value + currentQuestion.xp)
      const msg = currentQuestion.feedback || 'Correct. Keep climbing.'
      setLessonFeedback(msg)
      setFeedbackCorrect(true)
      setFeedbackMessage(msg)
      setFeedbackVisible(true)
      return
    }

    setLives((value) => Math.max(0, value - 1))
    const msg = currentQuestion.feedback || 'Not quite. Read the pattern and retry.'
    setLessonFeedback(msg)
    setFeedbackCorrect(false)
    setFeedbackMessage(msg)
    setFeedbackVisible(true)
  }

  function nextQuestion() {
    const next = lessonIndex + 1
    if (next >= playableQuestions.length) {
      if (activeLessonId) {
        setCompletedLessons((prev) => [...new Set([...prev, activeLessonId])])
      }
      setLastLessonTotal(playableQuestions.length)
      setStreak((value) => value + 1)
      setFeedbackVisible(false)
      setScreen('results')
      return
    }

    setLessonIndex(next)
    setLessonChoice('')
    setBlankAnswer('')
    setLessonFeedback('')
    setFeedbackVisible(false)
  }

  function closeLesson() {
    setFeedbackVisible(false)
    setScreen('home')
  }

  if (screen === 'loading') {
    return <main className="app-shell">Loading curriculum...</main>
  }

  if (screen === 'placement' && currentPlacement) {
    return (
      <main className="app-shell app-placement">
        <section className="placement-card">
          <div className="placement-mascot">{'</>'}</div>
          <h1>Placement Quiz</h1>
          <p>Answer a few code questions so your roadmap starts at the right level.</p>

          <div className="placement-progress">
            <div
              className="placement-progress-fill"
              style={{ width: `${((placementIndex + 1) / (course?.placementQuiz.length || 1)) * 100}%` }}
            />
          </div>

          <div className="question-label">{currentPlacement.title}</div>
          <div className="question-prompt">{stripMarkdown(currentPlacement.prompt)}</div>

          {currentPlacement.code ? <CodePanel code={currentPlacement.code} /> : null}

          <div className="answer-list">
            {currentPlacement.choices.map((choice) => (
              <button
                key={choice.id}
                className={`choice ${placementChoice === choice.id ? 'selected' : ''}`}
                onClick={() => setPlacementChoice(choice.id)}
                type="button"
              >
                <span className="choice-key">{choice.id}</span>
                <span>{stripMarkdown(choice.text)}</span>
              </button>
            ))}
          </div>

          {!placementFeedback ? (
            <button
              className="primary-btn"
              type="button"
              onClick={checkPlacementQuestion}
              disabled={!placementChoice}
            >
              Check
            </button>
          ) : (
            <button className="primary-btn" type="button" onClick={continuePlacement}>
              Continue
            </button>
          )}

          <FeedbackBar
            visible={feedbackVisible}
            correct={feedbackCorrect}
            message={feedbackMessage}
            onClose={() => setFeedbackVisible(false)}
          />
        </section>
      </main>
    )
  }

  if (screen === 'home' && course) {
    return (
      <main className="app-shell app-home">
        <TopBar stats={{ streak, lives, gems }} />

        <div className="main-content">
          <section className="roadmap">
            {course.units.map((unit) => (
              <article key={unit.id} className="unit-card">
                <div className="unit-header">
                  <div className="unit-tag">Unit {unit.number}</div>
                  <h2>{unit.topic}</h2>
                </div>

                  <div className="unit-path">
                    {unit.lessons.map((lesson, index) => {
                      const overall = lessonTrack.findIndex((item) => item.id === lesson.id)
                      const done = completedLessons.includes(lesson.id)
                      const current = lesson.id === nextLessonId
                      const locked = !done && !current
                      const offset = index % 2 === 0 ? 'left' : 'right'

                      return (
                        <div key={lesson.id} className={`path-item ${offset}`}>
                          <button
                            className={`lesson-node ${done ? 'done' : ''} ${current ? 'current' : ''} ${locked ? 'locked' : ''}`}
                            type="button"
                            onClick={() => (locked ? undefined : startLesson(lesson.id))}
                          >
                            {done ? (
                              <Check size={18} />
                            ) : current ? (
                              <span className="symbol-mascot">{STRINGS[overall % STRINGS.length]}</span>
                            ) : (
                              <Lock size={16} />
                            )}
                          </button>
                          <div className="lesson-name">{lessonLabel(lesson.title)}</div>
                        </div>
                      )
                    })}
                  </div>
                </article>
              ))}
            </section>
          </div>

          <FeedbackBar
            visible={feedbackVisible}
            correct={feedbackCorrect}
            message={feedbackMessage}
            onClose={() => setFeedbackVisible(false)}
          />
      </main>
    )
  }

  if (screen === 'lesson' && activeLesson && currentQuestion) {
    return (
      <main className="app-shell app-lesson">
        <header className="lesson-top">
          <button className="close-btn" onClick={closeLesson} aria-label="Close lesson">
            <X size={24} />
          </button>
          <div className="lesson-progress">
            <div className="lesson-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="hearts-display" title={`${lives} lives remaining`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`heart ${i >= lives ? 'lost' : ''}`}>
                ❤️
              </span>
            ))}
          </div>
        </header>

          <section className="lesson-body">
            <div className="question-label">{currentQuestion.title}</div>
            <h2 className="question-prompt">{currentQuestion.prompt}</h2>

            {currentQuestion.type === 'code_challenge' ? (
              <div className="code-editor-wrapper">
                <div className="code-editor-container">
                  <Editor
                    className="code-editor"
                    value={codeAnswer}
                    onValueChange={(code: string) => setCodeAnswer(code)}
                    highlight={(code: string) => Prism.highlight(code, Prism.languages.python, 'python')}
                    padding={16}
                    textareaClassName="code-editor-textarea"
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '0.95rem',
                      minHeight: '220px',
                    }}
                  />
                </div>
                <div className="code-hint">Write your function and press Check to run tests.</div>
              </div>
            ) : currentQuestion.code ? (
              <CodePanel code={currentQuestion.code} />
            ) : null}

          {currentQuestion.type === 'multiple_choice' ? (
            <div className="answer-list">
              {currentQuestion.choices?.map((choice) => (
                <button
                  key={choice.id}
                  className={`choice ${lessonChoice === choice.id ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setLessonChoice(choice.id)}
                >
                  <span className="choice-key">{choice.id}</span>
                  <span>{choice.text}</span>
                </button>
              ))}
            </div>
          ) : null}

          {currentQuestion.type === 'fill_blank' ? (
            <input
              className="blank-input"
              value={blankAnswer}
              onChange={(event) => setBlankAnswer(event.target.value)}
              placeholder="Type your answer"
            />
          ) : null}

          {currentQuestion.type === 'insight' ? (
            <div className="insight-box">Read this pattern carefully, then continue.</div>
          ) : null}

          {!lessonFeedback ? (
            <button
              className="primary-btn"
              type="button"
              onClick={checkLesson}
              disabled={
                (currentQuestion.type === 'multiple_choice' && !lessonChoice) ||
                (currentQuestion.type === 'fill_blank' && !blankAnswer.trim()) ||
                (currentQuestion.type === 'code_challenge' && (!pyodideReady || codeChecking))
              }
            >
              {currentQuestion.type === 'code_challenge'
                ? codeChecking
                  ? 'Running…'
                  : 'Check'
                : 'Check'}
            </button>
          ) : (
            <button className="primary-btn" type="button" onClick={nextQuestion}>
              Continue
            </button>
          )}
        </section>

        <FeedbackBar
          visible={feedbackVisible}
          correct={feedbackCorrect}
          message={feedbackMessage}
          onClose={() => setFeedbackVisible(false)}
        />
      </main>
    )
  }

  return (
    <main className="app-shell app-results">
      <section className="results-card">
        <div className="results-mascot">{'{}'}</div>
        <h2>Lesson Complete</h2>
        <div className="result-grid">
          <article>
            <strong>{lastLessonTotal ? Math.round((lessonCorrect / lastLessonTotal) * 100) : 0}%</strong>
            <span>accuracy</span>
          </article>
          <article>
            <strong>+{lessonCorrect * 10}</strong>
            <span>gems</span>
          </article>
          <article>
            <strong>{streak}</strong>
            <span>streak</span>
          </article>
        </div>

        {nextLessonId ? (
          <button className="primary-btn" type="button" onClick={() => setScreen('home')}>
            <Play size={16} />
            Back to Roadmap
          </button>
        ) : (
          <button className="primary-btn" type="button" onClick={() => setScreen('home')}>
            Course Completed
          </button>
        )}
      </section>
    </main>
  )
}

function CodePanel({ code }: { code: string }) {
  return (
    <div className="code-panel">
      <Highlight theme={themes.vsDark} code={code} language="python">
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

type TopBarProps = {
  stats: {
    streak: number
    lives: number
    gems: number
  }
  onClose?: () => void
}

function TopBar({ stats, onClose }: TopBarProps) {
  const mascot = STRINGS[(stats.streak + stats.gems) % STRINGS.length]

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {onClose ? (
          <button className="close-btn" type="button" onClick={onClose} aria-label="Close lesson">
            <X size={18} />
          </button>
        ) : (
          <div className="logo">
            <span className="logo-owl" aria-hidden="true">
              {mascot}
            </span>
            <span>CodeOwl</span>
          </div>
        )}
      </div>

      <div className="top-bar-stats">
        <div className="stat-pill streak" aria-label="Streak">
          <Flame size={16} />
          <span>{stats.streak}</span>
        </div>
        <div className="stat-pill lives" aria-label="Lives">
          <Heart size={16} />
          <span>{stats.lives}</span>
        </div>
        <div className="stat-pill gems" aria-label="Gems">
          <Gem size={16} />
          <span>{stats.gems}</span>
        </div>
      </div>
    </header>
  )
}

type FeedbackBarProps = {
  visible: boolean
  correct: boolean
  message: string
  onClose: () => void
}

function FeedbackBar({ visible, correct, message, onClose }: FeedbackBarProps) {
  return (
    <div
      className={`feedback-bar ${visible ? 'visible' : ''} ${correct ? 'correct' : 'incorrect'}`}
      role="status"
      aria-live="polite"
    >
      <div className="feedback-text">
        {correct ? <Check size={18} /> : <X size={18} />}
        <span>{message}</span>
      </div>
      <button className="feedback-close" type="button" onClick={onClose} aria-label="Dismiss feedback">
        <X size={18} />
      </button>
    </div>
  )
}

export default App
