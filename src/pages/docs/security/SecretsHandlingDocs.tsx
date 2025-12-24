import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Key, ArrowRight, CheckCircle2, Shield, Lock,
  Eye, EyeOff, RefreshCw, AlertTriangle, Server
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function SecretsHandlingDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Security</span>
          <span>/</span>
          <span className="text-foreground">Secrets Handling</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Secrets Handling</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Secure management of credentials, API keys, and sensitive configuration 
            throughout the deployment lifecycle.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Security Principles */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Security Principles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <EyeOff className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold">Never Stored in Code</h4>
                <p className="text-sm text-muted-foreground">
                  Secrets are never committed to repositories or stored in plain text configuration files.
                </p>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <Lock className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold">Encrypted at Rest</h4>
                <p className="text-sm text-muted-foreground">
                  All secrets are encrypted using AES-256 before storage in the database.
                </p>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <Shield className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold">Encrypted in Transit</h4>
                <p className="text-sm text-muted-foreground">
                  TLS 1.3 for all API communications. No secrets exposed in logs or errors.
                </p>
              </CardContent>
            </Card>

            <Card className="border-sec-safe/30">
              <CardContent className="p-4">
                <Eye className="w-5 h-5 text-sec-safe mb-2" />
                <h4 className="font-semibold">Audited Access</h4>
                <p className="text-sm text-muted-foreground">
                  Every secret access is logged with user, timestamp, and purpose.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Secret Types */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Secret Types</h2>
          
          <div className="space-y-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary">Connection</Badge>
                <span className="font-medium">Integration Credentials</span>
              </div>
              <p className="text-sm text-muted-foreground">
                GitHub tokens, Azure service principals, Kubernetes kubeconfigs, registry credentials.
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-sec-warning/20 text-sec-warning">Environment</Badge>
                <span className="font-medium">Runtime Secrets</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Database passwords, API keys, encryption keys injected into deployments.
              </p>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-chart-1/20 text-chart-1">Reference</Badge>
                <span className="font-medium">External Vault References</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pointers to secrets stored in HashiCorp Vault, Azure Key Vault, or AWS Secrets Manager.
              </p>
            </div>
          </div>
        </section>

        {/* Managing Secrets */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Managing Secrets</h2>
          
          <Step number={1} title="Create Secret Reference">
            <p className="mb-4">
              Create a secret reference that points to where the secret value is stored.
            </p>
            <CodeBlock
              code={`{
  "ref_key": "database-password-prod",
  "provider": "vault",
  "scope": "production",
  "description": "Production PostgreSQL password",
  "path": "secret/data/prod/database",
  "key": "password"
}`}
              language="json"
              title="Secret Reference"
            />
          </Step>

          <Step number={2} title="Use in Flow Templates">
            <p className="mb-4">
              Reference secrets in your flow templates using the secret reference syntax.
            </p>
            <CodeBlock
              code={`{
  "id": "deploy-node",
  "type": "deploy",
  "config": {
    "environment": "production",
    "secrets": [
      {
        "name": "DB_PASSWORD",
        "ref": "secret://database-password-prod"
      },
      {
        "name": "API_KEY",
        "ref": "secret://api-key-prod"
      }
    ]
  }
}`}
              language="json"
              title="Secret Usage in Flow"
            />
          </Step>

          <Step number={3} title="Inject at Runtime">
            <p className="mb-4">
              Secrets are fetched and injected at deployment time, never stored in execution logs.
            </p>
            <CodeBlock
              code={`# Opzenix fetches secret at deploy time
[2025-01-15 14:30:00] Fetching secret: database-password-prod
[2025-01-15 14:30:00] Secret fetched successfully (value redacted)
[2025-01-15 14:30:01] Injecting as environment variable: DB_PASSWORD=***
[2025-01-15 14:30:01] Deployment proceeding with 2 secrets injected`}
              language="bash"
              title="Runtime Injection Log"
            />
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Vault Integration */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">External Vault Integration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Server className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold">HashiCorp Vault</h4>
                <p className="text-xs text-muted-foreground">KV, Transit, PKI</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Server className="w-8 h-8 mx-auto mb-2 text-chart-1" />
                <h4 className="font-semibold">Azure Key Vault</h4>
                <p className="text-xs text-muted-foreground">Secrets, Keys, Certs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Server className="w-8 h-8 mx-auto mb-2 text-sec-warning" />
                <h4 className="font-semibold">AWS Secrets Manager</h4>
                <p className="text-xs text-muted-foreground">Secrets, Rotation</p>
              </CardContent>
            </Card>
          </div>

          <CodeBlock
            code={`{
  "vaultConnections": [
    {
      "name": "production-vault",
      "provider": "hashicorp",
      "address": "https://vault.company.com:8200",
      "authMethod": "kubernetes",
      "role": "opzenix-reader",
      "namespace": "production"
    },
    {
      "name": "azure-keyvault",
      "provider": "azure",
      "vaultUrl": "https://company-kv.vault.azure.net/",
      "tenantId": "tenant-uuid",
      "clientId": "client-uuid",
      "useManagedIdentity": true
    }
  ]
}`}
            language="json"
            title="Vault Connection Configuration"
          />
        </section>

        {/* Secret Rotation */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Secret Rotation</h2>
          <p className="text-muted-foreground mb-4">
            Opzenix supports automatic secret rotation with zero-downtime updates.
          </p>
          
          <CodeBlock
            code={`{
  "secretRotation": {
    "enabled": true,
    "secrets": [
      {
        "ref": "database-password-prod",
        "rotationSchedule": "0 0 1 * *",
        "rotationStrategy": "gradual",
        "preRotationHook": "notify-team",
        "postRotationHook": "update-deployments"
      }
    ],
    "notifications": {
      "onRotationStart": ["security-team@company.com"],
      "onRotationComplete": ["devops@company.com"],
      "onRotationFailure": ["oncall@company.com"]
    }
  }
}`}
            language="json"
            title="Rotation Configuration"
          />

          <Callout type="info" title="Gradual Rotation">
            Gradual rotation deploys new secrets alongside old ones, allowing existing 
            connections to drain before the old secret is invalidated.
          </Callout>
        </section>

        {/* Best Practices */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          
          <div className="space-y-3">
            <Callout type="success" title="Use External Vaults">
              Store secrets in external vault solutions rather than Opzenix internal storage 
              for maximum security and rotation capabilities.
            </Callout>

            <Callout type="warning" title="Scope Secrets Properly">
              Use environment-specific secret references. Never share production secrets 
              with development or staging environments.
            </Callout>

            <Callout type="info" title="Rotate Regularly">
              Enable automatic rotation for all secrets. Recommended: 90 days for service 
              accounts, 30 days for high-privilege credentials.
            </Callout>
          </div>
        </section>

        {/* Secret Audit */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Secret Access Audit</h2>
          
          <CodeBlock
            code={`{
  "auditEntry": {
    "action": "secret.access",
    "secretRef": "database-password-prod",
    "accessor": {
      "type": "execution",
      "executionId": "exec-123",
      "triggeredBy": "admin@company.com"
    },
    "timestamp": "2025-01-15T14:30:00Z",
    "purpose": "deployment",
    "environment": "production",
    "result": "success",
    "secretVersion": "v3"
  }
}`}
            language="json"
            title="Secret Access Audit Log"
          />
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/setup-guides/vault"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <span className="font-medium">Configure Vault Integration</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/security/compliance-mapping"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium">Compliance Mapping</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default SecretsHandlingDocs;
