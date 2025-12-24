import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Code, Terminal, Copy, CheckCircle2, Globe, Shield, Key,
  ChevronRight, ExternalLink, Zap, Database, Webhook, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import DocsLayout, { CodeBlock, Callout } from '@/components/docs/DocsLayout';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  example: { request: string; response: string };
}

const endpoints: Record<string, Endpoint[]> = {
  'Executions': [
    {
      method: 'GET',
      path: '/api/v1/executions',
      description: 'List all executions with optional filtering',
      auth: true,
      params: [
        { name: 'status', type: 'string', required: false, description: 'Filter by status (running, success, failed)' },
        { name: 'environment', type: 'string', required: false, description: 'Filter by environment' },
        { name: 'limit', type: 'number', required: false, description: 'Maximum results (default: 50)' },
        { name: 'offset', type: 'number', required: false, description: 'Pagination offset' },
      ],
      response: 'ExecutionList',
      example: {
        request: `curl -X GET "https://api.opzenix.com/v1/executions?status=running" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        response: `{
  "data": [
    {
      "id": "exec_abc123",
      "name": "Production Deploy",
      "status": "running",
      "environment": "production",
      "progress": 65,
      "started_at": "2025-01-15T10:30:00Z",
      "flow_template_id": "flow_xyz789"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 50,
    "offset": 0
  }
}`,
      },
    },
    {
      method: 'POST',
      path: '/api/v1/executions',
      description: 'Create and start a new execution',
      auth: true,
      body: [
        { name: 'flow_template_id', type: 'string', required: true, description: 'ID of the flow template to execute' },
        { name: 'name', type: 'string', required: true, description: 'Execution name' },
        { name: 'environment', type: 'string', required: true, description: 'Target environment' },
        { name: 'branch', type: 'string', required: false, description: 'Git branch to deploy' },
        { name: 'commit_hash', type: 'string', required: false, description: 'Specific commit SHA' },
      ],
      response: 'Execution',
      example: {
        request: `curl -X POST "https://api.opzenix.com/v1/executions" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flow_template_id": "flow_xyz789",
    "name": "Release v2.5.0",
    "environment": "production",
    "branch": "main"
  }'`,
        response: `{
  "id": "exec_def456",
  "name": "Release v2.5.0",
  "status": "running",
  "environment": "production",
  "branch": "main",
  "progress": 0,
  "started_at": "2025-01-15T10:35:00Z"
}`,
      },
    },
    {
      method: 'GET',
      path: '/api/v1/executions/:id',
      description: 'Get execution details by ID',
      auth: true,
      params: [
        { name: 'id', type: 'string', required: true, description: 'Execution ID' },
      ],
      response: 'ExecutionDetail',
      example: {
        request: `curl -X GET "https://api.opzenix.com/v1/executions/exec_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        response: `{
  "id": "exec_abc123",
  "name": "Production Deploy",
  "status": "success",
  "environment": "production",
  "progress": 100,
  "started_at": "2025-01-15T10:30:00Z",
  "completed_at": "2025-01-15T10:35:42Z",
  "nodes": [
    { "id": "build", "status": "success", "duration_ms": 45200 },
    { "id": "test", "status": "success", "duration_ms": 89100 },
    { "id": "deploy", "status": "success", "duration_ms": 32500 }
  ],
  "checkpoints": [
    { "id": "cp_001", "node_id": "build", "created_at": "2025-01-15T10:30:45Z" }
  ]
}`,
      },
    },
    {
      method: 'POST',
      path: '/api/v1/executions/:id/cancel',
      description: 'Cancel a running execution',
      auth: true,
      params: [
        { name: 'id', type: 'string', required: true, description: 'Execution ID' },
      ],
      response: 'Execution',
      example: {
        request: `curl -X POST "https://api.opzenix.com/v1/executions/exec_abc123/cancel" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        response: `{
  "id": "exec_abc123",
  "status": "cancelled",
  "cancelled_at": "2025-01-15T10:32:00Z",
  "cancelled_by": "user_123"
}`,
      },
    },
  ],
  'Checkpoints': [
    {
      method: 'GET',
      path: '/api/v1/checkpoints',
      description: 'List checkpoints for an execution',
      auth: true,
      params: [
        { name: 'execution_id', type: 'string', required: true, description: 'Filter by execution ID' },
      ],
      response: 'CheckpointList',
      example: {
        request: `curl -X GET "https://api.opzenix.com/v1/checkpoints?execution_id=exec_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        response: `{
  "data": [
    {
      "id": "cp_001",
      "name": "After Build",
      "node_id": "build",
      "execution_id": "exec_abc123",
      "created_at": "2025-01-15T10:30:45Z",
      "state": { "artifacts": ["image:v2.5.0"] }
    }
  ]
}`,
      },
    },
    {
      method: 'POST',
      path: '/api/v1/checkpoints/:id/restore',
      description: 'Restore execution from a checkpoint',
      auth: true,
      params: [
        { name: 'id', type: 'string', required: true, description: 'Checkpoint ID' },
      ],
      body: [
        { name: 'new_execution_name', type: 'string', required: false, description: 'Name for the new execution' },
      ],
      response: 'Execution',
      example: {
        request: `curl -X POST "https://api.opzenix.com/v1/checkpoints/cp_001/restore" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "new_execution_name": "Recovery from cp_001" }'`,
        response: `{
  "id": "exec_recovery_001",
  "name": "Recovery from cp_001",
  "status": "running",
  "restored_from_checkpoint": "cp_001",
  "started_at": "2025-01-15T10:40:00Z"
}`,
      },
    },
  ],
  'Environments': [
    {
      method: 'GET',
      path: '/api/v1/environments',
      description: 'List all environments',
      auth: true,
      response: 'EnvironmentList',
      example: {
        request: `curl -X GET "https://api.opzenix.com/v1/environments" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        response: `{
  "data": [
    {
      "id": "env_dev",
      "name": "development",
      "is_locked": false,
      "requires_approval": false,
      "last_deployment": "2025-01-15T09:00:00Z"
    },
    {
      "id": "env_prod",
      "name": "production",
      "is_locked": false,
      "requires_approval": true,
      "required_approvals": 2,
      "last_deployment": "2025-01-14T18:00:00Z"
    }
  ]
}`,
      },
    },
    {
      method: 'POST',
      path: '/api/v1/environments/:id/lock',
      description: 'Lock an environment to prevent deployments',
      auth: true,
      params: [
        { name: 'id', type: 'string', required: true, description: 'Environment ID' },
      ],
      body: [
        { name: 'reason', type: 'string', required: true, description: 'Lock reason' },
      ],
      response: 'Environment',
      example: {
        request: `curl -X POST "https://api.opzenix.com/v1/environments/env_prod/lock" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "reason": "Maintenance window 2025-01-15" }'`,
        response: `{
  "id": "env_prod",
  "name": "production",
  "is_locked": true,
  "lock_reason": "Maintenance window 2025-01-15",
  "locked_by": "user_123",
  "locked_at": "2025-01-15T10:00:00Z"
}`,
      },
    },
  ],
  'Approvals': [
    {
      method: 'GET',
      path: '/api/v1/approvals',
      description: 'List pending approval requests',
      auth: true,
      params: [
        { name: 'status', type: 'string', required: false, description: 'Filter by status (pending, approved, rejected)' },
      ],
      response: 'ApprovalList',
      example: {
        request: `curl -X GET "https://api.opzenix.com/v1/approvals?status=pending" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        response: `{
  "data": [
    {
      "id": "apr_001",
      "title": "Production Deployment",
      "execution_id": "exec_abc123",
      "status": "pending",
      "required_approvals": 2,
      "current_approvals": 1,
      "requested_by": "user_456",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}`,
      },
    },
    {
      method: 'POST',
      path: '/api/v1/approvals/:id/vote',
      description: 'Submit an approval vote',
      auth: true,
      params: [
        { name: 'id', type: 'string', required: true, description: 'Approval request ID' },
      ],
      body: [
        { name: 'vote', type: 'boolean', required: true, description: 'true to approve, false to reject' },
        { name: 'comment', type: 'string', required: false, description: 'Optional comment' },
      ],
      response: 'ApprovalRequest',
      example: {
        request: `curl -X POST "https://api.opzenix.com/v1/approvals/apr_001/vote" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "vote": true, "comment": "LGTM, tested in staging" }'`,
        response: `{
  "id": "apr_001",
  "status": "approved",
  "current_approvals": 2,
  "resolved_at": "2025-01-15T10:35:00Z"
}`,
      },
    },
  ],
  'Webhooks': [
    {
      method: 'POST',
      path: '/api/v1/webhooks',
      description: 'Create a webhook endpoint',
      auth: true,
      body: [
        { name: 'url', type: 'string', required: true, description: 'Webhook URL' },
        { name: 'events', type: 'string[]', required: true, description: 'Events to subscribe to' },
        { name: 'secret', type: 'string', required: false, description: 'Signing secret for verification' },
      ],
      response: 'Webhook',
      example: {
        request: `curl -X POST "https://api.opzenix.com/v1/webhooks" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks/opzenix",
    "events": ["execution.started", "execution.completed", "approval.required"],
    "secret": "whsec_your_secret"
  }'`,
        response: `{
  "id": "wh_001",
  "url": "https://your-app.com/webhooks/opzenix",
  "events": ["execution.started", "execution.completed", "approval.required"],
  "created_at": "2025-01-15T10:00:00Z",
  "active": true
}`,
      },
    },
  ],
};

const methodColors: Record<string, string> = {
  GET: 'bg-sec-safe/20 text-sec-safe',
  POST: 'bg-primary/20 text-primary',
  PUT: 'bg-sec-warning/20 text-sec-warning',
  DELETE: 'bg-sec-critical/20 text-sec-critical',
  PATCH: 'bg-chart-1/20 text-chart-1',
};

const APIReferenceDocs = () => {
  const [activeCategory, setActiveCategory] = useState('Executions');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <DocsLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <Code className="w-3 h-3 mr-1" /> API Reference
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Opzenix REST API</h1>
          <p className="text-xl text-muted-foreground">
            Integrate Opzenix into your applications with our comprehensive REST API.
          </p>
        </motion.div>

        {/* Authentication Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            Authentication
          </h2>
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                All API requests require authentication using a Bearer token. Generate an API key from your Opzenix dashboard under Settings → API Keys.
              </p>
              <CodeBlock
                code={`curl -X GET "https://api.opzenix.com/v1/executions" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                language="bash"
                title="Authentication Header"
              />
            </CardContent>
          </Card>

          <Callout type="warning" title="API Key Security">
            Never expose your API keys in client-side code or public repositories. Use environment variables to store keys securely.
          </Callout>
        </section>

        {/* Base URL */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Base URL
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg font-mono text-sm">
                <span className="text-muted-foreground">Production:</span>
                <span className="text-primary">https://api.opzenix.com/v1</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            Endpoints
          </h2>

          {/* Category Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {Object.keys(endpoints).map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                onClick={() => setActiveCategory(category)}
                className="gap-2"
              >
                {category === 'Executions' && <Zap className="w-4 h-4" />}
                {category === 'Checkpoints' && <Database className="w-4 h-4" />}
                {category === 'Environments' && <Shield className="w-4 h-4" />}
                {category === 'Approvals' && <CheckCircle2 className="w-4 h-4" />}
                {category === 'Webhooks' && <Webhook className="w-4 h-4" />}
                {category}
              </Button>
            ))}
          </div>

          {/* Endpoint List */}
          <div className="space-y-6">
            {endpoints[activeCategory]?.map((endpoint, index) => (
              <motion.div
                key={`${endpoint.method}-${endpoint.path}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={methodColors[endpoint.method]}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                      {endpoint.auth && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          <Key className="w-3 h-3 mr-1" /> Auth Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-2">{endpoint.description}</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="example" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="example">Example</TabsTrigger>
                        {(endpoint.params || endpoint.body) && (
                          <TabsTrigger value="params">Parameters</TabsTrigger>
                        )}
                        <TabsTrigger value="response">Response</TabsTrigger>
                      </TabsList>

                      <TabsContent value="example">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Request</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyCode(endpoint.example.request, `req-${index}`)}
                              >
                                {copiedCode === `req-${index}` ? (
                                  <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm">
                              <code>{endpoint.example.request}</code>
                            </pre>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Response</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyCode(endpoint.example.response, `res-${index}`)}
                              >
                                {copiedCode === `res-${index}` ? (
                                  <CheckCircle2 className="w-4 h-4 text-sec-safe" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm">
                              <code>{endpoint.example.response}</code>
                            </pre>
                          </div>
                        </div>
                      </TabsContent>

                      {(endpoint.params || endpoint.body) && (
                        <TabsContent value="params">
                          <div className="space-y-4">
                            {endpoint.params && (
                              <div>
                                <h4 className="text-sm font-semibold mb-3">Query/Path Parameters</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                      <tr>
                                        <th className="text-left p-3">Name</th>
                                        <th className="text-left p-3">Type</th>
                                        <th className="text-left p-3">Required</th>
                                        <th className="text-left p-3">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {endpoint.params.map((param, i) => (
                                        <tr key={i} className="border-t">
                                          <td className="p-3 font-mono text-primary">{param.name}</td>
                                          <td className="p-3 text-muted-foreground">{param.type}</td>
                                          <td className="p-3">
                                            {param.required ? (
                                              <Badge className="bg-sec-warning/20 text-sec-warning text-xs">Required</Badge>
                                            ) : (
                                              <span className="text-muted-foreground">Optional</span>
                                            )}
                                          </td>
                                          <td className="p-3 text-muted-foreground">{param.description}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {endpoint.body && (
                              <div>
                                <h4 className="text-sm font-semibold mb-3">Request Body</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                      <tr>
                                        <th className="text-left p-3">Field</th>
                                        <th className="text-left p-3">Type</th>
                                        <th className="text-left p-3">Required</th>
                                        <th className="text-left p-3">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {endpoint.body.map((field, i) => (
                                        <tr key={i} className="border-t">
                                          <td className="p-3 font-mono text-primary">{field.name}</td>
                                          <td className="p-3 text-muted-foreground">{field.type}</td>
                                          <td className="p-3">
                                            {field.required ? (
                                              <Badge className="bg-sec-warning/20 text-sec-warning text-xs">Required</Badge>
                                            ) : (
                                              <span className="text-muted-foreground">Optional</span>
                                            )}
                                          </td>
                                          <td className="p-3 text-muted-foreground">{field.description}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      )}

                      <TabsContent value="response">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Returns:</span>
                            <Badge variant="outline">{endpoint.response}</Badge>
                          </div>
                          <pre className="p-4 bg-background rounded-lg overflow-x-auto text-sm">
                            <code>{endpoint.example.response}</code>
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">1,000</div>
                  <div className="text-muted-foreground">Requests per minute</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">10,000</div>
                  <div className="text-muted-foreground">Requests per hour</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">100,000</div>
                  <div className="text-muted-foreground">Requests per day</div>
                </div>
              </div>
              <Separator className="my-6" />
              <p className="text-sm text-muted-foreground">
                Rate limit headers are included in all responses: <code className="text-primary">X-RateLimit-Limit</code>, <code className="text-primary">X-RateLimit-Remaining</code>, <code className="text-primary">X-RateLimit-Reset</code>
              </p>
            </CardContent>
          </Card>
        </section>

        {/* SDKs */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">SDKs & Libraries</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Node.js', command: 'npm install @opzenix/sdk' },
              { name: 'Python', command: 'pip install opzenix' },
              { name: 'Go', command: 'go get github.com/opzenix/go-sdk' },
            ].map((sdk) => (
              <Card key={sdk.name}>
                <CardContent className="p-4">
                  <div className="font-semibold mb-2">{sdk.name}</div>
                  <code className="text-xs text-muted-foreground">{sdk.command}</code>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </DocsLayout>
  );
};

export default APIReferenceDocs;
