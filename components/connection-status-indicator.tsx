"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { codeExecutionAPI } from "@/lib/api/codeExecution";
import { API_CONFIG } from "@/lib/api-config";

interface ConnectionStatus {
  backend: {
    status: "connected" | "disconnected" | "error" | "checking";
    url: string;
    lastChecked: Date | null;
    error?: string;
    responseTime?: number;
  };
  socket: {
    status: "connected" | "disconnected" | "checking";
    url: string;
    lastChecked: Date | null;
  };
  codeExecution: {
    status: "available" | "unavailable" | "checking";
    languages: string[];
    lastChecked: Date | null;
    error?: string;
  };
}

export default function ConnectionStatusIndicator() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    backend: {
      status: "checking",
      url: API_CONFIG.BACKEND_URL,
      lastChecked: null,
    },
    socket: {
      status: "checking",
      url: API_CONFIG.SOCKET_URL,
      lastChecked: null,
    },
    codeExecution: {
      status: "checking",
      languages: [],
      lastChecked: null,
    },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkBackendConnection = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
      });
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      setConnectionStatus((prev) => ({
        ...prev,
        backend: {
          status: data.backend?.status === "connected" ? "connected" : "error",
          url: data.backend?.url || API_CONFIG.BACKEND_URL,
          lastChecked: new Date(),
          error: data.backend?.error,
          responseTime,
        },
      }));
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        backend: {
          status: "disconnected",
          url: API_CONFIG.BACKEND_URL,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
  };

  const checkCodeExecution = async () => {
    try {
      const response = await fetch("/api/execute", {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json();

      setConnectionStatus((prev) => ({
        ...prev,
        codeExecution: {
          status: data.status === "available" ? "available" : "unavailable",
          languages:
            data.languages?.map((lang: any) => lang.id || lang.name) || [],
          lastChecked: new Date(),
          error: data.error,
        },
      }));
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        codeExecution: {
          status: "unavailable",
          languages: [],
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
  };

  const checkSocketConnection = async () => {
    // Check if socket is connected by checking the SocketProvider context
    // This is a simplified check - in a real implementation, you'd check the actual socket status
    try {
      const response = await fetch(API_CONFIG.SOCKET_URL, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });

      setConnectionStatus((prev) => ({
        ...prev,
        socket: {
          status: response.ok ? "connected" : "disconnected",
          url: API_CONFIG.SOCKET_URL,
          lastChecked: new Date(),
        },
      }));
    } catch (error) {
      setConnectionStatus((prev) => ({
        ...prev,
        socket: {
          status: "disconnected",
          url: API_CONFIG.SOCKET_URL,
          lastChecked: new Date(),
        },
      }));
    }
  };

  const checkAllConnections = async () => {
    setIsRefreshing(true);
    await Promise.all([
      checkBackendConnection(),
      checkCodeExecution(),
      checkSocketConnection(),
    ]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAllConnections();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkAllConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "disconnected":
      case "unavailable":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant =
      status === "connected" || status === "available"
        ? "default"
        : status === "disconnected" || status === "unavailable"
        ? "destructive"
        : status === "error"
        ? "secondary"
        : "outline";

    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Backend Connection Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={checkAllConnections}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backend Connection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Backend API</h3>
            {getStatusBadge(connectionStatus.backend.status)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon(connectionStatus.backend.status)}
            <span>URL: {connectionStatus.backend.url}</span>
            {connectionStatus.backend.responseTime && (
              <span>• {connectionStatus.backend.responseTime}ms</span>
            )}
          </div>
          {connectionStatus.backend.error && (
            <p className="text-sm text-red-600">
              {connectionStatus.backend.error}
            </p>
          )}
          {connectionStatus.backend.lastChecked && (
            <p className="text-xs text-muted-foreground">
              Last checked:{" "}
              {connectionStatus.backend.lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Code Execution */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Code Execution</h3>
            {getStatusBadge(connectionStatus.codeExecution.status)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon(connectionStatus.codeExecution.status)}
            <span>
              {connectionStatus.codeExecution.status === "available"
                ? `${connectionStatus.codeExecution.languages.length} languages available`
                : "Service unavailable"}
            </span>
          </div>
          {connectionStatus.codeExecution.error && (
            <p className="text-sm text-red-600">
              {connectionStatus.codeExecution.error}
            </p>
          )}
          {connectionStatus.codeExecution.languages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {connectionStatus.codeExecution.languages
                .slice(0, 10)
                .map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              {connectionStatus.codeExecution.languages.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{connectionStatus.codeExecution.languages.length - 10} more
                </Badge>
              )}
            </div>
          )}
          {connectionStatus.codeExecution.lastChecked && (
            <p className="text-xs text-muted-foreground">
              Last checked:{" "}
              {connectionStatus.codeExecution.lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Socket Connection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Socket.IO</h3>
            {getStatusBadge(connectionStatus.socket.status)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon(connectionStatus.socket.status)}
            <span>URL: {connectionStatus.socket.url}</span>
          </div>
          {connectionStatus.socket.lastChecked && (
            <p className="text-xs text-muted-foreground">
              Last checked:{" "}
              {connectionStatus.socket.lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Troubleshooting Tips */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Troubleshooting Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Make sure your backend server is running on{" "}
              {API_CONFIG.BACKEND_URL}
            </li>
            <li>• Check that your backend API key is correctly configured</li>
            <li>
              • Verify that the code execution service is enabled in your
              backend
            </li>
            <li>
              • Ensure Socket.IO server is running on {API_CONFIG.SOCKET_URL}
            </li>
            <li>• Check browser console for detailed error messages</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
