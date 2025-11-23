import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You are an expert coding assistant for CodeJoin.
- Use concise Markdown with short headings, bullets, and fenced code blocks (with language tags).
- Focus on the requested task; avoid repetition and apologies.
- When showing code, keep it minimal and directly runnable where possible.`;

const DEFAULT_MODEL = "llama-3.1-8b-instant";
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 512;
const MIN_MAX_TOKENS = 128;
const MAX_MAX_TOKENS = 2048;

const buildContextPayload = (
  context: unknown,
  extras: Record<string, unknown>
) => {
  if (context && typeof context === "object" && !Array.isArray(context)) {
    return { ...(context as Record<string, unknown>), ...extras };
  }

  if (typeof context === "string" && context.trim().length > 0) {
    return { summary: context, ...extras };
  }

  return { ...extras };
};

// POST /api/ai/chat - Simple AI chat endpoint
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const startTime = Date.now();

  try {
    console.log(`AI chat request started (Groq primary): ${requestId}`);

    const body = await request.json();
    const { message, context, conversationId, projectId, model } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const contextPayload = buildContextPayload(context, {
      conversationId,
      projectId,
      requestId,
      timestamp: new Date().toISOString(),
    });

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GROQ_API_KEY is not configured.",
          requestId,
          processingTime: Date.now() - startTime,
        },
        { status: 500 }
      );
    }

    const requestedModel =
      typeof model === "string" && model.trim().length > 0
        ? model.trim()
        : null;

    const selectedModel =
      requestedModel && ["smart", "heavy"].includes(requestedModel.toLowerCase())
        ? process.env.GROQ_MODEL_SMART || "llama-3.3-70b-versatile"
        : requestedModel
        ? requestedModel
        : process.env.GROQ_MODEL || DEFAULT_MODEL;

    const temperatureRaw = body?.temperature;
    const temperature =
      typeof temperatureRaw === "number" && temperatureRaw >= 0 && temperatureRaw <= 1
        ? temperatureRaw
        : DEFAULT_TEMPERATURE;

    const maxTokensRaw = body?.max_tokens ?? body?.maxTokens;
    const max_tokens =
      typeof maxTokensRaw === "number"
        ? Math.max(MIN_MAX_TOKENS, Math.min(MAX_MAX_TOKENS, Math.floor(maxTokensRaw)))
        : DEFAULT_MAX_TOKENS;

    const groq = new Groq({ apiKey: groqApiKey });

    // Call Groq as the primary path
    try {
      console.log(`Calling Groq model: ${selectedModel}`);

      const systemContext =
        typeof (contextPayload as any)?.systemContext === "string"
          ? (contextPayload as any).systemContext
          : null;

      const fileContext =
        typeof (contextPayload as any)?.fileContext === "string"
          ? (contextPayload as any).fileContext
          : null;

      const completion = await groq.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: [
              SYSTEM_PROMPT,
              systemContext,
              fileContext
                ? `Project file context (may be truncated):\n${fileContext}`
                : null,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature,
        max_tokens,
      });

      const choice = completion?.choices?.[0];
      const content = choice?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Groq returned an invalid response shape");
      }

      console.log(`Groq success for request: ${requestId}`);

      return NextResponse.json({
        success: true,
        response: content,
        metadata: {
          model: completion.model || selectedModel,
          provider: "Groq",
          tokensUsed:
            completion?.usage?.total_tokens ??
            completion?.usage?.completion_tokens ??
            completion?.usage?.prompt_tokens ??
            0,
          responseTime: Date.now() - startTime,
          requestId,
          backend: false,
          groq: true,
          temperature,
          max_tokens,
          ...(completion?.usage && { tokenUsage: completion.usage }),
          ...(choice?.finish_reason && { finishReason: choice.finish_reason }),
        },
      });
    } catch (groqError) {
      console.error("Groq error:", groqError);

      let errorMessage = "Unknown backend error";
      let statusCode = 500;
      let errorType = "unknown";

      if (groqError instanceof Error) {
        errorMessage = groqError.message;

        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("429")
        ) {
          statusCode = 429;
          errorType = "rate_limit";
        } else if (errorMessage.includes("403")) {
          statusCode = 403;
          errorType = "quota_exceeded";
        } else if (errorMessage.includes("401")) {
          statusCode = 401;
          errorType = "authentication";
        } else if (errorMessage.includes("402")) {
          statusCode = 402;
          errorType = "credits_insufficient";
        } else if (
          errorMessage.includes("503") ||
          errorMessage.includes("temporarily unavailable")
        ) {
          statusCode = 503;
          errorType = "service_unavailable";
        }
      }

      const fallbackResponse = generateLocalResponse(message);

      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        metadata: {
          model: "offline-fallback",
          provider: "local-fallback",
          tokensUsed: 0,
          responseTime: Date.now() - startTime,
          requestId,
          backend: false,
          fallback: true,
          backendError: errorMessage,
          errorType,
          statusCode,
        },
        warning: "Groq unavailable. Returned offline fallback response.",
      });
    }
  } catch (error) {
    console.error(`Error in AI chat POST: ${requestId}`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        requestId,
        processingTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Simple local response generator
function generateLocalResponse(message: string): string {
  const messageLower = message.toLowerCase();

  // Analyze request type
  if (messageLower.includes("hello") || messageLower.includes("hi")) {
    return "Hello! I'm your AI assistant. I'm currently in offline mode, but I can still help you with basic questions about coding, debugging, and general programming concepts. What would you like to know?";
  }

  if (
    messageLower.includes("error") ||
    messageLower.includes("bug") ||
    messageLower.includes("fix")
  ) {
    return "I can help you debug! While I'm in offline mode, I can suggest common debugging steps:\n\n1. Read error messages carefully\n2. Check recent code changes\n3. Use console.log/print statements\n4. Isolate the problem area\n5. Check for common syntax issues\n\nShare the specific error and code, and I'll provide more targeted help!";
  }

  if (
    messageLower.includes("help") ||
    messageLower.includes("what can you do")
  ) {
    return "I'm an AI assistant that can help you with:\n\n• Code debugging and problem-solving\n• Programming concept explanations\n• Code review and suggestions\n• Best practices and patterns\n• Learning new technologies\n\nI'm currently in offline mode, so my responses are based on my training data rather than real-time AI processing. But I'm still here to help!";
  }

  return (
    "I understand you're asking about: " +
    message +
    ". I'm currently in offline mode, but I can help with basic programming questions, debugging tips, and general guidance. Feel free to ask more specific questions, and I'll do my best to assist you!"
  );
}

// GET /api/ai/chat - Get AI system status
export async function GET(request: NextRequest) {
  try {
    const hasGroqKey = !!process.env.GROQ_API_KEY;

    return NextResponse.json({
      status: "operational",
      backend: "groq",
      apiKeyConfigured: hasGroqKey,
      timestamp: new Date().toISOString(),
      features: {
        basicChat: true,
        groq: hasGroqKey,
        localFallback: true,
        backendIntegration: false,
      },
    });
  } catch (error) {
    console.error("Error in AI chat GET:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
