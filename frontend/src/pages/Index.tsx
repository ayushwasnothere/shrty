import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { URLShortener } from "@/components/URLShortener";
import { LinkHistory } from "@/components/LinkHistory";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ShortenedLink } from "@/types/link";

const Index = () => {
  const [links, setLinks] = useLocalStorage<ShortenedLink[]>("shrty-history", []);

  const handleLinkCreated = (link: ShortenedLink) => {
    setLinks((prev) => [link, ...prev].slice(0, 50));
  };

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleClearAll = () => {
    setLinks([]);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-16 space-y-12 flex-1">
        <URLShortener onLinkCreated={handleLinkCreated} />
        
        <LinkHistory
          links={links}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
