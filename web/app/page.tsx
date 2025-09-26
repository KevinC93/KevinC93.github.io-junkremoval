"use client";

import { useEffect, useState } from "react";

const SITE_CONTENT_URL = "/site-content.html";

const IMMERSIVE_STYLES = [
  "https://assets.calendly.com/assets/external/widget.css",
];

type ScriptConfig = {
  src: string;
  type?: "module" | "text/javascript";
  async?: boolean;
};

const IMMERSIVE_SCRIPTS: ScriptConfig[] = [
  { src: "/assets/js/main.js", type: "module" },
  {
    src: "https://assets.calendly.com/assets/external/widget.js",
    async: true,
  },
];

function loadScript({ src, type = "text/javascript", async = false }: ScriptConfig) {
  const script = document.createElement("script");
  script.src = src;
  script.type = type;
  script.async = async;
  script.dataset.immersiveScript = "true";
  script.dataset.immersiveSrc = src;
  document.body.appendChild(script);
  return script;
}

function loadStyle(href: string) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.immersiveStyle = "true";
  document.head.appendChild(link);
  return link;
}

export default function Home() {
  const [markup, setMarkup] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(SITE_CONTENT_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${SITE_CONTENT_URL}: ${response.status}`);
        }

        return response.text();
      })
      .then((html) => {
        if (!active) {
          return;
        }

        setMarkup(html);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!active) {
          return;
        }

        setError("We couldn't load the immersive experience. Please refresh the page.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!markup || error) {
      return;
    }

    const previousScripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[data-immersive-script="true"]'),
    );
    previousScripts.forEach((script) => script.remove());

    const previousStyles = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[data-immersive-style="true"]'),
    );
    previousStyles.forEach((link) => link.remove());

    const appendedStyles = IMMERSIVE_STYLES.map((href) => loadStyle(href));
    const appendedScripts = IMMERSIVE_SCRIPTS.map((config) => loadScript(config));

    return () => {
      appendedScripts.forEach((script) => {
        script.remove();
      });
      appendedStyles.forEach((link) => {
        link.remove();
      });
    };
  }, [markup, error]);

  return (
    <div id="immersive-root" className="immersive-root">
      <div
        data-immersive-content
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: markup }}
      />

      {loading && !error && (
        <div className="immersive-status" role="status">
          Loading immersive experience - please hold tight.
        </div>
      )}

      {error && (
        <div className="immersive-status immersive-status--error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
