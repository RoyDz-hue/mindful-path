import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const BROWSERLESS_API_KEY = Deno.env.get("BROWSERLESS_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!BROWSERLESS_API_KEY) {
      throw new Error("BROWSERLESS_API_KEY is not configured");
    }

    const { query, type = "video" } = await req.json();
    console.log(`Searching for: ${query}, type: ${type}`);

    // Use AI to analyze the search query and generate safe search suggestions
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content search assistant for a wellness rehabilitation platform. 
            Your task is to help users find video content online while maintaining their safety and recovery goals.
            
            When given a search query, you should:
            1. Analyze the intent behind the search
            2. Generate 3-5 safe, curated video URLs from legitimate video platforms (YouTube, Vimeo, Dailymotion, etc.)
            3. Provide brief descriptions for each
            4. Flag if the query seems problematic for recovery
            
            Respond in JSON format:
            {
              "results": [
                {
                  "title": "Video title",
                  "url": "https://...",
                  "platform": "YouTube/Vimeo/etc",
                  "thumbnail": "https://...",
                  "description": "Brief description",
                  "duration": "5:30",
                  "safe": true
                }
              ],
              "warning": null or "Warning message if query is concerning",
              "suggestions": ["alternative search 1", "alternative search 2"]
            }`
          },
          {
            role: "user",
            content: `Find ${type} content for this search query: "${query}"`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Try to parse the JSON response
    let searchResults;
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        searchResults = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      searchResults = {
        results: [],
        warning: "Unable to process search. Please try a different query.",
        suggestions: ["relaxation videos", "nature documentaries", "meditation content"]
      };
    }

    console.log(`Found ${searchResults.results?.length || 0} results`);
    
    return new Response(
      JSON.stringify({ success: true, ...searchResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
