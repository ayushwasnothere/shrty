import { Github, Twitter, Linkedin } from "lucide-react";

const socialLinks = [
  {
    icon: Github,
    href: "https://github.com/ayushwasnothere/shrty",
    label: "GitHub",
  },
  {
    icon: Twitter,
    href: "https://twitter.com/ayushwasnothere",
    label: "Twitter",
  },
  {
    icon: Linkedin,
    href: "https://linkedin.com/in/ayushwasnothere",
    label: "LinkedIn",
  },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Shrty. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
