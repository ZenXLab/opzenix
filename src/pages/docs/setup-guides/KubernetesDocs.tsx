import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Cloud, Server, Shield, Terminal, CheckCircle2, 
  AlertTriangle, Settings, Lock, GitBranch, Layers
} from 'lucide-react';

export default function KubernetesDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>Setup Guides</span>
            <span>/</span>
            <span className="text-foreground">Connect Kubernetes (AKS)</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Connect Kubernetes (AKS)</h1>
          <p className="text-lg text-muted-foreground">
            Connect your Azure Kubernetes Service (AKS) cluster to Opzenix for automated deployments, 
            health monitoring, and rollback capabilities.
          </p>
        </div>

        {/* Prerequisites */}
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Prerequisites
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Azure subscription with AKS cluster provisioned
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <code className="px-1.5 py-0.5 rounded bg-muted text-xs">kubectl</code> installed and configured
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Azure CLI authenticated (<code className="px-1.5 py-0.5 rounded bg-muted text-xs">az login</code>)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Opzenix service account created (see below)
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Architecture Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Architecture Overview
          </h2>
          <p className="text-muted-foreground mb-4">
            Opzenix connects to your AKS cluster using a dedicated service account with limited RBAC permissions.
            This ensures secure, auditable deployments without exposing cluster admin credentials.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <Cloud className="w-8 h-8 text-primary mb-2" />
                <h4 className="font-semibold">Azure AKS</h4>
                <p className="text-xs text-muted-foreground">Your Kubernetes cluster</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Lock className="w-8 h-8 text-sec-safe mb-2" />
                <h4 className="font-semibold">RBAC</h4>
                <p className="text-xs text-muted-foreground">Least-privilege access</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Server className="w-8 h-8 text-chart-1 mb-2" />
                <h4 className="font-semibold">Opzenix Agent</h4>
                <p className="text-xs text-muted-foreground">Secure deployment bridge</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Step-by-step Guide */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Step-by-Step Setup</h2>

          <Step number={1} title="Get AKS Credentials">
            <p className="mb-3">First, authenticate kubectl with your AKS cluster:</p>
            <CodeBlock
              title="terminal"
              language="bash"
              code={`# Login to Azure
az login

# Get AKS credentials
az aks get-credentials \\
  --resource-group your-resource-group \\
  --name your-aks-cluster

# Verify connection
kubectl cluster-info`}
            />
          </Step>

          <Step number={2} title="Create Opzenix Namespace">
            <p className="mb-3">Create a dedicated namespace for Opzenix components:</p>
            <CodeBlock
              title="kubectl"
              language="bash"
              code={`kubectl create namespace opzenix-system

# Verify namespace
kubectl get namespaces | grep opzenix`}
            />
          </Step>

          <Step number={3} title="Deploy Service Account with RBAC">
            <p className="mb-3">Create a service account with minimal required permissions:</p>
            <CodeBlock
              title="opzenix-rbac.yaml"
              language="yaml"
              code={`apiVersion: v1
kind: ServiceAccount
metadata:
  name: opzenix-deployer
  namespace: opzenix-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: opzenix-deployer-role
rules:
  # Deployment management
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  # Pod management for health checks
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  # Service management
  - apiGroups: [""]
    resources: ["services"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  # ConfigMaps and Secrets (read-only)
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  # Events for monitoring
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: opzenix-deployer-binding
subjects:
  - kind: ServiceAccount
    name: opzenix-deployer
    namespace: opzenix-system
roleRef:
  kind: ClusterRole
  name: opzenix-deployer-role
  apiGroup: rbac.authorization.k8s.io`}
            />
            <CodeBlock
              title="Apply RBAC configuration"
              language="bash"
              code={`kubectl apply -f opzenix-rbac.yaml`}
            />
          </Step>

          <Step number={4} title="Generate Service Account Token">
            <p className="mb-3">Create a long-lived token for the service account:</p>
            <CodeBlock
              title="opzenix-token.yaml"
              language="yaml"
              code={`apiVersion: v1
kind: Secret
metadata:
  name: opzenix-deployer-token
  namespace: opzenix-system
  annotations:
    kubernetes.io/service-account.name: opzenix-deployer
type: kubernetes.io/service-account-token`}
            />
            <CodeBlock
              title="Apply and retrieve token"
              language="bash"
              code={`# Apply the secret
kubectl apply -f opzenix-token.yaml

# Get the token (base64 decoded)
kubectl get secret opzenix-deployer-token \\
  -n opzenix-system \\
  -o jsonpath='{.data.token}' | base64 -d`}
            />
            
            <Callout type="warning" title="Secure Storage">
              Store this token securely. You'll enter it in Opzenix when configuring the connection.
              Never commit tokens to version control.
            </Callout>
          </Step>

          <Step number={5} title="Get Cluster Endpoint">
            <p className="mb-3">Retrieve your cluster's API server endpoint:</p>
            <CodeBlock
              title="terminal"
              language="bash"
              code={`# Get cluster endpoint
kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'

# Example output: https://your-cluster-abc123.hcp.eastus.azmk8s.io:443`}
            />
          </Step>

          <Step number={6} title="Configure Connection in Opzenix">
            <p className="mb-3">Navigate to <strong>Control Tower → Connections</strong> and add a new Kubernetes connection:</p>
            <div className="space-y-3 mt-4">
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Field</Badge>
                  <span className="font-mono text-sm">Connection Name</span>
                </div>
                <p className="text-xs text-muted-foreground">e.g., "Production AKS Cluster"</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Field</Badge>
                  <span className="font-mono text-sm">Cluster URL</span>
                </div>
                <p className="text-xs text-muted-foreground">The API server endpoint from Step 5</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Field</Badge>
                  <span className="font-mono text-sm">Service Account Token</span>
                </div>
                <p className="text-xs text-muted-foreground">The token retrieved in Step 4</p>
              </div>
            </div>
          </Step>
        </section>

        {/* Validation */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-sec-safe" />
            Validate Connection
          </h2>
          <p className="text-muted-foreground mb-4">
            After adding the connection, Opzenix will automatically validate it. You can also run a manual test:
          </p>
          <CodeBlock
            title="Validation checks"
            language="bash"
            code={`# Test service account permissions
kubectl auth can-i get deployments \\
  --as=system:serviceaccount:opzenix-system:opzenix-deployer

# Expected output: yes

# List accessible namespaces
kubectl get namespaces \\
  --as=system:serviceaccount:opzenix-system:opzenix-deployer`}
          />

          <Callout type="success" title="Connection Validated">
            When validation succeeds, your connection status will show as "Connected" with a green indicator.
            You can now use this cluster in your deployment flows.
          </Callout>
        </section>

        {/* Namespace Targeting */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Namespace Targeting
          </h2>
          <p className="text-muted-foreground mb-4">
            Configure which namespaces Opzenix can deploy to by modifying the RBAC rules:
          </p>
          <CodeBlock
            title="Namespace-scoped Role (more restrictive)"
            language="yaml"
            code={`# For namespace-specific access, use Role instead of ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: opzenix-deployer-role
  namespace: production  # Only this namespace
rules:
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: [""]
    resources: ["pods", "pods/log", "services"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: opzenix-deployer-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: opzenix-deployer
    namespace: opzenix-system
roleRef:
  kind: Role
  name: opzenix-deployer-role
  apiGroup: rbac.authorization.k8s.io`}
          />
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
                <h4 className="font-semibold mb-2">Connection Timeout</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Ensure your AKS cluster's API server is accessible from the internet or configure
                  private endpoint access.
                </p>
                <CodeBlock
                  language="bash"
                  code={`# Check API server accessibility
curl -k https://your-cluster.hcp.eastus.azmk8s.io:443/healthz`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Permission Denied</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Verify the service account has the correct RBAC bindings:
                </p>
                <CodeBlock
                  language="bash"
                  code={`# List all role bindings for the service account
kubectl get rolebindings,clusterrolebindings \\
  --all-namespaces \\
  -o jsonpath='{range .items[?(@.subjects[0].name=="opzenix-deployer")]}{.metadata.name}{"\\n"}{end}'`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Token Expired</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Service account tokens created via Secrets don't expire, but if using short-lived tokens:
                </p>
                <CodeBlock
                  language="bash"
                  code={`# Generate new token
kubectl create token opzenix-deployer \\
  -n opzenix-system \\
  --duration=8760h  # 1 year`}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <GitBranch className="w-6 h-6 text-primary mb-2" />
                <h4 className="font-semibold">Branch → Environment Rules</h4>
                <p className="text-xs text-muted-foreground">Map Git branches to Kubernetes namespaces</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <Shield className="w-6 h-6 text-sec-safe mb-2" />
                <h4 className="font-semibold">Configure Vault</h4>
                <p className="text-xs text-muted-foreground">Secure secrets injection for deployments</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}