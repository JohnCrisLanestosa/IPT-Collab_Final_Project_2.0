import { useEffect } from "react";

const buildTawkSrc = (propertyId, widgetId) =>
  `https://embed.tawk.to/${propertyId}/${widgetId}`;

export function useTawkTo({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID;
    const widgetId = import.meta.env.VITE_TAWK_WIDGET_ID;

    if (!propertyId || !widgetId) {
      if (import.meta.env.DEV) {
        console.warn(
          "Tawk.to integration skipped: set VITE_TAWK_PROPERTY_ID and VITE_TAWK_WIDGET_ID."
        );
      }
      return;
    }

    const existingScript = document.querySelector(
      `script[data-tawk-property="${propertyId}"]`
    );

    if (existingScript) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.src = buildTawkSrc(propertyId, widgetId);
    script.async = true;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    script.setAttribute("data-tawk-property", propertyId);

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      if (window.Tawk_API) {
        delete window.Tawk_API;
      }

      if (window.Tawk_LoadStart) {
        delete window.Tawk_LoadStart;
      }
    };
  }, [enabled]);
}

