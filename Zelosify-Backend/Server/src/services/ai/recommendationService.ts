import prisma from "../../config/prisma/prisma.js";
import { AgentOrchestrator } from "./agentOrchestrator.js";
import { Prisma } from "@prisma/client";
import { JobOpeningContext } from "./types.js";

/**
 * Extracts required skills list from opening title and description.
 */
function extractSkillsFromOpening(title: string, description?: string | null): string[] {
  const combined = `${title} ${description || ""}`;
  const COMMON_SKILLS = [
    "TypeScript",
    "JavaScript",
    "Node.js",
    "React",
    "Next.js",
    "Python",
    "Go",
    "AWS",
    "Docker",
    "Kubernetes",
    "Terraform",
    "PostgreSQL",
    "Redis",
    "MongoDB",
    "Kafka",
    "GraphQL",
    "REST API",
    "SQL",
    "Tailwind CSS",
    "Linux",
    "CI/CD",
    "Playwright",
    "Cypress",
    "Jest",
    "PyTorch",
    "Spark",
    "Snowflake",
    "Airflow",
    "Prometheus",
    "Grafana",
    "React Native",
  ];

  const matched = COMMON_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(combined);
  });

  return matched.length > 0 ? matched : ["TypeScript", "Node.js", "React"];
}

/**
 * Recommendation Service orchestrates evaluation and atomic persistence.
 */
export class RecommendationService {
  private orchestrator: AgentOrchestrator;

  constructor() {
    this.orchestrator = new AgentOrchestrator();
  }

  /**
   * Process a profile through the AI Recommendation Agent and persist atomically.
   */
  public async processRecommendation(
    profileId: number,
    tenantId: string,
    fileBuffer?: Buffer
  ): Promise<any> {
    const startTimestamp = new Date().toISOString();
    const startTime = Date.now();

    try {
      // 1. Fetch profile and opening details
      const profile = await prisma.hiringProfile.findFirst({
        where: { id: profileId, opening: { tenantId } },
        include: { opening: true },
      });

      if (!profile || profile.isDeleted) {
        throw new Error(`Profile ${profileId} not found or deleted`);
      }

      const opening = profile.opening;
      const requiredSkills = extractSkillsFromOpening(
        opening.title,
        opening.description
      );

      const openingContext: JobOpeningContext = {
        id: opening.id,
        title: opening.title,
        description: opening.description || "",
        location: opening.location || "Remote",
        experienceMin: opening.experienceMin,
        experienceMax: opening.experienceMax,
        requiredSkills,
        contractType: opening.contractType,
      };

      // 2. Execute Agent Orchestrator
      const agentResult = await this.orchestrator.evaluateProfile(
        profile.s3Key,
        openingContext,
        fileBuffer
      );

      const metadata: Prisma.InputJsonValue = {
        tokenUsage: {
          promptTokens: agentResult.tokenUsage.promptTokens,
          completionTokens: agentResult.tokenUsage.completionTokens,
          totalTokens: agentResult.tokenUsage.totalTokens,
        },
        parsingTimeMs: agentResult.parsingTimeMs,
        matchingTimeMs: agentResult.matchingTimeMs,
        scoring: {
          skillMatchScore: agentResult.scoringResult.skillMatchScore,
          experienceMatchScore: agentResult.scoringResult.experienceMatchScore,
          locationMatchScore: agentResult.scoringResult.locationMatchScore,
          finalScore: agentResult.scoringResult.finalScore,
        },
        tools: agentResult.reasoningSteps.map((step) => ({
          step: step.step,
          tool: step.tool,
          timestamp: step.timestamp,
        })),
      };

      // 3. Atomically update in Prisma transaction (ACID compliant)
      const updatedProfile = await prisma.$transaction(async (tx) => {
        return tx.hiringProfile.update({
          where: { id: profileId, opening: { tenantId } },
          data: {
            recommended: agentResult.output.recommended,
            recommendationScore: agentResult.output.score,
            recommendationReason: agentResult.output.reason,
            recommendationConfidence: agentResult.output.confidence,
            recommendationLatencyMs: agentResult.latencyMs,
            recommendationVersion: "v1.1.0",
            recommendationMetadata: metadata,
            recommendedAt: new Date(),
          },
        });
      });

      // 4. Structured JSON Observability Log
      console.log(
        JSON.stringify({
          event: "AI_RECOMMENDATION_SUCCESS",
          profileId,
          openingId: opening.id,
          tenantId: opening.tenantId,
          startTime: startTimestamp,
          parsingTimeMs: agentResult.parsingTimeMs,
          matchingTimeMs: agentResult.matchingTimeMs,
          latencyMs: agentResult.latencyMs,
          finalScore: agentResult.output.score,
          decision: agentResult.output.recommended
            ? "RECOMMENDED"
            : agentResult.output.score >= 0.5
            ? "BORDERLINE"
            : "NOT_RECOMMENDED",
          confidence: agentResult.output.confidence,
          tokenUsage: agentResult.tokenUsage,
          version: "v1.1.0",
          errors: null,
        })
      );

      return updatedProfile;
    } catch (error: any) {
      console.error(
        JSON.stringify({
          event: "AI_RECOMMENDATION_ERROR",
          profileId,
          startTime: startTimestamp,
          latencyMs: Date.now() - startTime,
          finalScore: null,
          errors: error.message,
        })
      );
      throw error;
    }
  }
}

export const recommendationService = new RecommendationService();
