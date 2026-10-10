export interface ParsedResume {
  experienceYears: number;
  skills: string[];
  normalizedSkills: string[];
  location: string;
  education: string[];
  keywords: string[];
}

export interface FeatureVector {
  experienceYears: number;
  skills: string[];
  location: string;
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
}

export interface ScoringResult {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  finalScore: number;
}

export interface AgentRecommendationOutput {
  recommended: boolean;
  score: number;
  confidence: number;
  reason: string;
}

export interface AgentReasoningStep {
  step: number;
  tool: string;
  input: any;
  output: any;
  thought?: string;
  timestamp: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AgentExecutionResult {
  output: AgentRecommendationOutput;
  reasoningSteps: AgentReasoningStep[];
  tokenUsage: TokenUsage;
  latencyMs: number;
  parsingTimeMs: number;
  matchingTimeMs: number;
  parsedResume: ParsedResume;
  scoringResult: ScoringResult;
}

export interface JobOpeningContext {
  id: string;
  title: string;
  description: string;
  location: string;
  experienceMin: number;
  experienceMax?: number | null;
  requiredSkills: string[];
  contractType?: string | null;
}
