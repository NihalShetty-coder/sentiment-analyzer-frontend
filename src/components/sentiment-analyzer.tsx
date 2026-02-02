"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  History,
  Loader2,
} from "lucide-react";

interface AnalysisResult {
  id?: string;
  text: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  score: number;
  timestamp: Date;
}

export function SentimentAnalyzer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/history?limit=10`);
      if (!response.ok) {
        throw new Error("Failed to load history");
      }

      const data = (await response.json()) as Array<{
        id: string;
        input_text: string;
        sentiment: "Positive" | "Negative" | "Neutral";
        compound_score: number;
        created_at: string;
      }>;

      const mapped = data.map((item) => ({
        id: item.id,
        text: item.input_text,
        sentiment: item.sentiment,
        score: item.compound_score,
        timestamp: new Date(item.created_at),
      }));

      setHistory(mapped);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load history"
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Please try again.");
      }

      const data = (await response.json()) as {
        input_text: string;
        sentiment: "Positive" | "Negative" | "Neutral";
        compound_score: number;
      };

      const newResult: AnalysisResult = {
        text: data.input_text,
        sentiment: data.sentiment,
        score: data.compound_score,
        timestamp: new Date(),
      };

      setResult(newResult);
      await fetchHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Analysis failed."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return <TrendingUp className="h-5 w-5" />;
      case "Negative":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Minus className="h-5 w-5" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "bg-positive/20 text-positive border-positive/30";
      case "Negative":
        return "bg-negative/20 text-negative border-negative/30";
      default:
        return "bg-neutral/20 text-neutral border-neutral/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.1) return "text-positive";
    if (score < -0.1) return "text-negative";
    return "text-neutral";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Main Analysis Card */}
        <Card className="border-border/50 bg-card shadow-xl shadow-black/20">
          <CardHeader className="pb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
              AI Sentiment Analyzer
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter any text below to analyze its emotional tone and sentiment
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Text Input Area */}
            <div className="space-y-2">
              <Textarea
                placeholder="Type or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[140px] resize-none border-border/50 bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{text.length} characters</span>
                <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>

            {errorMessage && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div className="mt-6 space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                <div className="border-t border-border/50 pt-4">
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    Analysis Result
                  </h2>

                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Sentiment Badge */}
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Sentiment</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`px-3 py-1.5 text-sm font-medium ${getSentimentColor(result.sentiment)}`}
                          >
                            {getSentimentIcon(result.sentiment)}
                            <span className="ml-1.5">{result.sentiment}</span>
                          </Badge>
                        </div>
                      </div>

                      {/* Compound Score */}
                      <div className="text-right space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Compound Score
                        </span>
                        <div
                          className={`text-3xl font-bold tabular-nums ${getScoreColor(result.score)}`}
                        >
                          {result.score > 0 ? "+" : ""}
                          {result.score.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Negative</span>
                        <span>Neutral</span>
                        <span>Positive</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${((result.score + 1) / 2) * 100}%`,
                            background:
                              result.score > 0.1
                                ? "var(--positive)"
                                : result.score < -0.1
                                  ? "var(--negative)"
                                  : "var(--neutral)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Section */}
        {(history.length > 0 || isLoadingHistory) && (
          <Card className="border-border/50 bg-card shadow-xl shadow-black/20 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground">
                  Recent Analyses
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  {history.length} of 10
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoadingHistory && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading history...
                </div>
              )}
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={`${item.timestamp.getTime()}-${index}`}
                    className="group flex items-center gap-3 rounded-lg border border-border/30 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
                  >
                    {/* Sentiment Indicator */}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${getSentimentColor(item.sentiment)}`}
                    >
                      {getSentimentIcon(item.sentiment)}
                    </div>

                    {/* Text Snippet */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {truncateText(item.text)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${getSentimentColor(item.sentiment)}`}
                        >
                          {item.sentiment}
                        </Badge>
                        <span className={`text-xs font-mono ${getScoreColor(item.score)}`}>
                          {item.score > 0 ? "+" : ""}
                          {item.score.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {!isLoadingHistory && history.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
                    No history yet. Analyze a sentence to see it here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
