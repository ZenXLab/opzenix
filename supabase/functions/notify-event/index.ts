import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, target, payload, targets } = await req.json();

    console.log(`[notify-event] Creating notification: ${type}`);

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Support both single target and multiple targets
    const notificationTargets = targets || (target ? [target] : ['system']);
    
    const notifications = notificationTargets.map((t: string) => ({
      type,
      target: t,
      payload: payload || {},
      status: 'sent'
    }));

    // Insert notifications
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notification_events')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('[notify-event] Error inserting notifications:', insertError);
      throw insertError;
    }

    console.log(`[notify-event] Created ${insertedNotifications.length} notifications`);

    // Handle specific notification types with additional actions
    switch (type) {
      case 'execution_failed':
        console.log('[notify-event] Processing execution failure notification');
        // Could trigger external integrations here (Slack, PagerDuty, etc.)
        break;

      case 'approval_required':
        console.log('[notify-event] Processing approval required notification');
        break;

      case 'deployment_completed':
        console.log('[notify-event] Processing deployment completion notification');
        break;

      case 'checkpoint_created':
        console.log('[notify-event] Processing checkpoint creation notification');
        break;

      default:
        console.log(`[notify-event] Standard notification type: ${type}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications: insertedNotifications,
        count: insertedNotifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[notify-event] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
