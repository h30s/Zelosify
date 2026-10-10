import { parseResumeTool } from "./tools/resumeParsingTool.js";
import { normalizeSkills } from "./tools/skillNormalizationTool.js";
import { extractFeatureVector } from "./tools/featureExtractionTool.js";
import { calculateMatches } from "./tools/matchingEngineTool.js";
import { calculateFinalScore } from "./tools/scoringEngineTool.js";
import { validateToolOutput } from "./validator.js";

export type ToolName =
  | "resume_parsing_tool"
  | "skill_normalization_tool"
  | "feature_extraction_tool"
  | "deterministic_matching_engine"
  | "scoring_engine";

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

export const REQUIRED_TOOL_ORDER: ToolName[] = [
  "resume_parsing_tool",
  "skill_normalization_tool",
  "feature_extraction_tool",
  "deterministic_matching_engine",
  "scoring_engine",
];

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "resume_parsing_tool",
    description: "Extract structured candidate data from an untrusted PDF or PPTX resume in storage.",
    parameters: {
      type: "object",
      properties: { s3Key: { type: "string" } },
      required: ["s3Key"],
    },
  },
  {
    name: "skill_normalization_tool",
    description: "Normalize candidate skills to canonical identifiers.",
    parameters: {
      type: "object",
      properties: { skills: { type: "array", items: { type: "string" } } },
      required: ["skills"],
    },
  },
  {
    name: "feature_extraction_tool",
    description: "Build the candidate-to-opening feature vector.",
    parameters: {
      type: "object",
      properties: { resume: { type: "object" }, opening: { type: "object" } },
      required: ["resume", "opening"],
    },
  },
  {
    name: "deterministic_matching_engine",
    description: "Evaluate candidate experience, skill overlap, and location using deterministic rules.",
    parameters: {
      type: "object",
      properties: {
        candidateExp: { type: "number" },
        minExp: { type: "number" },
        maxExp: { type: ["number", "null"] },
        candidateSkills: { type: "array", items: { type: "string" } },
        requiredSkills: { type: "array", items: { type: "string" } },
        candidateLocation: { type: "string" },
        jobLocation: { type: "string" },
      },
      required: [
        "candidateExp",
        "minExp",
        "candidateSkills",
        "requiredSkills",
        "candidateLocation",
        "jobLocation",
      ],
    },
  },
  {
    name: "scoring_engine",
    description: "Calculate 0.5*skill + 0.3*experience + 0.2*location.",
    parameters: {
      type: "object",
      properties: {
        skillMatchScore: { type: "number" },
        experienceMatchScore: { type: "number" },
        locationMatchScore: { type: "number" },
      },
      required: ["skillMatchScore", "experienceMatchScore", "locationMatchScore"],
    },
  },
];

export async function executeTool(
  name: ToolName,
  args: any,
  context: { fileBuffer?: Buffer } = {}
): Promise<any> {
  let output: unknown;

  switch (name) {
    case "resume_parsing_tool":
      output = await parseResumeTool({ ...args, fileBuffer: context.fileBuffer });
      break;
    case "skill_normalization_tool":
      output = normalizeSkills(args.skills);
      break;
    case "feature_extraction_tool":
      output = extractFeatureVector(args);
      break;
    case "deterministic_matching_engine":
      output = calculateMatches(args);
      break;
    case "scoring_engine":
      output = calculateFinalScore(args);
      break;
  }

  const validation = validateToolOutput(name, output);
  if (!validation.isValid) {
    throw new Error(`${name} output validation failed: ${validation.errors?.join(", ")}`);
  }
  return output;
}
