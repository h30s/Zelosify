import { ParsedResume } from "../types.js";
import { sanitizeResumeText } from "../promptInjection.js";
import { normalizeSkills } from "./skillNormalizationTool.js";
import { extractFileText, getStorageBuffer } from "./documentExtractor.js";

const COMMON_SKILLS = [
  "TypeScript", "JavaScript", "Node.js", "React", "Next.js", "Python",
  "Go", "Golang", "AWS", "Docker", "Kubernetes", "Terraform", "PostgreSQL",
  "Redis", "MongoDB", "Kafka", "GraphQL", "REST API", "SQL", "Tailwind CSS",
  "Linux", "CI/CD", "Git", "Playwright", "Cypress", "Jest", "PyTorch",
  "Spark", "Snowflake", "Airflow", "Prometheus", "Grafana", "React Native",
];

const LOCATIONS = [
  { name: "Gotham City", regex: /\bgotham(?:\s+city)?\b/i },
  { name: "New York, NY", regex: /\b(?:new\s+york|nyc)\b/i },
  { name: "San Francisco, CA", regex: /\b(?:san\s+francisco|sf|bay\s+area)\b/i },
  { name: "Metropolis", regex: /\bmetropolis\b/i },
  { name: "Austin, TX", regex: /\baustin\b/i },
  { name: "Seattle, WA", regex: /\bseattle\b/i },
  { name: "Remote", regex: /\bremote\b/i },
];

/**
 * Extracts structured candidate profile data from sanitized resume text.
 */
export function extractStructuredDataFromText(rawText: string): ParsedResume {
  const sanitized = sanitizeResumeText(rawText);

  // 1. Experience years
  let experienceYears = 0;
  const expMatch = sanitized.match(
    /(?:experience\s*:?\s*)?(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)(?:\s+of\s+(?:experience|exp))?/i
  );
  if (expMatch && expMatch[1]) {
    const parsed = parseFloat(expMatch[1]);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 40) {
      experienceYears = parsed;
    }
  }

  // Fallback: estimate from career year spans (e.g., 2018 - 2024)
  if (experienceYears === 0) {
    const years = Array.from(sanitized.matchAll(/\b(20\d{2}|19\d{2})\b/g))
      .map((m) => parseInt(m[1], 10))
      .filter((y) => y >= 1990 && y <= new Date().getFullYear());

    if (years.length >= 2) {
      const diff = Math.max(...years) - Math.min(...years);
      if (diff > 0) experienceYears = Math.min(diff, 20);
    }
  }
  // 2. Skills
  const extractedSkills: string[] = [];
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(sanitized)) {
      extractedSkills.push(skill);
    }
  }

  // 3. Location
  let location = "Unknown";
  for (const loc of LOCATIONS) {
    if (loc.regex.test(sanitized)) {
      location = loc.name;
      break;
    }
  }

  // 4. Education
  const education: string[] = [];
  const eduPatterns = [
    /(?:Bachelor|B\.S\.|B\.A\.|BTech|B\.E\.)(?:\s+in\s+[^,.\n]+)?/gi,
    /(?:Master|M\.S\.|M\.A\.|MTech|M\.B\.A\.)(?:\s+in\s+[^,.\n]+)?/gi,
  ];
  for (const pattern of eduPatterns) {
    const m = sanitized.match(pattern);
    if (m) education.push(...m.map((s) => s.trim()));
  }
  const { normalizedSkills } = normalizeSkills(extractedSkills);

  return {
    experienceYears,
    skills: extractedSkills,
    normalizedSkills,
    location,
    education,
    keywords: Array.from(new Set([...extractedSkills, location, "Software Engineering"])),
  };
}

/**
 * Callable resume parsing tool invoked by AI agent.
 */
export async function parseResumeTool(params: {
  s3Key: string;
  fileBuffer?: Buffer;
}): Promise<ParsedResume> {
  const { s3Key, fileBuffer } = params;
  const buffer = fileBuffer || (await getStorageBuffer(s3Key));
  const rawText = await extractFileText(s3Key, buffer);
  return extractStructuredDataFromText(rawText);
}
