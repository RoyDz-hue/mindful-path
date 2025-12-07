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

    const { query, type = "video", remainingMinutes = 60, currentDay = 1 } = await req.json();
    console.log(`Searching for: ${query}, type: ${type}, remaining: ${remainingMinutes}min, day: ${currentDay}`);

    // Use AI to find content AND provide supportive guidance (NOT blocking)
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
            content: `You are a supportive, non-judgmental content search assistant for a harm-reduction wellness platform.

YOUR CORE PHILOSOPHY:
- ALLOW content viewing (unless time is 0 or content is illegal)
- TRACK and monitor viewing patterns privately
- SUPPORT the user with gentle motivation
- NEVER shame, lecture, or moralize
- NEVER block or redirect adult content unless it's illegal

THE REDUCTION PROGRAM:
Day 1: 60 min → Day 2: 40 min → Day 3: 20 min → Day 4: 10 min → Day 5: 5 min → Day 6: 2 min → Day 7: 0 min

USER'S CURRENT STATE:
- Day ${currentDay} of program
- ${remainingMinutes} minutes remaining today

WHEN GENERATING RESULTS:
1. Find actual video URLs matching the query (from real adult sites if that's what they searched)
2. Mark all found content as "safe: true" unless it's illegal content
3. Generate a supportive motivation message (not warning, not blocking)
4. Include the URL the user is likely looking for

YOUR TONE:
- "You have ${remainingMinutes} minutes remaining. I'll start tracking when you begin."
- "Good progress - you're on day ${currentDay}. Want me to set a reminder at halfway?"
- "Ready when you are. I'll keep track of your time."

NEVER SAY:
- "This content may harm your recovery"
- "Try these healthy alternatives instead"
- "This content is inappropriate"
- "Consider watching something else"

Respond in JSON format:
{
  "results": [
    {
      "title": "Video title",
      "url": "https://actual-url-user-wants",
      "platform": "Platform name",
      "thumbnail": "https://thumbnail-url-if-available",
      "description": "Brief neutral description",
      "duration": "estimated duration",
      "safe": true
    }
  ],
  "motivation": "Supportive, brief message about their remaining time and progress",
  "suggestions": ["related search 1", "related search 2"],
  "canWatch": ${remainingMinutes > 0}
}`
          },
          {
            role: "user",
            content: `Find ${type} content for: "${query}"`
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
        motivation: `You have ${remainingMinutes} minutes remaining today. Try searching again or paste a direct URL.`,
        suggestions: [],
        canWatch: remainingMinutes > 0
      };
    }

    // Ensure all results are marked as safe (we allow viewing)
    if (searchResults.results) {
      searchResults.results = searchResults.results.map((r: any) => ({
        ...r,
        safe: true
      }));
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
