import Ajv, { JSONSchemaType } from "ajv";
import {
  AgentRecommendationOutput,
  FeatureVector,
  ParsedResume,
  ScoringResult,
} from "./types.js";
import { MatchingEngineOutput } from "./tools/matchingEngineTool.js";

type SkillNormalizationOutput = {
  normalizedSkills: string[];
  rawSkills: string[];
};

const ajv = new Ajv({ allErrors: true });
const stringArray = { type: "array", items: { type: "string" } } as const;

const parsedResumeSchema: JSONSchemaType<ParsedResume> = {
  type: "object",
  additionalProperties: false,
  properties: {
    experienceYears: { type: "number", minimum: 0, maximum: 80 },
    skills: stringArray,
    normalizedSkills: stringArray,
    location: { type: "string", minLength: 1 },
    education: stringArray,
    keywords: stringArray,
  },
  required: [
    "experienceYears",
    "skills",
    "normalizedSkills",
    "location",
    "education",
    "keywords",
  ],
};

const skillNormalizationSchema: JSONSchemaType<SkillNormalizationOutput> = {
  type: "object",
  additionalProperties: false,
  properties: {
    normalizedSkills: stringArray,
    rawSkills: stringArray,
  },
  required: ["normalizedSkills", "rawSkills"],
};

const featureVectorSchema: JSONSchemaType<FeatureVector> = {
  type: "object",
  additionalProperties: false,
  properties: {
    experienceYears: { type: "number", minimum: 0, maximum: 80 },
    skills: stringArray,
    location: { type: "string", minLength: 1 },
    skillMatchScore: { type: "number", minimum: 0, maximum: 1 },
    experienceMatchScore: { type: "number", minimum: 0, maximum: 1 },
    locationMatchScore: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "experienceYears",
    "skills",
    "location",
    "skillMatchScore",
    "experienceMatchScore",
    "locationMatchScore",
  ],
};

const matchingSchema: JSONSchemaType<MatchingEngineOutput> = {
  type: "object",
  additionalProperties: false,
  properties: {
    experienceMatchScore: { type: "number", minimum: 0, maximum: 1 },
    skillMatchScore: { type: "number", minimum: 0, maximum: 1 },
    locationMatchScore: { type: "number", minimum: 0, maximum: 1 },
    overlapCount: { type: "integer", minimum: 0 },
    requiredSkillsCount: { type: "integer", minimum: 0 },
    matchedSkills: stringArray,
    missingSkills: stringArray,
  },
  required: [
    "experienceMatchScore",
    "skillMatchScore",
    "locationMatchScore",
    "overlapCount",
    "requiredSkillsCount",
    "matchedSkills",
    "missingSkills",
  ],
};

const scoringSchema: JSONSchemaType<ScoringResult> = {
  type: "object",
  additionalProperties: false,
  properties: {
    skillMatchScore: { type: "number", minimum: 0, maximum: 1 },
    experienceMatchScore: { type: "number", minimum: 0, maximum: 1 },
    locationMatchScore: { type: "number", minimum: 0, maximum: 1 },
    finalScore: { type: "number", minimum: 0, maximum: 1 },
  },
  required: [
    "skillMatchScore",
    "experienceMatchScore",
    "locationMatchScore",
    "finalScore",
  ],
};

const agentSchema: JSONSchemaType<AgentRecommendationOutput> = {
  type: "object",
  additionalProperties: false,
  properties: {
    recommended: { type: "boolean" },
    score: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reason: { type: "string", minLength: 1, maxLength: 2000 },
  },
  required: ["recommended", "score", "confidence", "reason"],
};

const validators = {
  resume_parsing_tool: ajv.compile(parsedResumeSchema),
  skill_normalization_tool: ajv.compile(skillNormalizationSchema),
  feature_extraction_tool: ajv.compile(featureVectorSchema),
  deterministic_matching_engine: ajv.compile(matchingSchema),
  scoring_engine: ajv.compile(scoringSchema),
};

const validateAgent = ajv.compile(agentSchema);

function result<T>(valid: boolean, data: unknown, errors: unknown): {
  isValid: boolean;
  errors?: string[];
  output?: T;
} {
  return {
    isValid: valid,
    errors: valid ? undefined : [ajv.errorsText(errors as any)],
    output: valid ? (data as T) : undefined,
  };
}

export function validateAgentOutput(data: unknown) {
  const valid = validateAgent(data);
  return result<AgentRecommendationOutput>(Boolean(valid), data, validateAgent.errors);
}

export function validateToolOutput(name: keyof typeof validators, data: unknown) {
  const validate = validators[name];
  const valid = validate(data);
  return result(Boolean(valid), data, validate.errors);
}
