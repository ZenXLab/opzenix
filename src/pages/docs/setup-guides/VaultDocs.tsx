import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lock, Key, Shield, Terminal, CheckCircle2, 
  AlertTriangle, Settings, RefreshCcw, FileCode, Database
} from 'lucide-react';

export default function VaultDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>Setup Guides</span>
            <span>/</span>
            <span className="text-foreground">Configure Vault</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Configure Vault Integration</h1>
          <p className="text-lg text-muted-foreground">
            Securely inject secrets into your deployments using HashiCorp Vault or Azure Key Vault.
            Opzenix fetches secrets at deploy-time, ensuring credentials never touch CI logs.
          </p>
        </div>

        {/* Supported Providers */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Supported Vault Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">HashiCorp Vault</h3>
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Industry-standard secrets management with dynamic secrets, 
                  leasing, and automatic rotation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                    <Key className="w-6 h-6 text-chart-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Azure Key Vault</h3>
                    <Badge variant="outline" className="text-xs">Native Azure</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Microsoft's managed secrets service with HSM backing 
                  and Azure AD integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* HashiCorp Vault Setup */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            HashiCorp Vault Setup
          </h2>

          <Step number={1} title="Enable AppRole Authentication">
            <p className="mb-3">AppRole is the recommended auth method for machine-to-machine authentication:</p>
            <CodeBlock
              title="Enable AppRole"
              language="bash"
              code={`# Enable AppRole auth method
vault auth enable approle

# Verify
vault auth list`}
            />
          </Step>

          <Step number={2} title="Create Secrets Policy">
            <p className="mb-3">Define a policy that grants read access to your application secrets:</p>
            <CodeBlock
              title="opzenix-policy.hcl"
              language="hcl"
              code={`# opzenix-policy.hcl
# Read access to application secrets
path "secret/data/opzenix/*" {
  capabilities = ["read", "list"]
}

# Read access to database credentials
path "database/creds/opzenix-*" {
  capabilities = ["read"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow token lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}`}
            />
            <CodeBlock
              title="Apply policy"
              language="bash"
              code={`vault policy write opzenix-deployer opzenix-policy.hcl`}
            />
          </Step>

          <Step number={3} title="Create AppRole for Opzenix">
            <p className="mb-3">Create an AppRole with the deployment policy attached:</p>
            <CodeBlock
              title="Create AppRole"
              language="bash"
              code={`# Create the AppRole
vault write auth/approle/role/opzenix-deployer \\
  token_policies="opzenix-deployer" \\
  token_ttl=1h \\
  token_max_ttl=4h \\
  secret_id_ttl=720h \\
  secret_id_num_uses=0

# Get the Role ID
vault read auth/approle/role/opzenix-deployer/role-id
# Output: role_id    abc12345-6789-def0-1234-567890abcdef

# Generate a Secret ID
vault write -f auth/approle/role/opzenix-deployer/secret-id
# Output: secret_id    xyz98765-4321-0fed-9876-543210fedcba`}
            />

            <Callout type="warning" title="Store Credentials Securely">
              Save both the <code>role_id</code> and <code>secret_id</code>. 
              You'll enter these in Opzenix. The secret_id should be rotated periodically.
            </Callout>
          </Step>

          <Step number={4} title="Store Application Secrets">
            <p className="mb-3">Store your application secrets in Vault:</p>
            <CodeBlock
              title="Store secrets"
              language="bash"
              code={`# Store database credentials
vault kv put secret/opzenix/production \\
  DB_HOST="prod-db.example.com" \\
  DB_USER="app_user" \\
  DB_PASSWORD="super-secret-password" \\
  API_KEY="sk_live_abc123"

# Store staging credentials
vault kv put secret/opzenix/staging \\
  DB_HOST="staging-db.example.com" \\
  DB_USER="staging_user" \\
  DB_PASSWORD="staging-password" \\
  API_KEY="sk_test_xyz789"

# Verify secrets
vault kv get secret/opzenix/production`}
            />
          </Step>

          <Step number={5} title="Configure in Opzenix">
            <p className="mb-3">Add the Vault connection in Opzenix Control Tower:</p>
            <div className="space-y-3 mt-4">
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Vault URL</Badge>
                <p className="font-mono text-sm">https://vault.example.com:8200</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Auth Method</Badge>
                <p className="font-mono text-sm">AppRole</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Role ID</Badge>
                <p className="font-mono text-sm">abc12345-6789-def0-1234-567890abcdef</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Secret ID</Badge>
                <p className="font-mono text-sm">••••••••••••••••</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Secrets Path</Badge>
                <p className="font-mono text-sm">secret/data/opzenix/$&#123;environment&#125;</p>
              </div>
            </div>
          </Step>
        </section>

        {/* Azure Key Vault Setup */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Key className="w-6 h-6 text-chart-1" />
            Azure Key Vault Setup
          </h2>

          <Step number={1} title="Create Key Vault">
            <p className="mb-3">Create an Azure Key Vault if you don't have one:</p>
            <CodeBlock
              title="Azure CLI"
              language="bash"
              code={`# Create resource group (if needed)
az group create \\
  --name opzenix-secrets-rg \\
  --location eastus

# Create Key Vault
az keyvault create \\
  --name opzenix-secrets-kv \\
  --resource-group opzenix-secrets-rg \\
  --location eastus \\
  --sku standard

# Verify
az keyvault show --name opzenix-secrets-kv`}
            />
          </Step>

          <Step number={2} title="Create Service Principal">
            <p className="mb-3">Create a service principal for Opzenix to authenticate:</p>
            <CodeBlock
              title="Create Service Principal"
              language="bash"
              code={`# Create service principal
az ad sp create-for-rbac \\
  --name opzenix-kv-reader \\
  --role "Key Vault Secrets User" \\
  --scopes /subscriptions/{subscription-id}/resourceGroups/opzenix-secrets-rg/providers/Microsoft.KeyVault/vaults/opzenix-secrets-kv

# Output:
# {
#   "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
#   "displayName": "opzenix-kv-reader",
#   "password": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
#   "tenant": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# }`}
            />
          </Step>

          <Step number={3} title="Set Access Policies">
            <p className="mb-3">Grant the service principal access to read secrets:</p>
            <CodeBlock
              title="Set access policy"
              language="bash"
              code={`az keyvault set-policy \\
  --name opzenix-secrets-kv \\
  --spn {appId-from-previous-step} \\
  --secret-permissions get list`}
            />
          </Step>

          <Step number={4} title="Store Secrets">
            <p className="mb-3">Add your application secrets to Key Vault:</p>
            <CodeBlock
              title="Store secrets"
              language="bash"
              code={`# Store production secrets
az keyvault secret set \\
  --vault-name opzenix-secrets-kv \\
  --name "PROD-DB-PASSWORD" \\
  --value "super-secret-password"

az keyvault secret set \\
  --vault-name opzenix-secrets-kv \\
  --name "PROD-API-KEY" \\
  --value "sk_live_abc123"

# List secrets
az keyvault secret list --vault-name opzenix-secrets-kv`}
            />
          </Step>

          <Step number={5} title="Configure in Opzenix">
            <p className="mb-3">Add the Azure Key Vault connection:</p>
            <div className="space-y-3 mt-4">
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Vault URL</Badge>
                <p className="font-mono text-sm">https://opzenix-secrets-kv.vault.azure.net</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Tenant ID</Badge>
                <p className="font-mono text-sm">xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Client ID</Badge>
                <p className="font-mono text-sm">xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <Badge variant="outline" className="text-xs mb-2">Client Secret</Badge>
                <p className="font-mono text-sm">••••••••••••••••</p>
              </div>
            </div>
          </Step>
        </section>

        {/* Using Secrets in Deployments */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileCode className="w-6 h-6 text-primary" />
            Using Secrets in Deployments
          </h2>
          
          <p className="text-muted-foreground mb-4">
            Reference vault secrets in your Kubernetes manifests using Opzenix templating:
          </p>

          <CodeBlock
            title="deployment.yaml"
            language="yaml"
            code={`apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest
          env:
            # Direct vault reference
            - name: DB_PASSWORD
              value: "{{ vault "secret/opzenix/production" "DB_PASSWORD" }}"
            
            # Using environment variable
            - name: API_KEY
              value: "{{ vault "secret/opzenix/\${ENVIRONMENT}" "API_KEY" }}"
            
            # With default fallback
            - name: LOG_LEVEL
              value: "{{ vault "secret/opzenix/config" "LOG_LEVEL" | default "info" }}"`}
          />

          <Callout type="info" title="Secret Injection">
            Opzenix injects secrets at deploy-time. The actual secret values never appear 
            in Git, CI logs, or audit trails - only the vault references are stored.
          </Callout>
        </section>

        {/* Secret Rotation */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <RefreshCcw className="w-6 h-6 text-sec-safe" />
            Secret Rotation
          </h2>
          
          <p className="text-muted-foreground mb-4">
            Best practices for rotating secrets without downtime:
          </p>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-primary" />
                  Database Credentials
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use Vault's dynamic secrets for automatic credential rotation:
                </p>
                <CodeBlock
                  language="bash"
                  code={`# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/postgres \\
  plugin_name=postgresql-database-plugin \\
  connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/mydb" \\
  allowed_roles="opzenix-app"

# Create role with auto-rotation
vault write database/roles/opzenix-app \\
  db_name=postgres \\
  creation_statements="CREATE ROLE \\"{{name}}\\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';" \\
  default_ttl="1h" \\
  max_ttl="24h"`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-sec-warning" />
                  API Keys
                </h4>
                <p className="text-sm text-muted-foreground">
                  For static API keys, implement a dual-key strategy: keep both old and new 
                  keys valid during rotation, update Vault, then revoke the old key.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-sec-warning" />
            Troubleshooting
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Permission Denied</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Verify the policy is correctly attached:
                </p>
                <CodeBlock
                  language="bash"
                  code={`# Check token policies
vault token lookup

# Test read access
vault kv get secret/opzenix/production`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Secret Not Found</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Ensure you're using the correct path format:
                </p>
                <CodeBlock
                  language="bash"
                  code={`# KV v2 uses 'data' in the path for reads
# Correct: secret/data/opzenix/production
# Wrong:   secret/opzenix/production

vault kv get -field=DB_PASSWORD secret/opzenix/production`}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Security Best Practices */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-sec-safe" />
            Security Best Practices
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold text-sm">Least Privilege</h4>
                <p className="text-xs text-muted-foreground">
                  Grant only read access to specific paths needed for each environment.
                </p>
              </CardContent>
            </Card>
            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold text-sm">Audit Logging</h4>
                <p className="text-xs text-muted-foreground">
                  Enable Vault audit logging to track all secret access.
                </p>
              </CardContent>
            </Card>
            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold text-sm">Short TTLs</h4>
                <p className="text-xs text-muted-foreground">
                  Use short token TTLs and enable automatic renewal.
                </p>
              </CardContent>
            </Card>
            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold text-sm">Namespace Isolation</h4>
                <p className="text-xs text-muted-foreground">
                  Use separate Vault namespaces for prod/non-prod secrets.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}