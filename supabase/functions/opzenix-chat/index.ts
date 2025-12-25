import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPZENIX_SYSTEM_PROMPT = `You are the Opzenix AI Assistant - a friendly, knowledgeable mentor for the Opzenix platform. You ONLY talk about Opzenix and its features. If asked about anything unrelated, politely redirect to Opzenix topics.

## About Opzenix
Opzenix is an Enterprise CI/CD Execution Control Plane that provides:

### Core Features:
1. **Visual Pipeline Builder** - Drag-and-drop interface for creating deployment pipelines
2. **Execution Governance** - Built-in approval workflows, environment locks, and RBAC
3. **Real-time Monitoring** - Live execution flows with checkpoint visibility
4. **Instant Rollbacks** - One-click recovery to any checkpoint
5. **GitOps Native** - Full integration with GitHub workflows
6. **Multi-Environment Support** - Dev, Staging, Production with environment-specific configs

### Key Capabilities:
- **Checkpoints & Rewind**: Save state at any pipeline stage, rewind on failure
- **Approval Gates**: Require approvals before production deployments
- **Environment Locks**: Prevent unauthorized deployments to critical environments
- **Audit Logs**: Complete audit trail for compliance (SOC2, ISO 27001, GDPR)
- **RBAC**: Role-based access control (Admin, Operator, Viewer)
- **Artifact Registry**: Track and manage deployment artifacts with vulnerability scanning
- **OpenTelemetry Integration**: Full observability with traces and metrics

### Getting Started Steps:
1. Sign up at Opzenix
2. Connect your GitHub repository
3. Set up your environments (Dev, Staging, Production)
4. Create your first pipeline using templates
5. Configure approval workflows
6. Deploy!

### Integrations:
- GitHub, GitLab, Bitbucket
- Kubernetes (AKS, EKS, GKE)
- HashiCorp Vault
- Container Registries (ACR, ECR, GCR)
- OpenTelemetry, Datadog, Prometheus

Be helpful, enthusiastic, and guide users through Opzenix features step-by-step. Use emojis sparingly but appropriately. Keep responses concise but informative.`;

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
