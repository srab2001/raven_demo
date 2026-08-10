import { create } from 'zustand'

export type StepKey = 'discharge' | 'serviceDates' | 'housing' | 'separation' | 'result'

export type WizardForm = {
  dischargeStatus: 'Honorable' | 'General' | 'Other'
  startDate: string
  endDate: string
  housingStatus: 'Stable' | 'At risk' | 'Homeless'
  separationDate: string
  email: string
}

export const STEP_ORDER: StepKey[] = ['discharge', 'serviceDates', 'housing', 'separation', 'result']

export const STEPS: Array<{ key: StepKey; title: string }> = [
  { key: 'discharge', title: 'Discharge status' },
  { key: 'serviceDates', title: 'Service dates' },
  { key: 'housing', title: 'Housing situation' },
  { key: 'separation', title: 'Separation date' },
  { key: 'result', title: 'Result' },
]

const defaultForm: WizardForm = {
  dischargeStatus: 'Honorable',
  startDate: '2010-01-01',
  endDate: '2021-03-15',
  housingStatus: 'At risk',
  separationDate: '2021-03-15',
  email: 'veteran@example.com',
}

// Client-side storage has no secret to sign with, so this is a namespaced
// key rather than a cryptographically signed one. A real deployment would
// mint the resume token server-side.
const STORAGE_KEY = 'demo2.wizard.v1'

type Persisted = { step: StepKey; form: WizardForm; resumeSent: boolean }

function loadPersisted(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : null
  } catch {
    return null
  }
}

function persist(state: Persisted) {
  const raw = JSON.stringify(state)
  sessionStorage.setItem(STORAGE_KEY, raw)
  localStorage.setItem(STORAGE_KEY, raw)
}

type WizardStore = {
  step: StepKey
  form: WizardForm
  resumeSent: boolean
  setStep: (step: StepKey) => void
  setForm: (partial: Partial<WizardForm>) => void
  setResumeSent: (value: boolean) => void
  next: () => void
  back: () => void
}

const restored = loadPersisted()

export const useWizardStore = create<WizardStore>((set, get) => ({
  step: restored?.step ?? 'discharge',
  form: restored?.form ?? defaultForm,
  resumeSent: restored?.resumeSent ?? false,
  setStep: (step) => {
    set({ step })
    persist({ step, form: get().form, resumeSent: get().resumeSent })
  },
  setForm: (partial) => {
    const form = { ...get().form, ...partial }
    set({ form })
    persist({ step: get().step, form, resumeSent: get().resumeSent })
  },
  setResumeSent: (value) => {
    set({ resumeSent: value })
    persist({ step: get().step, form: get().form, resumeSent: value })
  },
  next: () => {
    const index = STEP_ORDER.indexOf(get().step)
    const step = STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)]
    get().setStep(step)
  },
  back: () => {
    const index = STEP_ORDER.indexOf(get().step)
    const step = STEP_ORDER[Math.max(index - 1, 0)]
    get().setStep(step)
  },
}))
