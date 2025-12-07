import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, user_id, remaining_seconds } = await req.json();
    
    if (!url || !user_id) {
      return new Response(
        JSON.stringify({ 
          can_watch: false, 
          reply: "Missing required parameters. Let's try again." 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user's remaining time
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_watch_time_today, current_day')
      .eq('user_id', user_id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ 
          can_watch: false, 
          reply: "Couldn't find your profile. Please try logging in again." 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate daily allowance based on current_day (60→40→20→10→5→2→1→0)
    const dailyAllowances = [60, 40, 20, 10, 5, 2, 1, 0];
    const dayIndex = Math.min((profile.current_day || 1) - 1, dailyAllowances.length - 1);
    const dailyAllowanceMinutes = dailyAllowances[dayIndex];
    const usedMinutes = Math.floor((profile.total_watch_time_today || 0) / 60);
    const remainingMinutes = Math.max(0, dailyAllowanceMinutes - usedMinutes);

    if (remainingMinutes <= 0) {
      return new Response(
        JSON.stringify({ 
          can_watch: false, 
          reply: "You've completed today's allowance. Great progress! Fresh start tomorrow." 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fallback download requested for: ${url}`);
    console.log(`User has ${remainingMinutes} minutes remaining today`);

    if (!browserlessApiKey) {
      return new Response(
        JSON.stringify({ 
          can_watch: false, 
          reply: "Fallback system not configured. Please contact support.",
          type: "error"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to get content via Browserless scrape
    let contentData = null;
    
    try {
      console.log("Attempting Browserless content fetch...");
      
      // First try to get page content to find video sources
      const scrapeResponse = await fetch(`https://chrome.browserless.io/scrape?token=${browserlessApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          elements: [
            { selector: 'video source', property: 'src' },
            { selector: 'video', property: 'src' },
            { selector: 'source[type*="video"]', property: 'src' },
            { selector: '[data-video-url]', property: 'data-video-url' },
            { selector: 'meta[property="og:video"]', property: 'content' },
            { selector: 'meta[property="og:video:url"]', property: 'content' }
          ],
          waitFor: 3000
        })
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        console.log("Scrape response:", JSON.stringify(scrapeData));
        
        // Extract video URLs from scrape results
        const videoUrls: string[] = [];
        if (scrapeData.data) {
          for (const item of scrapeData.data) {
            if (item.results) {
              for (const result of item.results) {
                if (result.text && (result.text.includes('.mp4') || result.text.includes('.webm') || result.text.includes('video'))) {
                  videoUrls.push(result.text);
                }
              }
            }
          }
        }

        if (videoUrls.length > 0) {
          contentData = { videoUrl: videoUrls[0] };
          console.log("Found video URL:", videoUrls[0]);
        }
      }
    } catch (scrapeError) {
      console.error("Browserless scrape error:", scrapeError);
    }

    // If we found a direct video URL, try to download it
    if (contentData?.videoUrl) {
      try {
        console.log("Attempting to download video from:", contentData.videoUrl);
        
        const videoResponse = await fetch(contentData.videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (videoResponse.ok && videoResponse.body) {
          const videoBuffer = await videoResponse.arrayBuffer();
          
          if (videoBuffer.byteLength > 1000) {
            const fileName = `${user_id}/${crypto.randomUUID()}.mp4`;
            
            const { error: uploadError } = await supabase.storage
              .from('private-library')
              .upload(fileName, videoBuffer, {
                contentType: 'video/mp4',
                upsert: false
              });

            if (!uploadError) {
              // Create signed URL with expiration based on remaining time
              const expiresIn = Math.max(remainingMinutes * 60, 300); // At least 5 minutes
              const { data: signedUrl } = await supabase.storage
                .from('private-library')
                .createSignedUrl(fileName, expiresIn);

              if (signedUrl?.signedUrl) {
                console.log("Video uploaded successfully, signed URL created");
                
                return new Response(
                  JSON.stringify({ 
                    can_watch: true,
                    type: "downloaded",
                    play_url: signedUrl.signedUrl,
                    reply: `Site blocked live view, so I downloaded it for you. Enjoy your remaining ${remainingMinutes} minutes.`,
                    remaining_minutes: remainingMinutes,
                    expires_in: expiresIn
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            } else {
              console.error("Upload error:", uploadError);
            }
          }
        }
      } catch (downloadError) {
        console.error("Video download error:", downloadError);
      }
    }

    // If download failed, try to get a screenshot as fallback preview
    try {
      console.log("Attempting screenshot fallback...");
      
      const screenshotResponse = await fetch(`https://chrome.browserless.io/screenshot?token=${browserlessApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          options: {
            type: 'png',
            fullPage: false
          },
          waitFor: 3000
        })
      });

      if (screenshotResponse.ok) {
        const screenshotBuffer = await screenshotResponse.arrayBuffer();
        const screenshotFileName = `${user_id}/screenshots/${crypto.randomUUID()}.png`;
        
        await supabase.storage
          .from('private-library')
          .upload(screenshotFileName, screenshotBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        const { data: screenshotUrl } = await supabase.storage
          .from('private-library')
          .createSignedUrl(screenshotFileName, remainingMinutes * 60);

        return new Response(
          JSON.stringify({ 
            can_watch: false,
            type: "screenshot_only",
            screenshot_url: screenshotUrl?.signedUrl,
            reply: `This site restricts video downloads. I captured a preview for you. Try a different source for full video.`,
            remaining_minutes: remainingMinutes
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (screenshotError) {
      console.error("Screenshot error:", screenshotError);
    }

    // Final fallback - couldn't process
    return new Response(
      JSON.stringify({ 
        can_watch: false,
        type: "unavailable",
        reply: `This site has strong protections. No worries - try another source. You still have ${remainingMinutes} minutes today.`,
        remaining_minutes: remainingMinutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fallback downloader error:', error);
    return new Response(
      JSON.stringify({ 
        can_watch: false, 
        reply: "Something went wrong. Let's try a different link.",
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
