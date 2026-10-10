/**
 * Skill Normalization Tool
 * Standardizes technical skills across aliases, casing, and versions.
 */

const SKILL_ALIASES: Record<string, string> = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  ts: "typescript",
  typescript: "typescript",
  js: "javascript",
  javascript: "javascript",
  py: "python",
  python3: "python",
  "python 3": "python",
  python: "python",
  golang: "go",
  go: "go",
  "amazon web services": "aws",
  aws: "aws",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  postgres: "postgresql",
  postgresql: "postgresql",
  psql: "postgresql",
  mongo: "mongodb",
  mongodb: "mongodb",
  docker: "docker",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  graphql: "graphql",
  "rest api": "rest",
  restful: "rest",
  rest: "rest",
  "c++": "cpp",
  cpp: "cpp",
  "c#": "csharp",
  csharp: "csharp",
  pytorch: "pytorch",
  tensorflow: "tensorflow",
  tf: "tensorflow",
  langchain: "langchain",
  terraform: "terraform",
  kafka: "kafka",
  redis: "redis",
  "ci/cd": "cicd",
  cicd: "cicd",
  playwright: "playwright",
  cypress: "cypress",
  linux: "linux",
  sql: "sql",
  snowflake: "snowflake",
  spark: "spark",
  "apache spark": "spark",
  airflow: "airflow",
  prometheus: "prometheus",
  grafana: "grafana",
  "react native": "reactnative",
  reactnative: "reactnative",
};

/**
 * Normalizes a single skill string.
 */
export function normalizeSingleSkill(skill: string): string {
  if (!skill) return "";
  const cleaned = skill.trim().toLowerCase();
  return SKILL_ALIASES[cleaned] || cleaned.replace(/[^a-z0-9#+]/g, "");
}

/**
 * Skill Normalization Tool Execution
 */
export function normalizeSkills(skills: string[]): {
  normalizedSkills: string[];
  rawSkills: string[];
} {
  if (!Array.isArray(skills)) {
    return { normalizedSkills: [], rawSkills: [] };
  }

  const rawSkills = skills.map((s) => String(s).trim()).filter(Boolean);
  const normalizedSet = new Set<string>();

  for (const s of rawSkills) {
    const norm = normalizeSingleSkill(s);
    if (norm) {
      normalizedSet.add(norm);
    }
  }

  return {
    normalizedSkills: Array.from(normalizedSet),
    rawSkills,
  };
}
