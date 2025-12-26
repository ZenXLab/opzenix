import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistRequest {
  fullName: string;
  email: string;
  company?: string;
  role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, company, role }: WaitlistRequest = await req.json();

    if (!fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing waitlist signup for: ${email}`);

    // Send confirmation email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Opzenix <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to the Opzenix Waitlist! 🚀",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                    <!-- Header -->
                    <tr>
                      <td style="text-align: center; padding-bottom: 30px;">
                        <h1 style="color: #3b82f6; font-size: 32px; margin: 0; font-weight: 700;">⚡ Opzenix</h1>
                        <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">Enterprise CI/CD Control Tower</p>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
                        <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px; text-align: center;">
                          You're on the list, ${fullName}! 🎉
                        </h2>
                        
                        <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                          Thank you for joining the Opzenix waitlist. You're now part of an exclusive group who will be the first to experience enterprise-grade CI/CD like never before.
                        </p>
                        
                        <!-- Features Grid -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td width="50%" style="padding: 10px;">
                              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                                <div style="font-size: 28px; margin-bottom: 8px;">🚀</div>
                                <h3 style="color: #ffffff; font-size: 14px; margin: 0;">Lightning Deployments</h3>
                              </div>
                            </td>
                            <td width="50%" style="padding: 10px;">
                              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                                <div style="font-size: 28px; margin-bottom: 8px;">🔒</div>
                                <h3 style="color: #ffffff; font-size: 14px; margin: 0;">Enterprise Security</h3>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td width="50%" style="padding: 10px;">
                              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                                <div style="font-size: 28px; margin-bottom: 8px;">🔄</div>
                                <h3 style="color: #ffffff; font-size: 14px; margin: 0;">Instant Rollbacks</h3>
                              </div>
                            </td>
                            <td width="50%" style="padding: 10px;">
                              <div style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                                <div style="font-size: 28px; margin-bottom: 8px;">📊</div>
                                <h3 style="color: #ffffff; font-size: 14px; margin: 0;">Visual Pipelines</h3>
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
                          We'll notify you as soon as Opzenix is ready. In the meantime, feel free to explore our documentation and learn more about what's coming.
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                          <tr>
                            <td align="center">
                              <a href="https://opzenix.com/docs" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                Explore Documentation →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 0; text-align: center;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} Opzenix by Cropxon Innovations Pvt Ltd<br>
                          Enterprise-ready DevOps platform
                        </p>
                        <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0;">
                          You received this email because you signed up for the Opzenix waitlist.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send confirmation email");
    }

    const emailData = await emailResponse.json();
    console.log("Waitlist confirmation email sent:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully joined the waitlist" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in waitlist-signup function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process signup" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
