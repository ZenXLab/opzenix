import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestCase {
  name: string;
  classname: string;
  time: number;
  status: 'passed' | 'failed' | 'skipped';
  failure?: string;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  time: number;
  testcases: TestCase[];
}

interface ParsedResults {
  suites: TestSuite[];
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { execution_id, report_xml, report_url, test_type = 'unit', coverage_percent } = await req.json();

    console.log(`[parse-test-results] Processing test results for execution: ${execution_id}`);
    console.log(`[parse-test-results] Test type: ${test_type}`);

    if (!execution_id) {
      throw new Error('execution_id is required');
    }

    // Parse JUnit XML format (simplified parsing)
    let parsed: ParsedResults = {
      suites: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };

    if (report_xml) {
      // Simple regex-based XML parsing for JUnit format
      const testsMatch = report_xml.match(/tests="(\d+)"/g);
      const failuresMatch = report_xml.match(/failures="(\d+)"/g);
      const errorsMatch = report_xml.match(/errors="(\d+)"/g);
      const skippedMatch = report_xml.match(/skipped="(\d+)"/g);
      const timeMatch = report_xml.match(/time="([\d.]+)"/g);
      const suiteNameMatch = report_xml.match(/name="([^"]+)"/);

      const extractNumber = (matches: RegExpMatchArray | null, index = 0): number => {
        if (!matches || !matches[index]) return 0;
        const numMatch = matches[index].match(/\d+/);
        return numMatch ? parseInt(numMatch[0], 10) : 0;
      };

      const extractTime = (matches: RegExpMatchArray | null): number => {
        if (!matches || !matches[0]) return 0;
        const timeVal = matches[0].match(/[\d.]+/);
        return timeVal ? parseFloat(timeVal[0]) * 1000 : 0; // Convert to ms
      };

      parsed.totalTests = extractNumber(testsMatch);
      parsed.failed = extractNumber(failuresMatch) + extractNumber(errorsMatch);
      parsed.skipped = extractNumber(skippedMatch);
      parsed.passed = parsed.totalTests - parsed.failed - parsed.skipped;
      parsed.duration = extractTime(timeMatch);

      // Extract test case details
      const testcaseRegex = /<testcase[^>]*name="([^"]*)"[^>]*(?:classname="([^"]*)")?[^>]*(?:time="([\d.]+)")?[^>]*(?:\/>|>([\s\S]*?)<\/testcase>)/g;
      let match;
      const testcases: TestCase[] = [];
      
      while ((match = testcaseRegex.exec(report_xml)) !== null) {
        const tcName = match[1];
        const tcClass = match[2] || 'default';
        const tcTime = match[3] ? parseFloat(match[3]) * 1000 : 0;
        const tcBody = match[4] || '';
        
        let status: 'passed' | 'failed' | 'skipped' = 'passed';
        let failure = undefined;
        
        if (tcBody.includes('<failure') || tcBody.includes('<error')) {
          status = 'failed';
          const failureMatch = tcBody.match(/<(?:failure|error)[^>]*>([\s\S]*?)<\/(?:failure|error)>/);
          failure = failureMatch ? failureMatch[1].trim() : 'Test failed';
        } else if (tcBody.includes('<skipped')) {
          status = 'skipped';
        }

        testcases.push({
          name: tcName,
          classname: tcClass,
          time: tcTime,
          status,
          failure
        });
      }

      parsed.suites = [{
        name: suiteNameMatch ? suiteNameMatch[1] : 'Test Suite',
        tests: parsed.totalTests,
        failures: parsed.failed,
        errors: 0,
        skipped: parsed.skipped,
        time: parsed.duration,
        testcases
      }];

      console.log(`[parse-test-results] Parsed ${parsed.totalTests} tests: ${parsed.passed} passed, ${parsed.failed} failed, ${parsed.skipped} skipped`);
    }

    // Store in database
    const { data, error } = await supabase
      .from('test_results')
      .insert({
        execution_id,
        suite_name: parsed.suites[0]?.name || 'Test Suite',
        test_type,
        total_tests: parsed.totalTests,
        passed: parsed.passed,
        failed: parsed.failed,
        skipped: parsed.skipped,
        duration_ms: Math.round(parsed.duration),
        coverage_percent: coverage_percent || null,
        report_url: report_url || null,
        details: {
          suites: parsed.suites,
          rawTestCount: parsed.totalTests,
          parsedAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[parse-test-results] Database error:', error);
      throw error;
    }

    console.log(`[parse-test-results] Stored test results with ID: ${data.id}`);

    // Also record as CI evidence
    await supabase.from('ci_evidence').insert({
      execution_id,
      step_name: `${test_type.charAt(0).toUpperCase() + test_type.slice(1)} Tests`,
      step_type: 'test',
      step_order: test_type === 'unit' ? 4 : 5,
      status: parsed.failed > 0 ? 'failed' : 'passed',
      summary: `${parsed.passed}/${parsed.totalTests} tests passed`,
      details: {
        passed: parsed.passed,
        failed: parsed.failed,
        skipped: parsed.skipped,
        coverage: coverage_percent
      },
      duration_ms: Math.round(parsed.duration),
      completed_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        data,
        summary: {
          total: parsed.totalTests,
          passed: parsed.passed,
          failed: parsed.failed,
          skipped: parsed.skipped,
          coverage: coverage_percent
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[parse-test-results] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
