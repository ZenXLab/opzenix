import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  acrName?: string;
  aksClusterName?: string;
  aksResourceGroup?: string;
  keyVaultName?: string;
}

interface ValidationResult {
  service: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

async function getAzureToken(tenantId: string, clientId: string, clientSecret: string, scope: string): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: scope,
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Azure token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function validateACR(credentials: AzureCredentials): Promise<ValidationResult> {
  if (!credentials.acrName) {
    return { service: 'ACR', status: 'skipped', message: 'ACR name not provided' };
  }

  const startTime = Date.now();
  
  try {
    const token = await getAzureToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret,
      'https://management.azure.com/.default'
    );

    const acrUrl = `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.ContainerRegistry/registries?api-version=2023-01-01-preview`;
    
    const response = await fetch(acrUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      return {
        service: 'ACR',
        status: 'failed',
        message: `ACR validation failed: ${response.status}`,
        latencyMs,
        details: { error }
      };
    }

    const data = await response.json();
    const registries = data.value || [];
    const targetRegistry = registries.find((r: { name: string }) => 
      r.name.toLowerCase() === credentials.acrName?.toLowerCase()
    );

    if (!targetRegistry) {
      return {
        service: 'ACR',
        status: 'failed',
        message: `Registry '${credentials.acrName}' not found`,
        latencyMs,
        details: { availableRegistries: registries.map((r: { name: string }) => r.name) }
      };
    }

    return {
      service: 'ACR',
      status: 'success',
      message: `Connected to ${credentials.acrName}`,
      latencyMs,
      details: {
        loginServer: targetRegistry.properties?.loginServer,
        sku: targetRegistry.sku?.name,
        location: targetRegistry.location
      }
    };
  } catch (err) {
    const error = err as Error;
    return {
      service: 'ACR',
      status: 'failed',
      message: error.message,
      latencyMs: Date.now() - startTime
    };
  }
}

async function validateAKS(credentials: AzureCredentials): Promise<ValidationResult> {
  if (!credentials.aksClusterName || !credentials.aksResourceGroup) {
    return { service: 'AKS', status: 'skipped', message: 'AKS cluster or resource group not provided' };
  }

  const startTime = Date.now();
  
  try {
    const token = await getAzureToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret,
      'https://management.azure.com/.default'
    );

    const aksUrl = `https://management.azure.com/subscriptions/${credentials.subscriptionId}/resourceGroups/${credentials.aksResourceGroup}/providers/Microsoft.ContainerService/managedClusters/${credentials.aksClusterName}?api-version=2024-01-01`;
    
    const response = await fetch(aksUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      return {
        service: 'AKS',
        status: 'failed',
        message: `AKS validation failed: ${response.status}`,
        latencyMs,
        details: { error }
      };
    }

    const cluster = await response.json();

    return {
      service: 'AKS',
      status: 'success',
      message: `Connected to ${credentials.aksClusterName}`,
      latencyMs,
      details: {
        kubernetesVersion: cluster.properties?.kubernetesVersion,
        powerState: cluster.properties?.powerState?.code,
        nodeCount: cluster.properties?.agentPoolProfiles?.[0]?.count,
        location: cluster.location,
        provisioningState: cluster.properties?.provisioningState
      }
    };
  } catch (err) {
    const error = err as Error;
    return {
      service: 'AKS',
      status: 'failed',
      message: error.message,
      latencyMs: Date.now() - startTime
    };
  }
}

async function validateKeyVault(credentials: AzureCredentials): Promise<ValidationResult> {
  if (!credentials.keyVaultName) {
    return { service: 'Key Vault', status: 'skipped', message: 'Key Vault name not provided' };
  }

  const startTime = Date.now();
  
  try {
    const token = await getAzureToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret,
      'https://vault.azure.net/.default'
    );

    const vaultUrl = `https://${credentials.keyVaultName}.vault.azure.net/secrets?api-version=7.4`;
    
    const response = await fetch(vaultUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      return {
        service: 'Key Vault',
        status: 'failed',
        message: `Key Vault validation failed: ${response.status}`,
        latencyMs,
        details: { error }
      };
    }

    const data = await response.json();
    const secretCount = data.value?.length || 0;

    return {
      service: 'Key Vault',
      status: 'success',
      message: `Connected to ${credentials.keyVaultName}`,
      latencyMs,
      details: {
        vaultUrl: `https://${credentials.keyVaultName}.vault.azure.net`,
        secretsAccessible: secretCount,
        permissionsVerified: true
      }
    };
  } catch (err) {
    const error = err as Error;
    return {
      service: 'Key Vault',
      status: 'failed',
      message: error.message,
      latencyMs: Date.now() - startTime
    };
  }
}

async function validateAuth(credentials: AzureCredentials): Promise<ValidationResult> {
  const startTime = Date.now();
  
  try {
    await getAzureToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret,
      'https://management.azure.com/.default'
    );

    return {
      service: 'Azure AD',
      status: 'success',
      message: 'Authentication successful',
      latencyMs: Date.now() - startTime,
      details: {
        tenantId: credentials.tenantId,
        clientId: credentials.clientId.substring(0, 8) + '...'
      }
    };
  } catch (err) {
    const error = err as Error;
    return {
      service: 'Azure AD',
      status: 'failed',
      message: error.message,
      latencyMs: Date.now() - startTime
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const credentials: AzureCredentials = await req.json();

    console.log('[azure-validate] Starting Azure validation...');

    const [authResult, acrResult, aksResult, keyVaultResult] = await Promise.all([
      validateAuth(credentials),
      validateACR(credentials),
      validateAKS(credentials),
      validateKeyVault(credentials)
    ]);

    const results = [authResult, acrResult, aksResult, keyVaultResult];
    
    const summary = {
      totalServices: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      overallStatus: results.every(r => r.status !== 'failed') ? 'healthy' : 'unhealthy',
      validatedAt: new Date().toISOString()
    };

    console.log('[azure-validate] Validation complete:', summary);

    return new Response(
      JSON.stringify({ results, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const error = err as Error;
    console.error('[azure-validate] Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message, results: [], summary: { overallStatus: 'error' } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
