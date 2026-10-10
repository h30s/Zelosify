import { describe, it, expect } from "vitest";
import { calculateMatches } from "../../../src/services/ai/tools/matchingEngineTool.js";
import { calculateFinalScore } from "../../../src/services/ai/tools/scoringEngineTool.js";
import { normalizeSingleSkill } from "../../../src/services/ai/tools/skillNormalizationTool.js";
import { evaluateDecisionPolicy } from "../../../src/services/ai/decisionPolicy.js";

describe("Deterministic Matching Engine & Scoring Tests", () => {
  describe("Experience Boundary Tests", () => {
    it("should return 0 when candidate experience is strictly below minimum", () => {
      const result = calculateMatches({
        candidateExp: 2,
        minExp: 5,
        maxExp: 8,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(0);
    });

    it("should return 1 when candidate experience equals minimum experience", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 5,
        maxExp: 8,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(1);
    });

    it("should return 1 when candidate experience is within [min, max] range", () => {
      const result = calculateMatches({
        candidateExp: 6.5,
        minExp: 5,
        maxExp: 8,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(1);
    });

    it("should return 1 when candidate experience equals maximum experience", () => {
      const result = calculateMatches({
        candidateExp: 8,
        minExp: 5,
        maxExp: 8,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(1);
    });

    it("should return 0.8 when candidate experience is above maximum experience", () => {
      const result = calculateMatches({
        candidateExp: 10,
        minExp: 5,
        maxExp: 8,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(0.8);
    });

    it("should return 1 when no maxExp is set and candidate experience >= minExp", () => {
      const result = calculateMatches({
        candidateExp: 12,
        minExp: 5,
        maxExp: null,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(1);
    });
  });

  describe("Skill Overlap Accuracy & Normalization Tests", () => {
    it("should calculate exact 1.0 when all required skills match", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["TypeScript", "Node.js", "React"],
        requiredSkills: ["TypeScript", "Node.js", "React"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(1.0);
      expect(result.overlapCount).toBe(3);
    });

    it("should calculate exact 0.5 when 2 out of 4 skills match", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["TypeScript", "Node.js"],
        requiredSkills: ["TypeScript", "Node.js", "AWS", "Docker"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(0.5);
      expect(result.overlapCount).toBe(2);
    });

    it("should calculate exact 0.0 when no skills match", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["PHP", "Ruby"],
        requiredSkills: ["Go", "Kubernetes"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(0);
      expect(result.overlapCount).toBe(0);
    });

    it("should normalize skill variations and aliases accurately", () => {
      expect(normalizeSingleSkill("React.js")).toBe("react");
      expect(normalizeSingleSkill("reactjs")).toBe("react");
      expect(normalizeSingleSkill("Node.js")).toBe("nodejs");
      expect(normalizeSingleSkill("k8s")).toBe("kubernetes");
      expect(normalizeSingleSkill("Amazon Web Services")).toBe("aws");
      expect(normalizeSingleSkill("TS")).toBe("typescript");
      expect(normalizeSingleSkill("Python 3")).toBe("python");

      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["reactjs", "node.js", "k8s", "aws"],
        requiredSkills: ["React", "Node.js", "Kubernetes", "AWS"],
        candidateLocation: "Remote",
        jobLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(1.0);
    });
  });

  describe("Location Logic Tests", () => {
    it("should return 1 when job location is Remote", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Metropolis",
        jobLocation: "Remote",
      });
      expect(result.locationMatchScore).toBe(1);
    });

    it("should return 1 when candidate location is Remote", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Remote",
        jobLocation: "Gotham City",
      });
      expect(result.locationMatchScore).toBe(1);
    });

    it("should return 1 when candidate location matches job location exactly", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "Gotham City",
        jobLocation: "Gotham City",
      });
      expect(result.locationMatchScore).toBe(1);
    });

    it("should return 0.5 when there is an onsite location mismatch", () => {
      const result = calculateMatches({
        candidateExp: 5,
        minExp: 3,
        candidateSkills: ["Node.js"],
        requiredSkills: ["Node.js"],
        candidateLocation: "New York, NY",
        jobLocation: "Gotham City",
      });
      expect(result.locationMatchScore).toBe(0.5);
    });
  });

  describe("Score Formula & Threshold Tests", () => {
    it("should calculate exact FinalScore according to (0.5 * skill) + (0.3 * exp) + (0.2 * loc)", () => {
      const scoring = calculateFinalScore({
        skillMatchScore: 0.8,
        experienceMatchScore: 1.0,
        locationMatchScore: 1.0,
      });

      // 0.5 * 0.8 = 0.40
      // 0.3 * 1.0 = 0.30
      // 0.2 * 1.0 = 0.20
      // 0.40 + 0.30 + 0.20 = 0.90
      expect(scoring.finalScore).toBe(0.9);
      expect(scoring.skillMatchScore).toBe(0.8);
      expect(scoring.experienceMatchScore).toBe(1.0);
      expect(scoring.locationMatchScore).toBe(1.0);

      const decision = evaluateDecisionPolicy(scoring.finalScore);
      expect(decision.decision).toBe("RECOMMENDED");
      expect(decision.recommended).toBe(true);
    });

    it("should categorize scores >= 0.75 as RECOMMENDED", () => {
      const res1 = evaluateDecisionPolicy(0.75);
      expect(res1.decision).toBe("RECOMMENDED");
      expect(res1.recommended).toBe(true);

      const res2 = evaluateDecisionPolicy(0.82);
      expect(res2.decision).toBe("RECOMMENDED");
      expect(res2.recommended).toBe(true);
    });

    it("should categorize scores between 0.50 and 0.74 as BORDERLINE", () => {
      const res1 = evaluateDecisionPolicy(0.5);
      expect(res1.decision).toBe("BORDERLINE");
      expect(res1.recommended).toBe(false);

      const res2 = evaluateDecisionPolicy(0.74);
      expect(res2.decision).toBe("BORDERLINE");
      expect(res2.recommended).toBe(false);
    });

    it("should categorize scores < 0.50 as NOT_RECOMMENDED", () => {
      const res = evaluateDecisionPolicy(0.48);
      expect(res.decision).toBe("NOT_RECOMMENDED");
      expect(res.recommended).toBe(false);
    });
  });
});
