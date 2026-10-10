import { FeatureVector, ParsedResume, JobOpeningContext } from "../types.js";
import { calculateMatches } from "./matchingEngineTool.js";

/**
 * Feature Extraction Tool.
 * Assembles the standardized feature vector from candidate resume and opening context.
 */
export function extractFeatureVector(params: {
  resume: ParsedResume;
  opening: JobOpeningContext;
}): FeatureVector {
  const { resume, opening } = params;

  const matches = calculateMatches({
    candidateExp: resume.experienceYears,
    minExp: opening.experienceMin,
    maxExp: opening.experienceMax,
    candidateSkills: resume.skills,
    requiredSkills: opening.requiredSkills,
    candidateLocation: resume.location,
    jobLocation: opening.location,
  });

  return {
    experienceYears: resume.experienceYears,
    skills: resume.skills,
    location: resume.location,
    skillMatchScore: matches.skillMatchScore,
    experienceMatchScore: matches.experienceMatchScore,
    locationMatchScore: matches.locationMatchScore,
  };
}
