import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BROWSERLESS_API_KEY = Deno.env.get("BROWSERLESS_API_KEY");
    if (!BROWSERLESS_API_KEY) {
      throw new Error("BROWSERLESS_API_KEY is not configured");
    }

    const { action, url, selectors, waitFor } = await req.json();
    console.log(`Browserless action: ${action}, URL: ${url}`);

    const baseUrl = "https://production-sfo.browserless.io";
    let endpoint = "";
    let requestBody: Record<string, unknown> = { url };

    switch (action) {
      case "screenshot":
        endpoint = `/screenshot?token=${BROWSERLESS_API_KEY}`;
        requestBody = {
          url,
          options: {
            type: "png",
            fullPage: false,
          },
          gotoOptions: {
            waitUntil: "networkidle2",
            timeout: 30000,
          },
        };
        break;

      case "content":
        endpoint = `/content?token=${BROWSERLESS_API_KEY}`;
        requestBody = {
          url,
          gotoOptions: {
            waitUntil: "networkidle2",
            timeout: 30000,
          },
        };
        break;

      case "scrape":
        endpoint = `/scrape?token=${BROWSERLESS_API_KEY}`;
        requestBody = {
          url,
          elements: selectors || [
            { selector: "video" },
            { selector: "iframe" },
            { selector: "title" },
            { selector: "meta[name='description']" },
            { selector: "a[href*='video']" },
            { selector: "img" },
          ],
          gotoOptions: {
            waitUntil: "networkidle2",
            timeout: 30000,
          },
        };
        if (waitFor) {
          requestBody.waitForSelector = { selector: waitFor, timeout: 10000 };
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Calling browserless: ${baseUrl}${endpoint}`);
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Browserless error: ${response.status} - ${errorText}`);
      throw new Error(`Browserless API error: ${response.status}`);
    }

    // Handle different response types
    if (action === "screenshot") {
      const imageBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      return new Response(
        JSON.stringify({ success: true, screenshot: `data:image/png;base64,${base64}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "content") {
      const html = await response.text();
      return new Response(
        JSON.stringify({ success: true, html }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Browserless function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
