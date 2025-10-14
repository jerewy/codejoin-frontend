import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if backend is configured
    const backendUrl =
      process.env.BACKEND_URL || "https://codejoin-backend.onrender.com";

    // Try to connect to the backend health endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "X-API-Key": process.env.BACKEND_API_KEY || "test123",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const healthData = await response.json();
        return NextResponse.json({
          status: "healthy",
          message: "Frontend and backend are connected",
          backend: {
            status: "connected",
            url: backendUrl,
            data: healthData,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          {
            status: "degraded",
            message: "Backend responded with an error",
            backend: {
              status: "error",
              url: backendUrl,
              statusCode: response.status,
              statusText: response.statusText,
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
          status: "unhealthy",
          message: "Cannot connect to backend",
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
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
