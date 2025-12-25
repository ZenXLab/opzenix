import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CVEDetail {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  package: string;
  version: string;
  fixedVersion?: string;
  title: string;
  description?: string;
  publishedDate?: string;
  cvss?: number;
}

interface TrivyResult {
  Target: string;
  Class: string;
  Type: string;
  Vulnerabilities?: Array<{
    VulnerabilityID: string;
    Severity: string;
    PkgName: string;
    InstalledVersion: string;
    FixedVersion?: string;
    Title: string;
    Description?: string;
    PublishedDate?: string;
    CVSS?: { nvd?: { V3Score?: number } };
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      artifact_id, 
      image_ref, 
      scan_results, 
      scan_type = 'image',
      scanner = 'trivy'
    } = await req.json();

    console.log(`[trivy-scan] Processing scan for artifact: ${artifact_id}`);
    console.log(`[trivy-scan] Image reference: ${image_ref}`);
    console.log(`[trivy-scan] Scan type: ${scan_type}, Scanner: ${scanner}`);

    if (!artifact_id) {
      throw new Error('artifact_id is required');
    }

    // Parse Trivy JSON output
    let cveDetails: CVEDetail[] = [];
    let critical = 0, high = 0, medium = 0, low = 0;

    if (scan_results) {
      const results: TrivyResult[] = Array.isArray(scan_results) ? scan_results : [scan_results];
      
      for (const result of results) {
        if (result.Vulnerabilities) {
          for (const vuln of result.Vulnerabilities) {
            const severity = vuln.Severity.toUpperCase() as CVEDetail['severity'];
            
            switch (severity) {
              case 'CRITICAL': critical++; break;
              case 'HIGH': high++; break;
              case 'MEDIUM': medium++; break;
              case 'LOW': low++; break;
            }

            cveDetails.push({
              id: vuln.VulnerabilityID,
              severity,
              package: vuln.PkgName,
              version: vuln.InstalledVersion,
              fixedVersion: vuln.FixedVersion,
              title: vuln.Title,
              description: vuln.Description?.substring(0, 500),
              publishedDate: vuln.PublishedDate,
              cvss: vuln.CVSS?.nvd?.V3Score
            });
          }
        }
      }

      console.log(`[trivy-scan] Found vulnerabilities: ${critical} critical, ${high} high, ${medium} medium, ${low} low`);
    }

    const totalIssues = critical + high + medium + low;
    const scanStatus = critical > 0 ? 'failed' : (high > 5 ? 'warning' : 'completed');

    // Store vulnerability scan results
    const { data, error } = await supabase
      .from('vulnerability_scans')
      .insert({
        artifact_id,
        scan_type,
        scanner,
        scan_status: scanStatus,
        total_issues: totalIssues,
        critical,
        high,
        medium,
        low,
        cve_details: cveDetails.slice(0, 100), // Limit stored CVEs
        scanned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[trivy-scan] Database error:', error);
      throw error;
    }

    console.log(`[trivy-scan] Stored scan results with ID: ${data.id}`);

    // Get execution_id from artifact for CI evidence
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('execution_id')
      .eq('id', artifact_id)
      .single();

    if (artifact?.execution_id) {
      await supabase.from('ci_evidence').insert({
        execution_id: artifact.execution_id,
        step_name: 'Container Image Scan',
        step_type: 'scan',
        step_order: 7,
        status: scanStatus === 'failed' ? 'failed' : 'passed',
        summary: `${totalIssues} vulnerabilities (${critical} critical, ${high} high)`,
        details: {
          critical,
          high,
          medium,
          low,
          total: totalIssues,
          imageRef: image_ref,
          scanner
        },
        completed_at: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        summary: {
          total: totalIssues,
          critical,
          high,
          medium,
          low,
          status: scanStatus,
          blocked: critical > 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[trivy-scan] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
