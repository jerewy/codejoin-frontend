import ConnectionStatusIndicator from "@/components/connection-status-indicator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connection Status - CodeJoin",
  description: "Check backend connection status and troubleshoot issues",
};

export default function ConnectionStatusPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connection Status</h1>
        <p className="text-muted-foreground">
          Monitor your backend connections and troubleshoot issues
        </p>
      </div>

      <ConnectionStatusIndicator />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Tests</h2>
          <div className="space-y-2">
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="font-medium">Health Check API</div>
              <div className="text-sm text-muted-foreground">
                Test backend health endpoint
              </div>
            </a>
            <a
              href="/api/execute"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="font-medium">Code Execution API</div>
              <div className="text-sm text-muted-foreground">
                Check code execution service
              </div>
            </a>
            <a
              href="/test-code-snippets"
              className="block p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="font-medium">Test Code Execution</div>
              <div className="text-sm text-muted-foreground">
                Try executing code snippets
              </div>
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Environment Configuration</h2>
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-medium mb-2">Current Settings</div>
            <div className="space-y-1 text-sm">
              <div>
                Backend URL:{" "}
                <code className="bg-background px-1 rounded">
                  http://localhost:3001
                </code>
              </div>
              <div>
                Socket URL:{" "}
                <code className="bg-background px-1 rounded">
                  http://localhost:3002
                </code>
              </div>
              <div>
                API Key:{" "}
                <code className="bg-background px-1 rounded">test123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
