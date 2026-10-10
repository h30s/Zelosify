import { ScoringResult } from "../types.js";

export interface ScoringEngineInput {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
}

/**
 * Deterministic Scoring Engine Tool.
 * Calculates candidate final score using the mandatory formula:
 * FinalScore = (0.5 * skillMatchScore) + (0.3 * experienceMatchScore) + (0.2 * locationMatchScore)
 */
export function calculateFinalScore(input: ScoringEngineInput): ScoringResult {
  const skill = Math.max(0, Math.min(1, Number(input.skillMatchScore) || 0));
  const exp = Math.max(0, Math.min(1, Number(input.experienceMatchScore) || 0));
  const loc = Math.max(0, Math.min(1, Number(input.locationMatchScore) || 0));

  const rawScore = 0.5 * skill + 0.3 * exp + 0.2 * loc;
  const finalScore = parseFloat(rawScore.toFixed(4));

  return {
    skillMatchScore: parseFloat(skill.toFixed(4)),
    experienceMatchScore: parseFloat(exp.toFixed(4)),
    locationMatchScore: parseFloat(loc.toFixed(4)),
    finalScore,
  };
}
