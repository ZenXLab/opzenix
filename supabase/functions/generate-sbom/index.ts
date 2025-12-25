import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Package {
  name: string;
  version: string;
  type: string;
  license?: string;
  purl?: string;
}

interface SPDXDocument {
  spdxVersion: string;
  dataLicense: string;
  SPDXID: string;
  name: string;
  packages?: Array<{
    name: string;
    versionInfo: string;
    licenseConcluded?: string;
    externalRefs?: Array<{ referenceLocator: string }>;
  }>;
}

interface CycloneDXDocument {
  bomFormat: string;
  specVersion: string;
  components?: Array<{
    name: string;
    version: string;
    type: string;
    licenses?: Array<{ license?: { id?: string } }>;
    purl?: string;
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
      sbom_data, 
      format = 'spdx',
      generator = 'syft',
      sbom_url
    } = await req.json();

    console.log(`[generate-sbom] Processing SBOM for artifact: ${artifact_id}`);
    console.log(`[generate-sbom] Format: ${format}, Generator: ${generator}`);

    if (!artifact_id) {
      throw new Error('artifact_id is required');
    }

    let packages: Package[] = [];
    const licenseSummary: Record<string, number> = {};

    if (sbom_data) {
      // Parse SPDX format
      if (format === 'spdx' && sbom_data.packages) {
        const spdxDoc = sbom_data as SPDXDocument;
        packages = (spdxDoc.packages || []).map(pkg => {
          const license = pkg.licenseConcluded || 'UNKNOWN';
          licenseSummary[license] = (licenseSummary[license] || 0) + 1;
          
          return {
            name: pkg.name,
            version: pkg.versionInfo || 'unknown',
            type: 'library',
            license,
            purl: pkg.externalRefs?.find(r => r.referenceLocator?.startsWith('pkg:'))?.referenceLocator
          };
        });
      }
      
      // Parse CycloneDX format
      if (format === 'cyclonedx' && sbom_data.components) {
        const cdxDoc = sbom_data as CycloneDXDocument;
        packages = (cdxDoc.components || []).map(comp => {
          const license = comp.licenses?.[0]?.license?.id || 'UNKNOWN';
          licenseSummary[license] = (licenseSummary[license] || 0) + 1;
          
          return {
            name: comp.name,
            version: comp.version || 'unknown',
            type: comp.type || 'library',
            license,
            purl: comp.purl
          };
        });
      }

      console.log(`[generate-sbom] Parsed ${packages.length} packages`);
    }

    // Store SBOM entry
    const { data, error } = await supabase
      .from('sbom_entries')
      .insert({
        artifact_id,
        format,
        generator,
        packages: packages.slice(0, 500), // Limit stored packages
        dependencies_count: packages.length,
        license_summary: licenseSummary,
        sbom_url: sbom_url || null
      })
      .select()
      .single();

    if (error) {
      console.error('[generate-sbom] Database error:', error);
      throw error;
    }

    console.log(`[generate-sbom] Stored SBOM with ID: ${data.id}`);

    // Get execution_id from artifact for CI evidence
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('execution_id')
      .eq('id', artifact_id)
      .single();

    if (artifact?.execution_id) {
      await supabase.from('ci_evidence').insert({
        execution_id: artifact.execution_id,
        step_name: 'Generate SBOM',
        step_type: 'build',
        step_order: 6,
        status: 'passed',
        summary: `${packages.length} packages cataloged`,
        details: {
          format,
          generator,
          packageCount: packages.length,
          licenseTypes: Object.keys(licenseSummary).length
        },
        completed_at: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        summary: {
          packageCount: packages.length,
          licenseTypes: Object.keys(licenseSummary).length,
          licenses: licenseSummary,
          format,
          generator
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[generate-sbom] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
