import { NextRequest, NextResponse } from "next/server";

interface ExecuteCodeRequest {
  language: string;
  code: string;
  input?: string;
  timeout?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteCodeRequest = await request.json();
    const { language, code, input, timeout = 30000 } = body;

    // Validate request
    if (!language || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: language and code",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Get backend configuration
    const backendUrl =
      process.env.BACKEND_URL || "https://codejoin-backend.onrender.com";
    const apiKey = process.env.BACKEND_API_KEY || "test123";

    // Prepare the request to the backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${backendUrl}/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          language,
          code,
          input,
          timeout,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage =
            errorJson.error || errorJson.message || "Backend execution failed";
        } catch {
          errorMessage =
            errorText.length > 0 && errorText.length < 500
              ? errorText
              : `Backend error: ${response.status} ${response.statusText}`;
        }

        return NextResponse.json(
          {
            success: false,
            language,
            output: "",
            error: errorMessage,
            exitCode: 1,
            executionTime: 0,
            timestamp: new Date().toISOString(),
          },
          { status: response.status }
        );
      }

      const result = await response.json();

      // Return the backend response
      return NextResponse.json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            language,
            output: "",
            error: "Execution timeout: The code took too long to run",
            exitCode: 124,
            executionTime: timeout,
            timestamp: new Date().toISOString(),
          },
          { status: 408 }
        );
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        return NextResponse.json(
          {
            success: false,
            language,
            output: "",
            error: `Connection failed: Cannot connect to backend at ${backendUrl}. Make sure the backend server is running.`,
            exitCode: 1,
            executionTime: 0,
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          language,
          output: "",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          exitCode: 1,
          executionTime: 0,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        language: "unknown",
        output: "",
        error: "Invalid request format",
        exitCode: 1,
        executionTime: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}

// GET endpoint to check if code execution is available
export async function GET() {
  try {
    const backendUrl =
      process.env.BACKEND_URL || "https://codejoin-backend.onrender.com";
    const apiKey = process.env.BACKEND_API_KEY || "test123";

    // Check if backend is available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${backendUrl}/api/languages`, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const languages = await response.json();
        return NextResponse.json({
          status: "available",
          message: "Code execution service is available",
          backend: {
            status: "connected",
            url: backendUrl,
          },
          languages: languages.languages || [],
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          {
            status: "unavailable",
            message: "Code execution service is not responding correctly",
            backend: {
              status: "error",
              url: backendUrl,
              statusCode: response.status,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        );
      }
    } catch (error) {
      clearTimeout(timeoutId);

      return NextResponse.json(
        {
          status: "unavailable",
          message: "Cannot connect to code execution backend",
          backend: {
            status: "disconnected",
            url: backendUrl,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check code execution service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
