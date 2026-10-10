import { normalizeSingleSkill } from "./skillNormalizationTool.js";

export interface MatchingEngineInput {
  candidateExp: number;
  minExp: number;
  maxExp?: number | null;
  candidateSkills: string[];
  requiredSkills: string[];
  candidateLocation: string;
  jobLocation: string;
}

export interface MatchingEngineOutput {
  experienceMatchScore: number;
  skillMatchScore: number;
  locationMatchScore: number;
  overlapCount: number;
  requiredSkillsCount: number;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * Deterministic matching engine tool.
 * Implements strict, verifiable rule matching outside the LLM.
 */
export function calculateMatches(
  input: MatchingEngineInput
): MatchingEngineOutput {
  const {
    candidateExp,
    minExp,
    maxExp,
    candidateSkills = [],
    requiredSkills = [],
    candidateLocation = "",
    jobLocation = "",
  } = input;

  // 1. Experience Logic
  let experienceMatchScore = 0;
  if (candidateExp < minExp) {
    experienceMatchScore = 0;
  } else if (maxExp !== null && maxExp !== undefined && candidateExp > maxExp) {
    experienceMatchScore = 0.8;
  } else {
    // Within range [min, max] (or no max specified and candidateExp >= min)
    experienceMatchScore = 1;
  }

  // 2. Skill Match Logic
  const normalizedCandidateSkills = new Set(
    candidateSkills.map((s) => normalizeSingleSkill(s))
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of requiredSkills) {
    const normReq = normalizeSingleSkill(reqSkill);
    if (normalizedCandidateSkills.has(normReq)) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  let skillMatchScore = 1.0;
  if (requiredSkills.length > 0) {
    skillMatchScore = parseFloat(
      (matchedSkills.length / requiredSkills.length).toFixed(4)
    );
  }

  // 3. Location Match Logic
  let locationMatchScore = 0.5;
  const isJobRemote = /remote/i.test(jobLocation);
  const isCandidateRemote = /remote/i.test(candidateLocation);

  if (isJobRemote || isCandidateRemote) {
    locationMatchScore = 1;
  } else if (
    candidateLocation &&
    jobLocation &&
    (candidateLocation.toLowerCase().includes(jobLocation.toLowerCase()) ||
      jobLocation.toLowerCase().includes(candidateLocation.toLowerCase()))
  ) {
    locationMatchScore = 1;
  } else {
    // Onsite mismatch
    locationMatchScore = 0.5;
  }

  return {
    experienceMatchScore,
    skillMatchScore,
    locationMatchScore,
    overlapCount: matchedSkills.length,
    requiredSkillsCount: requiredSkills.length,
    matchedSkills,
    missingSkills,
  };
}
