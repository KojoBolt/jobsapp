// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY")!;
// const JSEARCH_HOST = Deno.env.get("JSEARCH_HOST")!;
// const LINKEDIN_HOST = Deno.env.get("LINKEDIN_HOST")!;

// async function scrapeLinkedIn(linkedinUrl: string) {
//   const res = await fetch(
//     `https://fresh-linkedin-profile-data.p.rapidapi.com/enrich-lead?linkedin_url=${encodeURIComponent(linkedinUrl)}&include_skills=true`,
//     {
//       headers: {
//         "x-rapidapi-key": RAPIDAPI_KEY,
//         "x-rapidapi-host": LINKEDIN_HOST,
//         "Content-Type": "application/json",
//       },
//     }
//   );
//   const data = await res.json();
//   return {
//     skills: data?.skills?.map((s: any) => s.name).join(", ") || "",
//     headline: data?.headline || "",
//     currentTitle: data?.experience?.[0]?.title || "",
//     currentCompany: data?.experience?.[0]?.company || "",
//   };
// }

// async function fetchJobs(query: string, location: string, page: number) {
//   try {
//     const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${page}&num_pages=1`;
//     console.log("JSearch URL:", url);

//     const res = await fetch(url, {
//       headers: {
//         "x-rapidapi-key": RAPIDAPI_KEY,
//         "x-rapidapi-host": JSEARCH_HOST,
//       },
//     });

//     const data = await res.json();
//     console.log("JSearch response status:", res.status);
//     console.log("JSearch data keys:", Object.keys(data));
//     console.log("JSearch jobs count:", data?.data?.length || 0);

//     return data?.data || [];
//   } catch (err) {
//     console.error("JSearch fetch error:", err);
//     return [];
//   }
// }

// // ✅ Remotive fallback — free, no API key needed
// async function fetchRemotiveJobs(query: string) {
//   try {
//     const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=50`;
//     console.log("Remotive URL:", url);

//     const res = await fetch(url);
//     const data = await res.json();

//     console.log("Remotive jobs count:", data?.jobs?.length || 0);

//     return data?.jobs?.map((job: any) => ({
//       job_title: job.title,
//       employer_name: job.company_name,
//       job_apply_link: job.url,
//       job_description: job.description?.replace(/<[^>]*>/g, '').slice(0, 1000) || "",
//       job_city: "Remote",
//     })) || [];
//   } catch (err) {
//     console.error("Remotive fetch error:", err);
//     return [];
//   }
// }

// async function appendLog(supabase: any, campaignId: string, message: string) {
//   await supabase.rpc("append_campaign_log", {
//     campaign_id: campaignId,
//     log_message: `[${new Date().toISOString()}] ${message}`,
//   });
// }

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response(null, { status: 204, headers: corsHeaders });
//   }

//   try {
//     const authHeader = req.headers.get("Authorization");
//     if (!authHeader) throw new Error("Missing authorization header");

//     console.log("Auth header received:", authHeader?.slice(0, 30));

//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL")!,
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
//       {
//         global: {
//           headers: { Authorization: authHeader },
//         },
//       }
//     );

//     const token = authHeader.replace("Bearer ", "");
//     const { data: { user }, error: userError } = await supabase.auth.getUser(token);
//     if (userError || !user) throw new Error("Unauthorized");

//     console.log("User authenticated:", user.id);

//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("identity_vault_data, credits_remaining")
//       .eq("id", user.id)
//       .single();

//     if (!profile) throw new Error("Profile not found");
//     if ((profile.credits_remaining || 0) < 200) throw new Error("Insufficient credits. You need 200 credits to deploy.");

//     const linkedinUrl = profile.identity_vault_data?.personalInfo?.linkedinUrl;
//     if (!linkedinUrl) throw new Error("LinkedIn URL not found. Please update your Identity Vault.");

//     const { data: resume } = await supabase
//       .from("resumes")
//       .select("extracted_text, tone_preference")
//       .eq("user_id", user.id)
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .single();

//     if (!resume) throw new Error("Resume not found. Please upload your resume first.");

//     const { data: campaign, error: campaignError } = await supabase
//       .from("campaigns")
//       .insert({
//         user_id: user.id,
//         status: "running",
//         total_jobs: 200,
//         processed_jobs: 0,
//         logs: ["Campaign initialized..."],
//       })
//       .select()
//       .single();

//     if (campaignError) throw campaignError;
//     const campaignId = campaign.id;

//     await supabase
//       .from("profiles")
//       .update({ credits_remaining: (profile.credits_remaining || 0) - 200 })
//       .eq("id", user.id);

//     await appendLog(supabase, campaignId, "Credits deducted. Starting campaign...");
//     // await appendLog(supabase, campaignId, "Scraping LinkedIn profile...");

//     // const linkedinData = await scrapeLinkedIn(linkedinUrl);
//     // await appendLog(supabase, campaignId, `LinkedIn scraped. Skills: ${linkedinData.skills.slice(0, 50)}...`);

//     const linkedinData = {
//   skills: "",
//   headline: "",
//   currentTitle: profile.identity_vault_data?.targeting?.targetRoles?.[0] || "Software Engineer",
//   currentCompany: "",
// };

//     const targetRoles = profile.identity_vault_data?.targeting?.targetRoles || [];
//     const industries = profile.identity_vault_data?.targeting?.industries || [];
//     const roleTypes = profile.identity_vault_data?.targeting?.roleTypes || [];
//     const location = roleTypes.includes("Remote") ? "Remote" : "United States";

//     // ✅ Better search queries combining role + industry
//     const searchQueries = targetRoles.length > 0
//       ? targetRoles.map((role: string) =>
//           industries.length > 0 ? `${role} ${industries[0]}` : role
//         ).slice(0, 4)
//       : [linkedinData.currentTitle || "Software Engineer"];

//     // ✅ Debug logs
//     console.log("Target roles:", targetRoles);
//     console.log("Industries:", industries);
//     console.log("Location:", location);
//     console.log("Search queries:", searchQueries);

//     await appendLog(supabase, campaignId, `Sourcing jobs for: ${searchQueries.join(", ")}...`);

//     let allJobs: any[] = [];

//     // 1. Try JSearch first
//     for (const query of searchQueries) {
//       for (let page = 1; page <= 2; page++) {
//         const jobs = await fetchJobs(query, location, page);
//         allJobs = [...allJobs, ...jobs];
//         await appendLog(supabase, campaignId, `JSearch found ${jobs.length} jobs for "${query}" page ${page}`);
//       }
//     }

//     console.log("Total JSearch jobs:", allJobs.length);

//     // 2. ✅ Remotive fallback if JSearch returned less than 50 jobs
//     if (allJobs.length < 50) {
//       await appendLog(supabase, campaignId, "Fetching remote jobs as backup...");
//       for (const query of searchQueries) {
//         const remotiveJobs = await fetchRemotiveJobs(query);
//         allJobs = [...allJobs, ...remotiveJobs];
//         await appendLog(supabase, campaignId, `Remotive found ${remotiveJobs.length} jobs for "${query}"`);
//       }
//       console.log("Total jobs after Remotive:", allJobs.length);
//     }

//     // 3. Deduplicate + limit to 200
//     const seen = new Set();
//     const uniqueJobs = allJobs.filter((job: any) => {
//       const key = `${job.employer_name}-${job.job_title}`;
//       if (seen.has(key)) return false;
//       seen.add(key);
//       return true;
//     }).slice(0, 200);

//     await appendLog(supabase, campaignId, `${uniqueJobs.length} unique jobs found. Starting cover letter generation...`);

//     await supabase
//       .from("campaigns")
//       .update({ total_jobs: uniqueJobs.length })
//       .eq("id", campaignId);

//     return new Response(
//       JSON.stringify({
//         campaignId,
//         jobs: uniqueJobs.map((job: any) => ({
//           title: job.job_title,
//           company: job.employer_name,
//           url: job.job_apply_link || job.job_google_link,
//           description: job.job_description?.slice(0, 1000) || "",
//           location: job.job_city || location,
//         })),
//         resumeText: resume.extracted_text,
//         tone: resume.tone_preference || "professional",
//         message: "Campaign started. Processing jobs...",
//       }),
//       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );

//   } catch (error: any) {
//     console.error("start-campaign error:", error);
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//     );
//   }
// });

// This function handles the entire lifecycle of a job application campaign:

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY")!;
const LINKEDIN_HOST = Deno.env.get("LINKEDIN_HOST")!;

async function fetchAdzunaJobs(query: string, page: number) {
  try {
    const appId = Deno.env.get("ADZUNA_APP_ID")!;
    const appKey = Deno.env.get("ADZUNA_APP_KEY")!;
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=50&what=${encodeURIComponent(query)}&content-type=application/json`;

    console.log("Adzuna URL:", url);
    const res = await fetch(url);
    const data = await res.json();
    console.log("Adzuna jobs count:", data?.results?.length || 0);

    return data?.results?.map((job: any) => ({
      job_title: job.title,
      employer_name: job.company?.display_name || "Unknown",
      job_apply_link: job.redirect_url,
      job_description: job.description?.slice(0, 1000) || "",
      job_city: job.location?.display_name || "United States",
    })) || [];
  } catch (err) {
    console.error("Adzuna fetch error:", err);
    return [];
  }
}

async function fetchRemotiveJobs(query: string) {
  try {
    const simpleQuery = query.split(" ")[0];
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(simpleQuery)}&limit=50`;
    console.log("Remotive URL:", url);

    const res = await fetch(url);
    const data = await res.json();
    console.log("Remotive jobs count:", data?.jobs?.length || 0);

    return data?.jobs?.map((job: any) => ({
      job_title: job.title,
      employer_name: job.company_name,
      job_apply_link: job.url,
      job_description: job.description?.replace(/<[^>]*>/g, '').slice(0, 1000) || "",
      job_city: "Remote",
    })) || [];
  } catch (err) {
    console.error("Remotive fetch error:", err);
    return [];
  }
}

async function appendLog(supabase: any, campaignId: string, message: string) {
  await supabase.rpc("append_campaign_log", {
    campaign_id: campaignId,
    log_message: `[${new Date().toISOString()}] ${message}`,
  });
}

async function scoreJobsWithAI(
  jobs: any[],
  candidateProfile: any
): Promise<any[]> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

  // Score in batches of 20 to avoid rate limits
  const scoredJobs = [];

  for (let i = 0; i < jobs.length; i += 20) {
    const batch = jobs.slice(i, i + 20);

    const jobsList = batch.map((job: any, idx: number) =>
      `${idx + 1}. Title: ${job.job_title} | Company: ${job.employer_name} | Description: ${job.job_description?.slice(0, 200)}`
    ).join("\n");

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `You are a job matching expert.

CANDIDATE PROFILE:
- Target Roles: ${candidateProfile.targetRoles.join(", ")}
- Skills: ${candidateProfile.skills}
- Industries: ${candidateProfile.industries.join(", ")}
- Salary Min: ${candidateProfile.salaryMin}
- Company Sizes: ${candidateProfile.companySizes?.join(", ")}
- Must Haves: ${candidateProfile.mustHaves}
- Experience: ${candidateProfile.currentTitle}

JOBS TO SCORE:
${jobsList}

Score each job 0-100 based on how well it matches the candidate.
Return ONLY a JSON array of scores in order, like: [85, 42, 91, ...]
No explanation, just the array.`
          }],
        }),
      }
    );

    const data = await response.json();
    const scoresText = data?.choices?.[0]?.message?.content || "[]";

    try {
      const scores = JSON.parse(scoresText.match(/\[.*\]/s)?.[0] || "[]");
      batch.forEach((job: any, idx: number) => {
        scoredJobs.push({
          ...job,
          match_score: scores[idx] || 0,
        });
      });
    } catch {
      // If parsing fails, give all jobs in batch a default score
      batch.forEach((job: any) => {
        scoredJobs.push({ ...job, match_score: 50 });
      });
    }

    // Wait 2 seconds between scoring batches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return scoredJobs;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    console.log("Auth header received:", authHeader?.slice(0, 30));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    console.log("User authenticated:", user.id);

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("identity_vault_data, credits_remaining")
      .eq("id", user.id)
      .single();

    if (!profile) throw new Error("Profile not found");
    if ((profile.credits_remaining || 0) < 200) throw new Error("Insufficient credits. You need 200 credits to deploy.");

    const linkedinUrl = profile.identity_vault_data?.personalInfo?.linkedinUrl;
    if (!linkedinUrl) throw new Error("LinkedIn URL not found. Please update your Identity Vault.");

    // Get resume
    const { data: resume } = await supabase
      .from("resumes")
      .select("extracted_text, tone_preference")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!resume) throw new Error("Resume not found. Please upload your resume first.");

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        status: "running",
        total_jobs: 200,
        processed_jobs: 0,
        logs: ["Campaign initialized..."],
      })
      .select()
      .single();

    if (campaignError) throw campaignError;
    const campaignId = campaign.id;

    // Deduct credits
    await supabase
      .from("profiles")
      .update({ credits_remaining: (profile.credits_remaining || 0) - 200 })
      .eq("id", user.id);

    await appendLog(supabase, campaignId, "Credits deducted. Starting campaign...");

    // Skip LinkedIn scraping for now — use Identity Vault directly
    const linkedinData = {
      skills: "",
      headline: "",
      currentTitle: profile.identity_vault_data?.targeting?.targetRoles?.[0] || "Software Engineer",
      currentCompany: "",
    };

    // Build search queries
    const targetRoles = profile.identity_vault_data?.targeting?.targetRoles || [];
    const industries = profile.identity_vault_data?.targeting?.industries || [];
    const roleTypes = profile.identity_vault_data?.targeting?.roleTypes || [];
    const location = roleTypes.includes("Remote") ? "Remote" : "United States";

    const searchQueries = targetRoles.length > 0
      ? targetRoles.map((role: string) =>
          industries.length > 0 ? `${role} ${industries[0]}` : role
        ).slice(0, 4)
      : [linkedinData.currentTitle || "Software Engineer"];

    console.log("Target roles:", targetRoles);
    console.log("Industries:", industries);
    console.log("Location:", location);
    console.log("Search queries:", searchQueries);

    await appendLog(supabase, campaignId, `Sourcing jobs for: ${searchQueries.join(", ")}...`);

    let allJobs: any[] = [];

    // 1. Adzuna — primary source
    for (const query of searchQueries) {
      for (let page = 1; page <= 2; page++) {
        const jobs = await fetchAdzunaJobs(query, page);
        allJobs = [...allJobs, ...jobs];
        await appendLog(supabase, campaignId, `Adzuna found ${jobs.length} jobs for "${query}" page ${page}`);
      }
    }

    console.log("Total Adzuna jobs:", allJobs.length);

    // 2. Remotive — always add for remote jobs
    await appendLog(supabase, campaignId, "Fetching remote jobs...");
    for (const query of searchQueries) {
      const remotiveJobs = await fetchRemotiveJobs(query);
      allJobs = [...allJobs, ...remotiveJobs];
      await appendLog(supabase, campaignId, `Remotive found ${remotiveJobs.length} jobs for "${query}"`);
    }

    console.log("Total jobs after Remotive:", allJobs.length);

    // 3. Deduplicate + limit to 200
    const seen = new Set();
    const uniqueJobs = allJobs.filter((job: any) => {
      const key = `${job.employer_name}-${job.job_title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 200);

    await appendLog(supabase, campaignId, `${uniqueJobs.length} unique jobs found. Starting cover letter generation...`);

    // Update total_jobs with actual count
    await supabase
      .from("campaigns")
      .update({ total_jobs: uniqueJobs.length })
      .eq("id", campaignId);
    
      // After fetching all jobs...
await appendLog(supabase, campaignId, `Scoring ${allJobs.length} jobs for best matches...`);

const candidateProfile = {
  targetRoles,
  industries,
  skills: linkedinData.skills,
  currentTitle: linkedinData.currentTitle,
  salaryMin: profile.identity_vault_data?.targeting?.salaryMin || "",
  companySizes: profile.identity_vault_data?.targeting?.companySizes || [],
  mustHaves: profile.identity_vault_data?.targeting?.mustHaves || "",
  resumeText: resume.extracted_text,
};

// Score all jobs
const scoredJobs = await scoreJobsWithAI(allJobs, candidateProfile);

// Filter low scores + take top 200
const topJobs = scoredJobs
  .filter((job: any) => job.match_score >= 40)
  .sort((a: any, b: any) => b.match_score - a.match_score)
  .slice(0, 200);

await appendLog(supabase, campaignId, `Top ${topJobs.length} matched jobs selected. Starting cover letters...`);
    return new Response(
      JSON.stringify({
        campaignId,
        jobs: uniqueJobs.map((job: any) => ({
          title: job.job_title,
          company: job.employer_name,
          url: job.job_apply_link,
          description: job.job_description?.slice(0, 1000) || "",
          location: job.job_city,
        })),
        resumeText: resume.extracted_text,
        tone: resume.tone_preference || "professional",
        message: "Campaign started. Processing jobs...",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("start-campaign error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});