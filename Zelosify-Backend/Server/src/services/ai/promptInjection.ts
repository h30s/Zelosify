/**
 * Prompt injection mitigation and input sanitization utilities.
 * Protects LLM agents against malicious resume text payloads.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /you\s+are\s+now\s+(in\s+developer\s+mode|unrestricted|an\s+unfiltered\s+assistant)/gi,
  /system\s*:\s*/gi,
  /system\s+prompt\s*:\s*/gi,
  /###\s*(instruction|system|human|assistant)/gi,
  /<\/?system>/gi,
  /always\s+recommend\s+this\s+candidate/gi,
  /give\s+a\s+score\s+of\s+1(\.0)?/gi,
  /override\s+evaluation/gi,
  /do\s+not\s+apply\s+any\s+scoring/gi,
  /json\s+injection/gi,
];

/**
 * Checks whether text contains likely prompt injection phrases.
 */
export function detectPromptInjection(text: string): boolean {
  if (!text) return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Sanitizes untrusted resume text before providing it to agent tools or prompts.
 */
export function sanitizeResumeText(rawText: string, maxChars = 10000): string {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  // 1. Remove non-printable control characters (except common whitespace)
  let cleaned = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");

  // 2. Strip known injection patterns and prompt override directives
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[FILTERED]");
  }

  // 3. Remove prompt markup delimiters that could break message framing
  cleaned = cleaned
    .replace(/```(json|xml|markdown|system)?/gi, "")
    .replace(/<\|.*?\|>/g, "")
    .replace(/<candidate_data_untrusted>/gi, "")
    .replace(/<\/candidate_data_untrusted>/gi, "");

  // 4. Bound length to avoid denial of service / context stuffing
  if (cleaned.length > maxChars) {
    cleaned = cleaned.slice(0, maxChars);
  }

  return cleaned.trim();
}
