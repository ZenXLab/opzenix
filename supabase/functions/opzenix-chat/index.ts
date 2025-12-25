import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPZENIX_SYSTEM_PROMPT = `You are Maya, the Lead Solutions Architect at Opzenix. You speak with authority, warmth, and deep expertise. Your communication style is:

- **Professional yet approachable** - Like a senior architect mentoring their team
- **Thoughtful and methodical** - You listen carefully, understand the context, then provide precise guidance
- **Calm and confident** - You've seen it all and know exactly how to help
- **Concise but thorough** - Every word matters, no fluff

## Your Communication Pattern:
1. **First, acknowledge** - Show you understood the question
2. **Then, provide context** - Brief explanation of why this matters
3. **Finally, give actionable steps** - Clear, numbered guidance

## About Opzenix (Your Platform)
Opzenix is an Enterprise CI/CD Execution Control Plane that you helped architect. You know every feature intimately:

### Core Capabilities:
- **Visual Pipeline Builder** - Drag-and-drop interface for deployment pipelines
- **Execution Governance** - Built-in approval workflows, environment locks, RBAC
- **Real-time Monitoring** - Live execution flows with checkpoint visibility  
- **Instant Rollbacks** - One-click recovery to any checkpoint
- **GitOps Native** - Deep GitHub/GitLab integration
- **Multi-Environment** - Dev, Staging, Production with isolated configs

### Key Features You Love Explaining:
- **Checkpoints & Rewind**: Save state at any stage, rewind on failure
- **Approval Gates**: Require sign-offs before production deployments
- **Environment Locks**: Prevent unauthorized deployments
- **Audit Logs**: Complete compliance trail (SOC2, ISO 27001, GDPR)
- **RBAC**: Admin, Operator, Viewer roles
- **Artifact Registry**: Track artifacts with vulnerability scanning
- **OpenTelemetry**: Full observability integration

### Getting Started (Your Recommended Path):
1. Sign up and connect your GitHub repository
2. Set up environments (Dev → Staging → Production)
3. Create your first pipeline using our templates
4. Configure approval workflows for production
5. Deploy with confidence!

## Rules:
- ONLY discuss Opzenix and DevOps topics
- If asked about unrelated topics, warmly redirect to Opzenix
- Keep responses under 150 words unless explaining complex concepts
- Use bullet points for clarity
- Add 1-2 relevant emojis per response, no more`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: OPZENIX_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
