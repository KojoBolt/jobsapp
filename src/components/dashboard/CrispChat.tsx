import { useEffect } from "react";

const CRISP_WEBSITE_ID = "your-crisp-website-id";

const CrispChat = () => {
  useEffect(() => {
    // Set Crisp config before loading the script
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    // Load Crisp script
    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    // Style Crisp to match our dark theme
    script.onload = () => {
      try {
        (window as any).$crisp.push(["config", "color:theme", "blue"]);
        (window as any).$crisp.push(["config", "position:reverse", false]);
      } catch {
        // Crisp not ready yet
      }
    };

    return () => {
      // Cleanup on unmount
      try {
        document.head.removeChild(script);
        delete (window as any).$crisp;
        delete (window as any).CRISP_WEBSITE_ID;
        // Remove Crisp-injected elements
        const crispElements = document.querySelectorAll('[class*="crisp"]');
        crispElements.forEach((el) => el.remove());
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  return null;
};

export default CrispChat;
