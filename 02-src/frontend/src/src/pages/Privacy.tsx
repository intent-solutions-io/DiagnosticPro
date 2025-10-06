import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  useEffect(() => {
    // Load GetTerms embed script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = 'getterms-embed-js';
    script.src = 'https://gettermscdn.com/dist/js/embed.js';

    const existingScript = document.getElementById('getterms-embed-js');
    if (!existingScript) {
      document.body.appendChild(script);
    }

    return () => {
      // Cleanup script on unmount if needed
      const scriptToRemove = document.getElementById('getterms-embed-js');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none">
          <div
            className="getterms-document-embed"
            data-getterms="wH2cn"
            data-getterms-document="privacy"
            data-getterms-lang="en-us"
            data-getterms-mode="direct"
            data-getterms-env="https://gettermscdn.com"
          ></div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
