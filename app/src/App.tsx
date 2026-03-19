import { useEffect, useMemo, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { Check, Flame, Gem, Heart, LogOut, Play, Star, X } from 'lucide-react'
import { Highlight, themes } from 'prism-react-renderer'
import Prism from 'prismjs'
import PocketBase, { type RecordModel } from 'pocketbase'
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
  rawMarkdown?: string
  choices: Array<{ key: string; text: string; isCorrect: boolean }>
  matchingPairs?: Array<{ left: string; right: string }>
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

type Screen = 'loading' | 'auth' | 'placement' | 'home' | 'lesson' | 'results'

type CodeTest = {
  call: string
  expected: string
}

type PlayQuestion = {
  id: string
  title: string
  prompt: string
  code: string
  type: 'multiple_choice' | 'fill_blank' | 'insight' | 'code_challenge' | 'arrange_blocks' | 'match_pairs'
  choices?: Array<{ id: string; text: string }>
  correctAnswer?: string
  feedback: string
  xp: number
  functionName?: string
  tests?: CodeTest[]
  arrangeBlocks?: string[]
  arrangeCorrectOrder?: string[]
  matchingPairs?: Array<{ id: string; left: string; right: string }>
}

type ArrangeBlock = {
  id: string
  text: string
}

type GameState = {
  streak: number
  lives: number
  gems: number
  startLessonId: string
  completedLessons: string[]
  lastLifeRefillDate: string
  lastLessonDate: string
}

type AuthMode = 'login' | 'register'

const STRINGS = ['{}', '()', ';', '[]', '</>', '=>', '!=', '::']
const MAX_LIVES = 5
const PB_URL = (import.meta.env.VITE_POCKETBASE_URL as string | undefined) || 'http://127.0.0.1:8090'
const pb = new PocketBase(PB_URL)

function stripMarkdown(text: string) {
  return text
    .replaceAll('`', '')
    .replaceAll('**', '')
    .replaceAll('*', '')
    .trim()
}

function sanitizeForCompare(value: string) {
  return stripMarkdown(value).toLowerCase().replaceAll(' ', '')
}

function normalizeCodeLineForCompare(line: string) {
  return line.replaceAll('\t', '    ').trim().replace(/\s+/g, ' ')
}

function codeLinesFromSnippet(snippet: string) {
  return snippet
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, ''))
    .filter((line) => line.trim().length > 0)
}

function extractArrangeBlocksFromMarkdown(rawMarkdown?: string) {
  if (!rawMarkdown) return []
  const match = rawMarkdown.match(/Blocks:\s*```(?:python)?\s*([\s\S]*?)```/i)
  if (!match) return []
  return codeLinesFromSnippet(match[1])
}

function extractArrangeCorrectOrderFromMarkdown(rawMarkdown?: string) {
  if (!rawMarkdown) return []
  const match = rawMarkdown.match(/\*Correct(?:\s+order)?:\*[\s\S]*?```(?:python)?\s*([\s\S]*?)```/i)
  if (!match) return []
  return codeLinesFromSnippet(match[1])
}

function shuffleBlocks<T>(items: T[]) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

function todayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function yesterdayKey(fromKey: string) {
  const [year, month, day] = fromKey.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

function parseCompletedLessons(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === 'string')
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === 'string')
      }
    } catch {
      return []
    }
  }

  return []
}

function normalizeGameState(record: RecordModel | null): GameState {
  const today = todayKey()
  const streak = typeof record?.streak === 'number' ? record.streak : 0
  const gems = typeof record?.gems === 'number' ? record.gems : 120
  const rawLives = typeof record?.lives === 'number' ? record.lives : MAX_LIVES
  const startLessonId = typeof record?.startLessonId === 'string' ? record.startLessonId : ''
  const completedLessons = parseCompletedLessons(record?.completedLessons)
  const lastLifeRefillDate = typeof record?.lastLifeRefillDate === 'string' ? record.lastLifeRefillDate : today
  const lastLessonDate = typeof record?.lastLessonDate === 'string' ? record.lastLessonDate : ''

  const lives = lastLifeRefillDate === today ? Math.max(0, Math.min(MAX_LIVES, rawLives)) : MAX_LIVES

  return {
    streak,
    gems,
    lives,
    startLessonId,
    completedLessons,
    lastLifeRefillDate: today,
    lastLessonDate,
  }
}

function pocketbaseError(error: unknown) {
  const message = (error as any)?.response?.message
  if (typeof message === 'string' && message.trim().length > 0) {
    return message
  }

  return 'Something went wrong. Please try again.'
}

function usernameFromEmail(email: string) {
  const [left] = email.split('@')
  const safe = (left || 'coder').toLowerCase().replace(/[^a-z0-9_]/g, '')
  return `${safe.slice(0, 20)}${Math.floor(Math.random() * 10000)}`
}

function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [course, setCourse] = useState<CourseData | null>(null)
  const [courseLoaded, setCourseLoaded] = useState(false)

  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('')
  const [authName, setAuthName] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')

  const [userRecord, setUserRecord] = useState<RecordModel | null>(null)
  const [gameHydrated, setGameHydrated] = useState(false)

  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gems, setGems] = useState(120)
  const [startLessonId, setStartLessonId] = useState('')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [lastLifeRefillDate, setLastLifeRefillDate] = useState(todayKey())
  const [lastLessonDate, setLastLessonDate] = useState('')

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

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [activeLessonId, setActiveLessonId] = useState('')
  const [lessonIndex, setLessonIndex] = useState(0)
  const [lessonChoice, setLessonChoice] = useState('')
  const [blankAnswer, setBlankAnswer] = useState('')
  const [arrangePool, setArrangePool] = useState<ArrangeBlock[]>([])
  const [arrangeAnswer, setArrangeAnswer] = useState<ArrangeBlock[]>([])
  const [matchLeftList, setMatchLeftList] = useState<ArrangeBlock[]>([])
  const [matchRightList, setMatchRightList] = useState<ArrangeBlock[]>([])
  const [matchSelectedLeft, setMatchSelectedLeft] = useState('')
  const [matchSelectedRight, setMatchSelectedRight] = useState('')
  const [matchErrorLeft, setMatchErrorLeft] = useState('')
  const [matchErrorRight, setMatchErrorRight] = useState('')
  const [matchCompleted, setMatchCompleted] = useState<string[]>([])
  const [lessonFeedback, setLessonFeedback] = useState('')
  const [lessonCorrect, setLessonCorrect] = useState(0)
  const [lastLessonTotal, setLastLessonTotal] = useState(0)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUserRecord(record ?? null)
      if (!record) {
        setGameHydrated(false)
        setScreen('auth')
      }
    })

    setUserRecord(pb.authStore.record ?? null)
    if (!pb.authStore.record) {
      setScreen('auth')
    }

    return unsubscribe
  }, [])

  useEffect(() => {
    async function loadCourse() {
      const response = await fetch('/data/curriculum.json')
      const payload = (await response.json()) as CourseData
      setCourse(payload)
      setCourseLoaded(true)
    }

    loadCourse().catch(() => {
      setCourseLoaded(false)
      setScreen('loading')
    })
  }, [])

  useEffect(() => {
      if (!userRecord || !courseLoaded || gameHydrated) return

      pb.collection('users').getOne(userRecord.id, { $autoCancel: false }).then((freshRecord) => {
        pb.authStore.save(pb.authStore.token, freshRecord)
        setUserRecord(freshRecord)

        const normalized = normalizeGameState(freshRecord)
        setStreak(normalized.streak)
        setLives(normalized.lives)
        setGems(normalized.gems)
        setStartLessonId(normalized.startLessonId)
        setCompletedLessons(normalized.completedLessons)
        setLastLifeRefillDate(normalized.lastLifeRefillDate)
        setLastLessonDate(normalized.lastLessonDate)
        setGameHydrated(true)

        const hasStarted = normalized.startLessonId.length > 0
        setScreen(hasStarted ? 'home' : 'placement')

        // Sync back any default fills (e.g. today's lives)
        void pb.collection('users').update(freshRecord.id, {
          streak: normalized.streak,
          gems: normalized.gems,
          lives: normalized.lives,
          maxLives: MAX_LIVES,
          startLessonId: normalized.startLessonId,
          completedLessons: normalized.completedLessons,
          lastLifeRefillDate: normalized.lastLifeRefillDate,
          lastLessonDate: normalized.lastLessonDate,
        }, { $autoCancel: false })
      }).catch((err) => {
        console.warn('Failed to fetch latest save state:', err)
        // Fallback to local record if offline
        const normalized = normalizeGameState(userRecord)
        setStreak(normalized.streak)
        setLives(normalized.lives)
        setGems(normalized.gems)
        setStartLessonId(normalized.startLessonId)
        setCompletedLessons(normalized.completedLessons)
        setLastLifeRefillDate(normalized.lastLifeRefillDate)
        setLastLessonDate(normalized.lastLessonDate)
        setGameHydrated(true)
        const hasStarted = normalized.startLessonId.length > 0
        setScreen(hasStarted ? 'home' : 'placement')
      })
    }, [userRecord?.id, courseLoaded, gameHydrated])

  useEffect(() => {
    if (!userRecord || !gameHydrated) return

    const timer = setTimeout(() => {
      void pb.collection('users').update(userRecord.id, {
        streak,
        gems,
        lives,
        maxLives: MAX_LIVES,
        startLessonId,
        completedLessons,
        lastLifeRefillDate,
        lastLessonDate,
      }, { $autoCancel: false }).then((record) => {
        setUserRecord(record)
      }).catch((error) => {
        console.warn('Failed to sync game state:', error)
      })
    }, 250)

    return () => clearTimeout(timer)
  }, [
    completedLessons,
    gameHydrated,
    gems,
    lastLessonDate,
    lastLifeRefillDate,
    lives,
    startLessonId,
    streak,
    userRecord?.id,
  ])

  useEffect(() => {
    if (!gameHydrated) return

    const timer = setInterval(() => {
      const today = todayKey()
      if (lastLifeRefillDate !== today) {
        setLives(MAX_LIVES)
        setLastLifeRefillDate(today)
      }
    }, 60_000)

    return () => clearInterval(timer)
  }, [gameHydrated, lastLifeRefillDate])

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
      const isArrange = question.type === 'arrange_blocks'
      const isMatch = question.type === 'match_pairs' && question.matchingPairs && question.matchingPairs.length > 0

      if (isMatch) {
        return {
          id: question.id,
          title: stripMarkdown(question.title),
          prompt: stripMarkdown(question.prompt),
          code: question.code,
          type: 'match_pairs',
          matchingPairs: question.matchingPairs?.map((pair, idx) => ({ id: `pair-${idx}`, left: stripMarkdown(pair.left), right: stripMarkdown(pair.right) })),
          feedback: stripMarkdown(question.feedback),
          xp: 12,
        }
      }

      if (isArrange) {
        const blocks = extractArrangeBlocksFromMarkdown(question.rawMarkdown)
        const correctOrder = extractArrangeCorrectOrderFromMarkdown(question.rawMarkdown)
        const fallbackBlocks = codeLinesFromSnippet(question.code)
        const effectiveBlocks = blocks.length > 0 ? blocks : fallbackBlocks
        const effectiveCorrect = correctOrder.length > 0 ? correctOrder : fallbackBlocks

        return {
          id: question.id,
          title: stripMarkdown(question.title),
          prompt: stripMarkdown(question.prompt),
          code: question.code,
          type: 'arrange_blocks',
          arrangeBlocks: effectiveBlocks,
          arrangeCorrectOrder: effectiveCorrect,
          feedback: stripMarkdown(question.feedback),
          xp: 14,
        }
      }

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
    if (currentQuestion?.type === 'arrange_blocks') {
      const blocks = currentQuestion.arrangeBlocks ?? []
      const arrangedBlocks = blocks.map((text, index) => ({
        id: `${currentQuestion.id}-${index}`,
        text,
      }))
      setArrangePool(shuffleBlocks(arrangedBlocks))
      setArrangeAnswer([])
    }
    if (currentQuestion?.type === 'match_pairs') {
      const pairs = currentQuestion.matchingPairs ?? []
      const lefts = pairs.map((p) => ({ id: p.id, text: p.left }))
      const rights = pairs.map((p) => ({ id: p.id, text: p.right }))
      setMatchLeftList(shuffleBlocks(lefts))
      setMatchRightList(shuffleBlocks(rights))
      setMatchSelectedLeft('')
      setMatchSelectedRight('')
      setMatchCompleted([])
    }

    // Reset feedback state when the question changes so the UI always starts with "Check"
    setLessonFeedback('')
    setFeedbackMessage('')
    setFeedbackCorrect(false)
    setFeedbackVisible(false)
  }, [currentQuestion])

  useEffect(() => {
    if (screen !== 'home') return
    if (!nextLessonId) return

    const scrollToCurrent = () => {
      const el = document.getElementById(`lesson-${nextLessonId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const timeout = window.setTimeout(scrollToCurrent, 50)
    return () => window.clearTimeout(timeout)
  }, [screen, nextLessonId])

  function parseArrangeDragPayload(event: DragEvent<HTMLElement>) {
    try {
      const raw = event.dataTransfer.getData('text/plain')
      const parsed = JSON.parse(raw) as { zone: 'pool' | 'answer'; id: string }
      if (!parsed?.id || (parsed.zone !== 'pool' && parsed.zone !== 'answer')) return null
      return parsed
    } catch {
      return null
    }
  }

  function handleArrangeDrop(targetZone: 'pool' | 'answer', targetIndex?: number) {
    return (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      const payload = parseArrangeDragPayload(event)
      if (!payload) return

      const sourceZone = payload.zone
      const sourceList = sourceZone === 'pool' ? arrangePool : arrangeAnswer
      const sourceIndex = sourceList.findIndex((item) => item.id === payload.id)
      if (sourceIndex < 0) return

      const block = sourceList[sourceIndex]
      if (!block) return

      if (sourceZone === targetZone) {
        const list = [...sourceList]
        const [picked] = list.splice(sourceIndex, 1)
        if (!picked) return

        let insertAt = targetIndex ?? list.length
        if (sourceIndex < insertAt) insertAt -= 1
        insertAt = Math.max(0, Math.min(insertAt, list.length))
        list.splice(insertAt, 0, picked)

        if (targetZone === 'pool') setArrangePool(list)
        else setArrangeAnswer(list)
        return
      }

      const nextSource = [...sourceList]
      nextSource.splice(sourceIndex, 1)

      const targetList = targetZone === 'pool' ? arrangePool : arrangeAnswer
      const nextTarget = [...targetList]
      const insertAt = Math.max(0, Math.min(targetIndex ?? nextTarget.length, nextTarget.length))
      nextTarget.splice(insertAt, 0, block)

      if (sourceZone === 'pool') setArrangePool(nextSource)
      else setArrangeAnswer(nextSource)

      if (targetZone === 'pool') setArrangePool(nextTarget)
      else setArrangeAnswer(nextTarget)
    }
  }

  function handleArrangeDragStart(zone: 'pool' | 'answer', block: ArrangeBlock) {
    return (event: DragEvent<HTMLElement>) => {
      event.dataTransfer.setData('text/plain', JSON.stringify({ zone, id: block.id }))
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function moveArrangeToAnswer(block: ArrangeBlock) {
    setArrangePool((prev) => prev.filter((item) => item.id !== block.id))
    setArrangeAnswer((prev) => [...prev, block])
  }

  function moveArrangeToPool(block: ArrangeBlock) {
    setArrangeAnswer((prev) => prev.filter((item) => item.id !== block.id))
    setArrangePool((prev) => [...prev, block])
  }

  function handleMatchClick(side: 'left' | 'right', id: string) {
    if (matchErrorLeft || matchErrorRight) return // block clicks while error animating

    if (side === 'left') {
      if (matchSelectedLeft === id) {
        setMatchSelectedLeft('')
        return
      }
      setMatchSelectedLeft(id)
      if (matchSelectedRight) attemptMatch(id, matchSelectedRight)
    } else {
      if (matchSelectedRight === id) {
        setMatchSelectedRight('')
        return
      }
      setMatchSelectedRight(id)
      if (matchSelectedLeft) attemptMatch(matchSelectedLeft, id)
    }
  }

  function attemptMatch(leftId: string, rightId: string) {
    if (leftId === rightId) {
      setMatchCompleted((prev) => [...prev, leftId])
      setMatchSelectedLeft('')
      setMatchSelectedRight('')
    } else {
      // Wrong match
      setMatchErrorLeft(leftId)
      setMatchErrorRight(rightId)
      
      const availableLives = ensurePlayableLives()
      const nextLives = Math.max(0, availableLives - 1)
      setLives(nextLives)

      setTimeout(() => {
        setMatchErrorLeft('')
        setMatchErrorRight('')
        setMatchSelectedLeft('')
        setMatchSelectedRight('')
      }, 500)

      if (nextLives <= 0) {
        showOutOfLivesMessage()
      }
    }
  }

  const outOfLives = lives <= 0 && lastLifeRefillDate === todayKey()

  function ensurePlayableLives() {
    const today = todayKey()
    if (lastLifeRefillDate !== today) {
      setLives(MAX_LIVES)
      setLastLifeRefillDate(today)
      return MAX_LIVES
    }

    return lives
  }

  function showOutOfLivesMessage() {
    const message = 'You are out of lives. Come back tomorrow for a full refill.'
    setLessonFeedback(message)
    setFeedbackCorrect(false)
    setFeedbackMessage(message)
    setFeedbackVisible(true)
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError('')
    setAuthBusy(true)

    try {
      if (authMode === 'register') {
        if (authPassword.length < 8) {
          throw new Error('Password must be at least 8 characters.')
        }

        if (authPassword !== authPasswordConfirm) {
          throw new Error('Passwords do not match.')
        }

        await pb.collection('users').create({
          email: authEmail,
          password: authPassword,
          passwordConfirm: authPasswordConfirm,
          name: authName.trim() || authEmail.split('@')[0],
          username: usernameFromEmail(authEmail),
          emailVisibility: true,
          streak: 0,
          gems: 120,
          lives: MAX_LIVES,
          maxLives: MAX_LIVES,
          startLessonId: '',
          completedLessons: [],
          lastLifeRefillDate: todayKey(),
          lastLessonDate: '',
        })
      }

      await pb.collection('users').authWithPassword(authEmail, authPassword)
      setAuthPassword('')
      setAuthPasswordConfirm('')
      setAuthError('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : pocketbaseError(error))
    } finally {
      setAuthBusy(false)
    }
  }

  function logout() {
    pb.authStore.clear()
    setGameHydrated(false)
    setScreen('auth')
    setStreak(0)
    setLives(MAX_LIVES)
    setGems(120)
    setStartLessonId('')
    setCompletedLessons([])
    setLastLifeRefillDate(todayKey())
    setLastLessonDate('')
    setPlacementIndex(0)
    setPlacementScore(0)
    setPlacementChoice('')
    setPlacementFeedback('')
    setFeedbackVisible(false)
  }

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
      ? 'Nice work - your reading is on point.'
      : stripMarkdown(currentPlacement.feedback) || 'Not quite - check the pattern and try again.'

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
    const availableLives = ensurePlayableLives()
    if (availableLives <= 0) {
      showOutOfLivesMessage()
      return
    }

    const lessonObj = lessonTrack.find((l) => l.id === lessonId)
    if (lessonObj && (!lessonObj.questions || lessonObj.questions.length === 0)) {
      setFeedbackVisible(false)
      setSelectedLessonId(null)
      setActiveLessonId(lessonId)
      setCompletedLessons((prev) => [...new Set([...prev, lessonId])])
      setLastLessonTotal(0)
      setLessonCorrect(0)
      setScreen('results')
      return
    }

    setFeedbackVisible(false)
    setSelectedLessonId(null)
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

    const availableLives = ensurePlayableLives()
    if (availableLives <= 0) {
      showOutOfLivesMessage()
      return
    }

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
        const nextLives = Math.max(0, availableLives - 1)
        setLives(nextLives)

        const msg = nextLives <= 0
          ? 'You are out of lives. Come back tomorrow for a full refill.'
          : `Not quite. ${error}${call}`

        setLessonFeedback(msg)
        setFeedbackCorrect(false)
        setFeedbackMessage(msg)
        setFeedbackVisible(true)
      } else {
        setLessonCorrect((count) => count + 1)
        setGems((value) => value + currentQuestion.xp)
        const msg = currentQuestion.feedback || 'Nice work - tests passed.'
        setLessonFeedback(msg)
        setFeedbackCorrect(true)
        setFeedbackMessage(msg)
        setFeedbackVisible(true)
      }
    } catch (err) {
      const available = ensurePlayableLives()
      const nextLives = Math.max(0, available - 1)
      setLives(nextLives)

      const msg = nextLives <= 0
        ? 'You are out of lives. Come back tomorrow for a full refill.'
        : `Error running code: ${err}`

      setLessonFeedback(msg)
      setFeedbackCorrect(false)
      setFeedbackMessage(msg)
      setFeedbackVisible(true)
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

    const availableLives = ensurePlayableLives()
    if (availableLives <= 0) {
      showOutOfLivesMessage()
      return
    }

    if (currentQuestion.type === 'code_challenge') {
      void runCodeChallenge()
      return
    }

    if (currentQuestion.type === 'arrange_blocks') {
      const expected = currentQuestion.arrangeCorrectOrder ?? []
      if (arrangeAnswer.length !== expected.length) return

      const correct = arrangeAnswer.every((line, index) => {
        const expectedLine = expected[index] ?? ''
        return normalizeCodeLineForCompare(line.text) === normalizeCodeLineForCompare(expectedLine)
      })

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

      const nextLives = Math.max(0, availableLives - 1)
      setLives(nextLives)
      const msg = nextLives <= 0
        ? 'You are out of lives. Come back tomorrow for a full refill.'
        : currentQuestion.feedback || 'Not quite. Read the pattern and retry.'
      setLessonFeedback(msg)
      setFeedbackCorrect(false)
      setFeedbackMessage(msg)
      setFeedbackVisible(true)
      return
    }

    if (currentQuestion.type === 'multiple_choice' && !lessonChoice) return
    if (currentQuestion.type === 'fill_blank' && !blankAnswer.trim()) return

    let correct = false
    if (currentQuestion.type === 'match_pairs') {
      correct = matchCompleted.length === (currentQuestion.matchingPairs?.length ?? 0)
    } else if (currentQuestion.type === 'multiple_choice') {
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

    const nextLives = Math.max(0, availableLives - 1)
    setLives(nextLives)

    const msg = nextLives <= 0
      ? 'You are out of lives. Come back tomorrow for a full refill.'
      : currentQuestion.feedback || 'Not quite. Read the pattern and retry.'

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

      const today = todayKey()
      if (lastLessonDate !== today) {
        const prev = lastLessonDate
        const nextStreak = prev && prev === yesterdayKey(today) ? streak + 1 : 1
        setStreak(nextStreak)
        setLastLessonDate(today)
      }

      setLastLessonTotal(playableQuestions.length)
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

  if (screen === 'auth') {
    return (
      <main className="app-shell app-auth">
        <section className="auth-card">
          <div className="placement-mascot">{'{}'}</div>
          <h1>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>Sign in to sync streaks, gems, and lives with PocketBase.</p>

          <div className="auth-toggle">
            <button
              type="button"
              className={`choice ${authMode === 'login' ? 'selected' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`choice ${authMode === 'register' ? 'selected' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={submitAuth}>
            {authMode === 'register' ? (
              <input
                className="blank-input"
                placeholder="Display name"
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
              />
            ) : null}

            <input
              className="blank-input"
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              required
            />
            <input
              className="blank-input"
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              required
            />

            {authMode === 'register' ? (
              <input
                className="blank-input"
                type="password"
                placeholder="Confirm password"
                value={authPasswordConfirm}
                onChange={(event) => setAuthPasswordConfirm(event.target.value)}
                required
              />
            ) : null}

            {authError ? <div className="auth-error">{authError}</div> : null}

            <button className="primary-btn" type="submit" disabled={authBusy}>
              {authBusy ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  if (screen === 'loading' || !courseLoaded || !gameHydrated) {
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
        <TopBar stats={{ streak, lives, gems }} onLogout={logout} />

        <div className="main-content">
          {outOfLives ? (
            <div className="auth-error home-warning">Out of lives for today. Come back tomorrow for a refill.</div>
          ) : null}

          <section className="roadmap">
            {course.units.map((unit) => (
              <article key={unit.id} className="unit-card">
                <div className="unit-header">
                  <div className="unit-tag">Unit {unit.number}</div>
                  <h2>{unit.topic}</h2>
                </div>

                <div className="unit-path">
                  {unit.lessons.map((lesson, index) => {
                    const done = completedLessons.includes(lesson.id)
                    const current = lesson.id === nextLessonId
                    const locked = !done && (!current || outOfLives)
                    
                    const cycleIndex = index % 8
                    const offsets = [0, 45, 75, 45, 0, -45, -75, -45]
                    const translateX = offsets[cycleIndex]

                    return (
                      <div
                        key={lesson.id}
                        className="path-item"
                        style={{
                          transform: `translateX(${translateX}px)`,
                          zIndex: selectedLessonId === lesson.id ? 99999 : 1,
                        }}
                      >
                        {selectedLessonId === lesson.id && (
                          <div className={`lesson-popover ${locked ? 'locked' : ''} ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                            <div className="popover-content">
                              <h3 className="popover-title">{lesson.title}</h3>
                              <p className="popover-concept">Lesson {index + 1} of {unit.lessons.length}</p>
                              <button
                                className="start-btn"
                                disabled={locked}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!locked) {
                                    startLesson(lesson.id)
                                  }
                                }}
                              >
                                {locked ? 'Locked' : 'START +10 XP'}
                              </button>
                            </div>
                            <div className="popover-arrow"></div>
                          </div>
                        )}
                        <button
                          id={`lesson-${lesson.id}`}
                          className={`lesson-node ${done ? 'done' : ''} ${current ? 'current' : ''} ${locked ? 'locked' : ''}`}
                          type="button"
                          onClick={() => {
                            if (selectedLessonId === lesson.id) {
                              if (locked) {
                                setSelectedLessonId(null)
                              } else {
                                startLesson(lesson.id)
                              }
                            } else {
                              setSelectedLessonId(lesson.id)
                            }
                          }}
                        >
                          <Star size={34} fill="currentColor" opacity={locked ? 0.3 : 1} strokeWidth={locked ? 0 : 2} />
                        </button>
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
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span key={i} className={`heart ${i >= lives ? 'lost' : ''}`}>
                <Heart size={18} fill="currentColor" />
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
                    height: '100%',
                    minHeight: '120px'
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

          {currentQuestion.type === 'match_pairs' ? (
            <div className="match-wrapper">
              <div className="match-column">
                {matchLeftList.map((item) => {
                  const isCompleted = matchCompleted.includes(item.id)
                  const isSelected = matchSelectedLeft === item.id
                  const isError = matchErrorLeft === item.id
                  return (
                    <button
                      key={`left-${item.id}`}
                      className={`match-btn ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''} ${isError ? 'error-shake' : ''}`}
                      type="button"
                      disabled={isCompleted}
                      onClick={() => handleMatchClick('left', item.id)}
                    >
                      {item.text}
                    </button>
                  )
                })}
              </div>
              <div className="match-column">
                {matchRightList.map((item) => {
                  const isCompleted = matchCompleted.includes(item.id)
                  const isSelected = matchSelectedRight === item.id
                  const isError = matchErrorRight === item.id
                  return (
                    <button
                      key={`right-${item.id}`}
                      className={`match-btn ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''} ${isError ? 'error-shake' : ''}`}
                      type="button"
                      disabled={isCompleted}
                      onClick={() => handleMatchClick('right', item.id)}
                    >
                      {item.text}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {currentQuestion.type === 'arrange_blocks' ? (
            <div className="arrange-wrapper">
              <div className="arrange-column">
                <div className="arrange-label">Available Blocks</div>
                <div
                  className="arrange-zone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleArrangeDrop('pool')}
                >
                  {arrangePool.length > 0 ? (
                    arrangePool.map((line) => (
                      <div
                        key={line.id}
                        className="arrange-block"
                        draggable
                        onDragStart={handleArrangeDragStart('pool', line)}
                        onClick={() => moveArrangeToAnswer(line)}
                      >
                        {line.text}
                      </div>
                    ))
                  ) : (
                    <div className="arrange-empty">Drop blocks here to remove them from your answer.</div>
                  )}
                </div>
              </div>

              <div className="arrange-column">
                <div className="arrange-label">Your Order</div>
                <div
                  className="arrange-zone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleArrangeDrop('answer')}
                >
                  {arrangeAnswer.length > 0 ? (
                    arrangeAnswer.map((line, index) => (
                      <div
                        key={line.id}
                        className="arrange-answer-row"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleArrangeDrop('answer', index)}
                      >
                        <div
                          className="arrange-block arrange-block-answer"
                          draggable
                          onDragStart={handleArrangeDragStart('answer', line)}
                          onClick={() => moveArrangeToPool(line)}
                        >
                          {line.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="arrange-empty">Drag blocks here to build your answer.</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <div className="lesson-footer">
          <div className="lesson-footer-content">
            {currentQuestion.type === 'code_challenge' ? (
              <div className="code-actions">
                {!feedbackCorrect ? (
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={checkLesson}
                    disabled={!pyodideReady || codeChecking}
                  >
                    {codeChecking ? 'Running...' : 'Check'}
                  </button>
                ) : (
                  <button className="primary-btn secondary-btn" type="button" onClick={nextQuestion}>
                    Continue
                  </button>
                )}
              </div>
            ) : !lessonFeedback ? (
              <button
                className="primary-btn"
                type="button"
                onClick={checkLesson}
                disabled={
                  (currentQuestion.type === 'multiple_choice' && !lessonChoice) ||
                  (currentQuestion.type === 'fill_blank' && !blankAnswer.trim()) ||
                  (currentQuestion.type === 'arrange_blocks' &&
                    arrangeAnswer.length !== (currentQuestion.arrangeCorrectOrder?.length ?? 0)) ||
                  (currentQuestion.type === 'match_pairs' &&
                    matchCompleted.length !== (currentQuestion.matchingPairs?.length ?? 0))
                }
              >
                Check
              </button>
            ) : (
              <button className="primary-btn" type="button" onClick={nextQuestion}>
                Continue
              </button>
            )}
          </div>
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
  onLogout?: () => void
}

function TopBar({ stats, onClose, onLogout }: TopBarProps) {
  const mascot = STRINGS[(stats.streak + stats.gems) % STRINGS.length]

  return (
    <header className={`top-bar ${onLogout ? 'home' : ''}`}>
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
            <span>Codestar</span>
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

      {onLogout ? (
        <button className="logout-btn" type="button" onClick={onLogout} aria-label="Log out">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      ) : null}
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
