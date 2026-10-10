import { describe, it, expect } from "vitest";
import { AgentOrchestrator } from "../../src/services/ai/agentOrchestrator.js";
import { JobOpeningContext } from "../../src/services/ai/types.js";

describe("AI Recommendation Agent Performance SLA Tests", () => {
  const orchestrator = new AgentOrchestrator();

  const opening: JobOpeningContext = {
    id: "perf-op-001",
    title: "Senior Full Stack TypeScript Engineer",
    description: "Required skills: TypeScript, Node.js, React, Docker, AWS, PostgreSQL.",
    location: "Remote",
    experienceMin: 5,
    experienceMax: 8,
    requiredSkills: ["TypeScript", "Node.js", "React", "Docker", "AWS"],
    contractType: "C2C",
  };

  it("should evaluate 100 candidate profiles with P95 latency < 2000ms and max < 1500ms", async () => {
    const latencies: number[] = [];
    const sampleProfiles = [
      {
        skills: "TypeScript, Node.js, React, Docker, AWS",
        exp: 6,
        loc: "Remote",
      },
      {
        skills: "Python, PyTorch, LangChain, Docker",
        exp: 4,
        loc: "New York, NY",
      },
      {
        skills: "React, Next.js, Tailwind CSS, TypeScript",
        exp: 5,
        loc: "Gotham City",
      },
      {
        skills: "Go, Kubernetes, Docker, Linux, CI/CD",
        exp: 8,
        loc: "Remote",
      },
      {
        skills: "Java, Spring Boot, MySQL",
        exp: 2,
        loc: "Metropolis",
      },
    ];

    const PROFILE_COUNT = 100;

    for (let i = 0; i < PROFILE_COUNT; i++) {
      const template = sampleProfiles[i % sampleProfiles.length];
      const resumeText = `
        Candidate Name: Test Profile ${i}
        Total Experience: ${template.exp} years
        Technical Skills: ${template.skills}
        Location: ${template.loc}
        Education: B.S. in Computer Science
      `;
      const buffer = Buffer.from(resumeText, "utf8");

      const startTime = Date.now();
      const result = await orchestrator.evaluateProfile(
        `tenant-bruce-wayne/perf-op-001/resume_${i}.pdf`,
        opening,
        buffer
      );
      const elapsed = Date.now() - startTime;
      latencies.push(elapsed);

      // Verify that internal measured latency conforms to constraints
      expect(result.latencyMs).toBeLessThan(1500);
      expect(result.output.score).toBeGreaterThanOrEqual(0);
      expect(result.output.score).toBeLessThanOrEqual(1);
    }

    // Sort latencies to compute percentiles
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(PROFILE_COUNT * 0.5)];
    const p95Index = Math.floor(PROFILE_COUNT * 0.95);
    const p95 = latencies[p95Index];
    const maxLatency = latencies[latencies.length - 1];
    const avg = latencies.reduce((sum, val) => sum + val, 0) / PROFILE_COUNT;

    console.log(`\n================ Performance Benchmark Results ================`);
    console.log(`Evaluated: ${PROFILE_COUNT} profiles`);
    console.log(`Average Latency: ${avg.toFixed(2)} ms`);
    console.log(`P50 Latency:     ${p50} ms`);
    console.log(`P95 Latency:     ${p95} ms`);
    console.log(`Max Latency:     ${maxLatency} ms`);
    console.log(`================================================================\n`);

    // Verify SLA constraints
    expect(p95).toBeLessThan(2000); // SLA: P95 < 2000ms
    expect(maxLatency).toBeLessThan(2000); // Strict non-blocking SLA
  }, 60000); // 60s timeout for 100 iterations
});
