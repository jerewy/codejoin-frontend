import { NextRequest, NextResponse } from "next/server";

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

// POST /api/openrouter-ai/chat - OpenRouter AI chat endpoint
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const startTime = Date.now();

  try {
    console.log(`OpenRouter AI chat request started: ${requestId}`);

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

    const requestedModel =
      (typeof model === "string" && model.trim().length > 0
        ? model.trim()
        : typeof (contextPayload as any)?.selectedModel === "string"
        ? (contextPayload as any).selectedModel
        : null) || "qwen/qwen3-235b-a22b:free";

    // Call the backend OpenRouter API
    try {
      const backendUrl =
        process.env.BACKEND_URL || "https://codejoin-backend.onrender.com";
      const backendApiKey = process.env.BACKEND_API_KEY || "test123";

      console.log(
        `Calling OpenRouter backend API: ${backendUrl}/api/openrouter-ai/chat`
      );

      const response = await fetch(`${backendUrl}/api/openrouter-ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": backendApiKey,
        },
        body: JSON.stringify({
          message,
          context: contextPayload,
          model: requestedModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`OpenRouter backend API success for request: ${requestId}`);

        return NextResponse.json({
          success: true,
          response: data.response || data.message,
          metadata: {
            model: data.metadata?.model || "qwen/qwen3-coder:free",
            provider: data.metadata?.provider || "OpenRouter",
            tokensUsed:
              data.metadata?.tokensUsed ||
              data.metadata?.usage?.total_tokens ||
              0,
            responseTime: Date.now() - startTime,
            requestId,
            backend: true,
            openrouter: true,
            ...(data.metadata?.usage && { tokenUsage: data.metadata.usage }),
            ...(data.metadata?.finishReason && {
              finishReason: data.metadata.finishReason,
            }),
            ...(data.metadata?.cached !== undefined && {
              cached: data.metadata.cached,
            }),
          },
        });
      } else {
        const errorData = await response.text();
        console.error(
          "OpenRouter backend API error response:",
          response.status,
          errorData
        );
        throw new Error(
          `OpenRouter backend API returned ${response.status}: ${errorData}`
        );
      }
    } catch (backendError) {
      console.error("OpenRouter backend API error:", backendError);

      // Fallback: Call OpenRouter directly if key is configured
      const openrouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterApiKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to connect to OpenRouter backend and no OPENROUTER_API_KEY is configured.",
            details:
              backendError instanceof Error
                ? backendError.message
                : "Unknown error",
            requestId,
            processingTime: Date.now() - startTime,
            service: "openrouter",
          },
          { status: 503 }
        );
      }

      try {
        const referer =
          process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.NEXT_PUBLIC_VERCEL_URL ||
          "http://localhost:3000";

        const directResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openrouterApiKey}`,
              "HTTP-Referer": referer,
              "X-Title": "CodeJoin",
            },
            body: JSON.stringify({
              model: requestedModel,
              messages: [{ role: "user", content: message }],
              stream: false,
              extra_body: { context: contextPayload },
            }),
          }
        );

        if (!directResponse.ok) {
          const errText = await directResponse.text();
          throw new Error(
            `OpenRouter direct call returned ${directResponse.status}: ${errText}`
          );
        }

        const data = await directResponse.json();
        const choice = data?.choices?.[0];
        const content = choice?.message?.content;
        const modelUsed = data?.model || requestedModel;

        if (!content || typeof content !== "string") {
          throw new Error("OpenRouter returned an invalid response shape");
        }

        return NextResponse.json({
          success: true,
          response: content,
          metadata: {
            model: modelUsed,
            provider: "OpenRouter",
            tokensUsed:
              data?.usage?.total_tokens ??
              data?.usage?.completion_tokens ??
              data?.usage?.prompt_tokens ??
              0,
            responseTime: Date.now() - startTime,
            requestId,
            backend: false,
            openrouter: true,
            direct: true,
            ...(data?.usage && { tokenUsage: data.usage }),
            ...(choice?.finish_reason && { finishReason: choice.finish_reason }),
          },
        });
      } catch (directError) {
        console.error("OpenRouter direct call failed:", directError);

        return NextResponse.json(
          {
            success: false,
            error: "Failed to connect to OpenRouter AI service",
            details:
              directError instanceof Error
                ? directError.message
                : "Unknown error",
            requestId,
            processingTime: Date.now() - startTime,
            service: "openrouter",
          },
          { status: 503 }
        );
      }
    }
  } catch (error) {
    console.error(`Error in OpenRouter AI chat POST: ${requestId}`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        requestId,
        processingTime: Date.now() - startTime,
        service: "openrouter",
      },
      { status: 500 }
    );
  }
}

// GET /api/openrouter-ai/chat - Get OpenRouter AI service status
export async function GET(request: NextRequest) {
  try {
    // Test backend OpenRouter connection
    let backendStatus = "unknown";
    let backendDetails = null;

    try {
      const backendUrl =
        process.env.BACKEND_URL || "https://codejoin-backend.onrender.com";
      const response = await fetch(`${backendUrl}/api/openrouter-ai/health`, {
        method: "GET",
        headers: {
          "X-API-Key": process.env.BACKEND_API_KEY || "test123",
        },
      });

      if (response.ok) {
        const healthData = await response.json();
        backendStatus = "connected";
        backendDetails = healthData;
      } else {
        backendStatus = "error";
      }
    } catch (error) {
      backendStatus = "disconnected";
      console.error("OpenRouter health check failed:", error);
    }

    return NextResponse.json({
      status: "operational",
      backend: backendStatus,
      backendDetails,
      timestamp: new Date().toISOString(),
      features: {
        openrouterChat: backendStatus === "connected",
        backendIntegration: backendStatus === "connected",
      },
      service: "openrouter",
    });
  } catch (error) {
    console.error("Error in OpenRouter AI chat GET:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        service: "openrouter",
      },
      { status: 500 }
    );
  }
}
