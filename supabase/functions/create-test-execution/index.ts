import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestExecutionRequest {
  name?: string;
  environment?: string;
  branch?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: TestExecutionRequest = await req.json().catch(() => ({}));
    const executionName = body.name || `test-execution-${Date.now()}`;
    const environment = body.environment || 'development';
    const branch = body.branch || 'main';

    console.log(`[TestExecution] Creating test execution: ${executionName}`);

    // Create the execution
    const { data: execution, error: execError } = await supabase
      .from('executions')
      .insert({
        name: executionName,
        status: 'running',
        environment,
        branch,
        progress: 0,
        metadata: {
          test: true,
          created_by: 'test-execution-function'
        }
      })
      .select()
      .single();

    if (execError) throw execError;

    console.log(`[TestExecution] Created execution: ${execution.id}`);

    // Define test pipeline stages
    const stages = [
      { id: 'source', label: 'Source Checkout', duration: 2000, isCheckpoint: true },
      { id: 'build', label: 'Build', duration: 5000 },
      { id: 'test', label: 'Unit Tests', duration: 4000 },
      { id: 'security', label: 'Security Scan', duration: 6000, isCheckpoint: true },
      { id: 'approval', label: 'Approval Gate', duration: 3000, isGate: true },
      { id: 'deploy', label: 'Deploy to ' + environment, duration: 5000 },
      { id: 'health', label: 'Health Check', duration: 2000, isCheckpoint: true },
    ];

    // Create all nodes with idle status
    for (const stage of stages) {
      await supabase.from('execution_nodes').insert({
        execution_id: execution.id,
        node_id: stage.id,
        status: 'idle',
        metadata: {
          label: stage.label,
          isCheckpoint: stage.isCheckpoint || false,
          isGate: stage.isGate || false,
        }
      });
    }

    // Start processing stages in the background
    (async () => {
      let progress = 0;
      const progressPerStage = Math.floor(100 / stages.length);

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        
        // Update node to running
        await supabase
          .from('execution_nodes')
          .update({ 
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('execution_id', execution.id)
          .eq('node_id', stage.id);

        // Log start
        await supabase.from('execution_logs').insert({
          execution_id: execution.id,
          node_id: stage.id,
          level: 'info',
          message: `Starting ${stage.label}...`
        });

        // Update execution progress
        progress = Math.min(100, (i + 1) * progressPerStage - progressPerStage / 2);
        await supabase
          .from('executions')
          .update({ progress })
          .eq('id', execution.id);

        // Simulate work with intermediate logs
        const logCount = Math.floor(stage.duration / 1000);
        for (let j = 0; j < logCount; j++) {
          await sleep(1000);
          await supabase.from('execution_logs').insert({
            execution_id: execution.id,
            node_id: stage.id,
            level: 'info',
            message: `[${stage.id}] Processing step ${j + 1}/${logCount}...`
          });
        }

        // Complete the node
        const completedAt = new Date().toISOString();
        await supabase
          .from('execution_nodes')
          .update({ 
            status: 'success',
            completed_at: completedAt,
            duration_ms: stage.duration
          })
          .eq('execution_id', execution.id)
          .eq('node_id', stage.id);

        // Log completion
        await supabase.from('execution_logs').insert({
          execution_id: execution.id,
          node_id: stage.id,
          level: 'info',
          message: `${stage.label} completed successfully`
        });

        // Create checkpoint if applicable
        if (stage.isCheckpoint) {
          await supabase.from('checkpoints').insert({
            execution_id: execution.id,
            node_id: stage.id,
            name: `Checkpoint: ${stage.label}`,
            state: { completed_stages: stages.slice(0, i + 1).map(s => s.id) }
          });
        }

        // Update progress
        progress = Math.min(100, (i + 1) * progressPerStage);
        await supabase
          .from('executions')
          .update({ progress })
          .eq('id', execution.id);
      }

      // Mark execution as complete
      await supabase
        .from('executions')
        .update({ 
          status: 'success',
          progress: 100,
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id);

      // Create deployment record
      await supabase.from('deployments').insert({
        version: `v1.0.${Date.now() % 1000}`,
        environment,
        status: 'success',
        execution_id: execution.id,
        notes: `Deployed from test execution ${executionName}`
      });

      console.log(`[TestExecution] Execution ${execution.id} completed successfully`);
    })();

    // Log to audit
    await supabase.from('audit_logs').insert({
      action: 'create_test_execution',
      resource_type: 'execution',
      resource_id: execution.id,
      details: { name: executionName, environment, branch }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        execution,
        message: `Test execution ${executionName} started. Watch the Execution Flow View for real-time updates.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[TestExecution] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
