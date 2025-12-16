import { useState, useCallback } from "react";
import { Link2, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Turnstile } from "./Turnstile";
import { toast } from "@/hooks/use-toast";
import { ShortenedLink } from "@/types/link";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface URLShortenerProps {
  onLinkCreated: (link: ShortenedLink) => void;
}

export function URLShortener({ onLinkCreated }: URLShortenerProps) {
  const [url, setUrl] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    shortUrl: string;
    originalUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileKey((prev) => prev + 1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    if (!turnstileToken) {
      toast({
        title: "Error",
        description: "Please complete the verification",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          turnstileToken: turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to shorten URL");
      }

      const shortUrl = data.shortened_url || data.shortUrl;
      const originalUrl = data.original_url || data.originalUrl || url;

      setResult({ shortUrl, originalUrl });

      const newLink: ShortenedLink = {
        id: crypto.randomUUID(),
        originalUrl,
        shortUrl,
        createdAt: new Date().toISOString(),
      };

      onLinkCreated(newLink);

      toast({
        title: "Success!",
        description: "Your link has been shortened",
      });

      setUrl("");
      resetTurnstile();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to shorten URL",
        variant: "destructive",
      });
      resetTurnstile();
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText("https://" + result.shortUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-up">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm text-muted-foreground">
          <Link2 className="w-4 h-4" />
          <span>Fast & Secure Link Shortening</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Simplify Your Links
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Transform long URLs into clean, shareable links in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-2xl p-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="url"
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-14 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
            />
            <Button
              type="submit"
              disabled={isLoading || !turnstileToken}
              className="h-14 px-8 text-base font-medium rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Shorten"
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Turnstile key={turnstileKey} onVerify={handleTurnstileVerify} />
        </div>
      </form>

      {result && (
        <div className="animate-scale-in glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Your shortened link
              </p>
              <a
                href={"https://" + result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-foreground hover:underline flex items-center gap-2 truncate"
              >
                {result.shortUrl}
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={copyToClipboard}
              className="rounded-xl h-12 w-12 flex-shrink-0"
            >
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground truncate">
              Original: {result.originalUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
