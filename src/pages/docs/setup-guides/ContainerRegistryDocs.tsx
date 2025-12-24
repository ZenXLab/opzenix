import { DocsLayout, CodeBlock, Callout, Step } from '@/components/docs/DocsLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Package, ArrowRight, CheckCircle2, Shield, Cloud,
  Terminal, AlertTriangle, Lock, Server
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function ContainerRegistryDocs() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <span>/</span>
          <span>Setup Guides</span>
          <span>/</span>
          <span className="text-foreground">Container Registry</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Configure Container Registry</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Connect your container registry to Opzenix for artifact management, 
            image scanning, and deployment tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Badge variant="outline">Setup Guide</Badge>
          <Badge variant="outline" className="bg-sec-warning/10 text-sec-warning border-sec-warning/30">
            15 minutes
          </Badge>
        </div>

        <Separator className="my-8" />

        {/* Supported Registries */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Supported Registries</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Cloud className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Azure Container Registry</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade registry with Azure AD integration, geo-replication, 
                  and built-in vulnerability scanning.
                </p>
                <Badge className="mt-3 bg-sec-safe/20 text-sec-safe">Recommended</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Cloud className="w-6 h-6 text-sec-warning" />
                  <h3 className="font-semibold">Amazon ECR</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fully managed registry with IAM integration, lifecycle policies, 
                  and cross-region replication.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Cloud className="w-6 h-6 text-chart-1" />
                  <h3 className="font-semibold">Google Container Registry</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Fast, private Docker registry built on Google Cloud with 
                  vulnerability scanning via Container Analysis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-6 h-6 text-muted-foreground" />
                  <h3 className="font-semibold">Docker Hub</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  World's largest container registry. Supports public and private 
                  repositories with automated builds.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Azure Container Registry */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Azure Container Registry (ACR)</h2>
          
          <Step number={1} title="Create ACR Instance">
            <p className="mb-4">
              Create an Azure Container Registry in your subscription if you do not have one already.
            </p>
            <CodeBlock
              code={`# Create resource group
az group create --name rg-opzenix --location eastus

# Create ACR instance
az acr create \\
  --resource-group rg-opzenix \\
  --name opzenixacr \\
  --sku Premium \\
  --admin-enabled false

# Enable content trust for image signing
az acr config content-trust update \\
  --registry opzenixacr \\
  --status enabled`}
              language="bash"
              title="Azure CLI"
            />
          </Step>

          <Step number={2} title="Create Service Principal">
            <p className="mb-4">
              Create a service principal with AcrPush role for Opzenix to push and pull images.
            </p>
            <CodeBlock
              code={`# Get ACR resource ID
ACR_ID=$(az acr show --name opzenixacr --query id --output tsv)

# Create service principal with AcrPush role
az ad sp create-for-rbac \\
  --name sp-opzenix-acr \\
  --scopes $ACR_ID \\
  --role AcrPush \\
  --query "{clientId: appId, clientSecret: password, tenantId: tenant}" \\
  --output json`}
              language="bash"
              title="Service Principal Creation"
            />
            <Callout type="warning" title="Save Credentials">
              Save the clientId, clientSecret, and tenantId securely. You will need these 
              to configure the connection in Opzenix.
            </Callout>
          </Step>

          <Step number={3} title="Configure in Opzenix">
            <p className="mb-4">
              Navigate to Control Tower → Connections and add your ACR connection.
            </p>
            <CodeBlock
              code={`{
  "name": "Production ACR",
  "type": "azure-container-registry",
  "config": {
    "registryUrl": "opzenixacr.azurecr.io",
    "tenantId": "your-tenant-id",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  }
}`}
              language="json"
              title="Connection Configuration"
            />
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Amazon ECR */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Amazon ECR</h2>
          
          <Step number={1} title="Create ECR Repository">
            <CodeBlock
              code={`# Create ECR repository
aws ecr create-repository \\
  --repository-name opzenix/app \\
  --image-scanning-configuration scanOnPush=true \\
  --encryption-configuration encryptionType=AES256

# Enable lifecycle policy for cleanup
aws ecr put-lifecycle-policy \\
  --repository-name opzenix/app \\
  --lifecycle-policy-text file://lifecycle-policy.json`}
              language="bash"
              title="AWS CLI"
            />
          </Step>

          <Step number={2} title="Create IAM User">
            <CodeBlock
              code={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:ListImages"
      ],
      "Resource": "*"
    }
  ]
}`}
              language="json"
              title="IAM Policy"
            />
          </Step>

          <Step number={3} title="Configure in Opzenix">
            <CodeBlock
              code={`{
  "name": "Production ECR",
  "type": "amazon-ecr",
  "config": {
    "region": "us-east-1",
    "registryId": "123456789012",
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  }
}`}
              language="json"
              title="Connection Configuration"
            />
          </Step>
        </section>

        <Separator className="my-8" />

        {/* Image Scanning */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Image Scanning Integration</h2>
          <p className="text-muted-foreground mb-4">
            Opzenix integrates with registry-native scanning to block deployments with critical vulnerabilities.
          </p>
          
          <CodeBlock
            code={`# Flow template with security gate
{
  "name": "Secure Deployment Pipeline",
  "nodes": [
    {
      "id": "build",
      "type": "build",
      "name": "Build Image"
    },
    {
      "id": "push",
      "type": "artifact",
      "name": "Push to Registry"
    },
    {
      "id": "scan",
      "type": "security",
      "name": "Vulnerability Scan",
      "config": {
        "failOn": ["CRITICAL", "HIGH"],
        "timeout": 300
      }
    },
    {
      "id": "deploy",
      "type": "deploy",
      "name": "Deploy to Kubernetes"
    }
  ],
  "edges": [
    { "source": "build", "target": "push" },
    { "source": "push", "target": "scan" },
    { "source": "scan", "target": "deploy" }
  ]
}`}
            language="json"
            title="Security-Gated Pipeline"
          />

          <Callout type="success" title="Best Practice">
            Always enable scan-on-push and configure Opzenix to fail deployments with 
            CRITICAL or HIGH severity vulnerabilities. This creates a security gate 
            in your pipeline.
          </Callout>
        </section>

        <Separator className="my-8" />

        {/* Artifact Tracking */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Artifact Tracking</h2>
          <p className="text-muted-foreground mb-4">
            Opzenix automatically tracks all artifacts pushed during pipeline execution:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold">Image Digest</h4>
              <p className="text-sm text-muted-foreground">SHA256 digest for immutable references</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold">Build Metadata</h4>
              <p className="text-sm text-muted-foreground">Commit SHA, branch, build duration</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <CheckCircle2 className="w-5 h-5 text-sec-safe mb-2" />
              <h4 className="font-semibold">Scan Results</h4>
              <p className="text-sm text-muted-foreground">Vulnerability counts by severity</p>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link 
              to="/docs/setup-guides/kubernetes"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-primary" />
                <span className="font-medium">Connect Kubernetes Cluster</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              to="/docs/setup-guides/vault"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <span className="font-medium">Configure Secret Management</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </section>
      </div>
    </DocsLayout>
  );
}

export default ContainerRegistryDocs;
