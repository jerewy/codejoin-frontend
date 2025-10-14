"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, Copy, Check } from "lucide-react";

const codeExamples = {
  javascript: {
    title: "JavaScript",
    language: "javascript",
    examples: [
      {
        name: "Array Map",
        code: `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]`,
      },
      {
        name: "Async Function",
        code: `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}`,
      },
    ],
  },
  python: {
    title: "Python",
    language: "python",
    examples: [
      {
        name: "List Comprehension",
        code: `numbers = [1, 2, 3, 4, 5]
squared = [n**2 for n in numbers]
print(squared)  # [1, 4, 9, 16, 25]`,
      },
      {
        name: "Function with Decorator",
        code: `def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-start}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)`,
      },
    ],
  },
  typescript: {
    title: "TypeScript",
    language: "typescript",
    examples: [
      {
        name: "Interface Definition",
        code: `interface User {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

function createUser(user: Omit<User, 'id'>): User {
  return {
    ...user,
    id: Math.random(),
  };
}`,
      },
      {
        name: "Generic Type",
        code: `interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function fetchUser(): Promise<ApiResponse<User>> {
  return fetch('/api/user')
    .then(res => res.json());
}`,
      },
    ],
  },
};

export default function TestCodeSnippets() {
  const [activeTab, setActiveTab] = useState("javascript");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const executeCode = async (code: string, language: string) => {
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      const result = await response.json();
      console.log("Execution result:", result);
    } catch (error) {
      console.error("Execution error:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Code Snippets Library</h1>
        <p className="text-muted-foreground">
          Test and explore code examples in multiple languages
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(codeExamples).map(([key, value]) => (
            <TabsTrigger key={key} value={key}>
              {value.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(codeExamples).map(([key, languageData]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <div className="grid gap-6">
              {languageData.examples.map((example, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        {example.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{languageData.language}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(example.code)}
                        >
                          {copiedCode === example.code ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            executeCode(example.code, languageData.language)
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{example.code}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">About Code Snippets</h2>
        <p className="text-muted-foreground mb-4">
          This is a test page for code snippet functionality. You can:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Browse code examples in different programming languages</li>
          <li>Copy code snippets to your clipboard</li>
          <li>Execute code snippets (if backend execution is available)</li>
          <li>Test syntax highlighting and code formatting</li>
        </ul>
      </div>
    </div>
  );
}
