import axios from "axios";
import { AGENT_TOOLS, ToolDefinition } from "./toolRegistry.js";
import { TokenUsage } from "./types.js";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

export interface LLMResponse {
  message: LLMMessage;
  tokenUsage: TokenUsage;
}

export async function callLLMCore(
  messages: LLMMessage[],
  tools: ToolDefinition[] = AGENT_TOOLS,
  timeoutMs = 1400
): Promise<LLMResponse> {
  if (process.env.NODE_ENV === "test") {
    return runTestAgentTurn(messages);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required for AI recommendations");
  }

  const startedAt = Date.now();
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const attemptTimeout = timeoutMs - (Date.now() - startedAt);
    if (attemptTimeout <= 0) break;
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
          messages,
          tools: tools.map((tool) => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          })),
          tool_choice: "auto",
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: Math.max(100, attemptTimeout),
        }
      );

      const message = response.data?.choices?.[0]?.message;
      if (!message || (!message.content && !message.tool_calls?.length)) {
        throw new Error("Groq returned an empty assistant message");
      }
      const usage = response.data.usage || {};
      return {
        message,
        tokenUsage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        },
      };
    } catch (error) {
      lastError = error;
      console.warn(
        JSON.stringify({
          event: "AI_LLM_RETRY",
          provider: "groq",
          attempt,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Groq request failed");
}

function runTestAgentTurn(messages: LLMMessage[]): LLMResponse {
  const called = messages
    .filter((message) => message.tool_calls)
    .flatMap((message) => message.tool_calls!.map((call) => call.function.name));
  const results = messages.filter((message) => message.role === "tool");
  const userMessage = messages.find((message) => message.role === "user")?.content || "{}";
  const payload = JSON.parse(userMessage);
  const readResult = (name: string) => {
    const content = results.find((message) => message.name === name)?.content;
    return content ? JSON.parse(content) : {};
  };

  if (!called.includes("resume_parsing_tool")) {
    return toolCall("resume_parsing_tool", { s3Key: payload.s3Key });
  }
  const resume = readResult("resume_parsing_tool");
  if (!called.includes("skill_normalization_tool")) {
    return toolCall("skill_normalization_tool", { skills: resume.skills });
  }
  if (!called.includes("feature_extraction_tool")) {
    return toolCall("feature_extraction_tool", { resume, opening: payload.opening });
  }
  if (!called.includes("deterministic_matching_engine")) {
    return toolCall("deterministic_matching_engine", {
      candidateExp: resume.experienceYears,
      minExp: payload.opening.experienceMin,
      maxExp: payload.opening.experienceMax,
      candidateSkills: resume.skills,
      requiredSkills: payload.opening.requiredSkills,
      candidateLocation: resume.location,
      jobLocation: payload.opening.location,
    });
  }
  const matching = readResult("deterministic_matching_engine");
  if (!called.includes("scoring_engine")) {
    return toolCall("scoring_engine", matching);
  }
  const scoring = readResult("scoring_engine");
  return {
    message: {
      role: "assistant",
      content: JSON.stringify({
        recommended: scoring.finalScore >= 0.75,
        score: scoring.finalScore,
        confidence: 0.9,
        reason: "Tool-backed deterministic recommendation completed.",
      }),
    },
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}

function toolCall(name: string, args: unknown): LLMResponse {
  return {
    message: {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: `test_${name}`,
          type: "function",
          function: { name, arguments: JSON.stringify(args) },
        },
      ],
    },
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}
