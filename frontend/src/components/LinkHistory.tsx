import { useState } from "react";
import {
  Copy,
  Check,
  Trash2,
  ExternalLink,
  ChevronDown,
  History,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { ShortenedLink } from "@/types/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface LinkHistoryProps {
  links: ShortenedLink[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function LinkHistory({ links, onDelete, onClearAll }: LinkHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (shortUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText("https://" + shortUrl);
      setCopiedId(id);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (links.length === 0) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full max-w-2xl mx-auto animate-fade-in"
    >
      <div className="glass rounded-2xl overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Link History</span>
              <span className="text-sm text-muted-foreground">
                ({links.length})
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border">
            <div className="px-6 py-3 flex justify-end border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="px-6 py-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <a
                        href={"https://" + link.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline flex items-center gap-2"
                      >
                        {link.shortUrl}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      <p className="text-xs text-muted-foreground truncate">
                        {link.originalUrl}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(link.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(link.shortUrl, link.id)}
                        className="h-8 w-8"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(link.id)}
                        className="h-8 w-8 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
