import { PROGRAM_ALLOWLIST, type Program, type RuleFire } from './rulesEngine'
import { POLICY_CHUNKS } from './policyIndex'

export type AiResult = {
  recommendation: Program
  confidence: number
  citations: string[]
  matchesRules: boolean
}

// No LLM API key is provisioned for this static demo deployment, so this is
// a documented stand-in for the constrained-LLM call described in the build
// brief. It is intentionally NOT an independent decision path: per the
// brief's own trust boundary ("AI never decides eligibility — it explains
// the decision. All routing goes through the rules engine"), the AI mode
// here explains and cites the same rules-engine output rather than
// re-deriving it from a model call. Swapping in a real constrained LLM call
// (retrieval over policyIndex + a strict system prompt) is a drop-in
// replacement for `explainWithAi` as long as it keeps the same contract:
// reject any recommendation outside PROGRAM_ALLOWLIST, reject any response
// with zero citations.
export function explainWithAi(fires: RuleFire[]): AiResult {
  if (fires.length === 0) {
    return { recommendation: 'VA Health Care Priority Group', confidence: 0.5, citations: [POLICY_CHUNKS['38 CFR § 17.36'] ? '38 CFR § 17.36' : ''], matchesRules: true }
  }

  const top = fires[0]
  if (!PROGRAM_ALLOWLIST.includes(top.program)) {
    throw new Error('AI mode rejected: recommendation outside the allowlist')
  }

  const citations = fires.map((fire) => fire.citation)
  if (citations.length === 0) {
    throw new Error('AI mode rejected: response has zero citations')
  }

  return { recommendation: top.program, confidence: 0.93, citations, matchesRules: true }
}

/** Demonstrates the divergence banner: a canned AI response that disagrees with the rules engine. */
export function forceDivergenceDemo(fires: RuleFire[]): AiResult {
  const rulesPick = fires[0]?.program
  const alternate = PROGRAM_ALLOWLIST.find((program) => program !== rulesPick) ?? PROGRAM_ALLOWLIST[0]
  return { recommendation: alternate, confidence: 0.61, citations: fires.length ? [fires[0].citation] : ['38 CFR § 17.36'], matchesRules: false }
}
