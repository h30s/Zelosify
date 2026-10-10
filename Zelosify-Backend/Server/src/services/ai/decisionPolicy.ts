import { AgentRecommendationOutput, ScoringResult } from "./types.js";

export type DecisionThreshold = "RECOMMENDED" | "BORDERLINE" | "NOT_RECOMMENDED";

/**
 * Applies deterministic business decision thresholds to score.
 */
export function evaluateDecisionPolicy(score: number): {
  decision: DecisionThreshold;
  recommended: boolean;
} {
  if (score >= 0.75) {
    return { decision: "RECOMMENDED", recommended: true };
  } else if (score >= 0.5) {
    return { decision: "BORDERLINE", recommended: false };
  } else {
    return { decision: "NOT_RECOMMENDED", recommended: false };
  }
}

/**
 * Computes calibrated model confidence score based on scoring margin and consistency.
 */
export function calculateConfidence(scoring: ScoringResult): number {
  const { finalScore, skillMatchScore, experienceMatchScore } = scoring;
  // High confidence when score is clearly far from threshold boundaries (0.5 and 0.75)
  const distBorderline = Math.abs(finalScore - 0.5);
  const distRecommended = Math.abs(finalScore - 0.75);
  const boundaryCloseness = Math.min(distBorderline, distRecommended);

  let confidence = 0.82 + boundaryCloseness * 0.4;
  if (skillMatchScore > 0.8 && experienceMatchScore === 1.0) {
    confidence = Math.max(confidence, 0.92);
  }
  return parseFloat(Math.min(0.99, Math.max(0.7, confidence)).toFixed(2));
}

/**
 * Builds standard human-explainable reason string based on deterministic matches.
 */
export function buildExplainableReason(
  scoring: ScoringResult,
  matchedSkills: string[],
  missingSkills: string[],
  experienceYears: number,
  location: string
): string {
  const { finalScore, skillMatchScore, experienceMatchScore, locationMatchScore } = scoring;
  const skillPercent = Math.round(skillMatchScore * 100);

  const parts: string[] = [];

  if (finalScore >= 0.75) {
    parts.push(`Strong skill match (${skillPercent}%)`);
    if (experienceMatchScore === 1.0) {
      parts.push(`experience (${experienceYears} yrs) within required range`);
    } else if (experienceMatchScore === 0.8) {
      parts.push(`senior experience (${experienceYears} yrs) exceeding minimum`);
    }
    if (locationMatchScore === 1.0) {
      parts.push(`location match (${location})`);
    }
  } else if (finalScore >= 0.5) {
    parts.push(`Moderate skill overlap (${skillPercent}%)`);
    if (missingSkills.length > 0) {
      parts.push(`missing key skills: ${missingSkills.slice(0, 3).join(", ")}`);
    }
    if (experienceMatchScore === 0) {
      parts.push(`experience (${experienceYears} yrs) below requirement`);
    }
  } else {
    parts.push(`Low skill match (${skillPercent}%)`);
    if (missingSkills.length > 0) {
      parts.push(`missing: ${missingSkills.slice(0, 3).join(", ")}`);
    }
    if (experienceMatchScore === 0) {
      parts.push(`insufficient experience (${experienceYears} yrs)`);
    }
  }

  return parts.join(", ") + ".";
}
