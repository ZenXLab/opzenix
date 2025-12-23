import { Node, Edge } from '@xyflow/react';

export type LanguageStack = 'java' | 'dotnet' | 'python' | 'javascript' | 'typescript' | 'go';

interface LanguageTemplate {
  id: LanguageStack;
  name: string;
  icon: string;
  buildTool: string;
  nodes: Node[];
  edges: Edge[];
}

// Java Pipeline: Source → Maven/Gradle Build → SAST → Image → Deploy → Health
const javaNodes: Node[] = [
  { id: 'java-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'Git checkout' } },
  { id: 'java-build', type: 'pipelineStage', position: { x: 280, y: 150 }, data: { label: 'Maven Build', stageType: 'build', status: 'idle', description: 'mvn clean package', duration: '3m 45s' } },
  { id: 'java-test', type: 'pipelineStage', position: { x: 510, y: 80 }, data: { label: 'JUnit Tests', stageType: 'test', status: 'idle', description: '342 tests' } },
  { id: 'java-sast', type: 'pipelineStage', position: { x: 510, y: 220 }, data: { label: 'SAST Scan', stageType: 'security', status: 'idle', description: 'SonarQube analysis' } },
  { id: 'java-image', type: 'pipelineStage', position: { x: 740, y: 150 }, data: { label: 'Docker Image', stageType: 'build', status: 'idle', description: 'Build & push to ECR' } },
  { id: 'java-checkpoint', type: 'checkpoint', position: { x: 970, y: 150 }, data: { label: 'Artifact Ready', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'java-deploy', type: 'pipelineStage', position: { x: 1170, y: 150 }, data: { label: 'Deploy', stageType: 'deploy', status: 'idle', description: 'K8s rolling update' } },
  { id: 'java-health', type: 'pipelineStage', position: { x: 1370, y: 150 }, data: { label: 'Health Check', stageType: 'test', status: 'idle', description: 'Readiness probe' } },
];

const javaEdges: Edge[] = [
  { id: 'je1', source: 'java-source', target: 'java-build' },
  { id: 'je2', source: 'java-build', target: 'java-test' },
  { id: 'je3', source: 'java-build', target: 'java-sast' },
  { id: 'je4', source: 'java-test', target: 'java-image' },
  { id: 'je5', source: 'java-sast', target: 'java-image' },
  { id: 'je6', source: 'java-image', target: 'java-checkpoint' },
  { id: 'je7', source: 'java-checkpoint', target: 'java-deploy' },
  { id: 'je8', source: 'java-deploy', target: 'java-health' },
];

// .NET Pipeline: Source → dotnet build → Security Scan → Artifact → Deploy → Runtime
const dotnetNodes: Node[] = [
  { id: 'dn-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'Git checkout' } },
  { id: 'dn-restore', type: 'pipelineStage', position: { x: 280, y: 150 }, data: { label: 'Restore', stageType: 'build', status: 'idle', description: 'dotnet restore' } },
  { id: 'dn-build', type: 'pipelineStage', position: { x: 510, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'idle', description: 'dotnet build -c Release' } },
  { id: 'dn-test', type: 'pipelineStage', position: { x: 740, y: 80 }, data: { label: 'xUnit Tests', stageType: 'test', status: 'idle', description: '189 tests' } },
  { id: 'dn-security', type: 'pipelineStage', position: { x: 740, y: 220 }, data: { label: 'Security Scan', stageType: 'security', status: 'idle', description: 'OWASP scan' } },
  { id: 'dn-artifact', type: 'pipelineStage', position: { x: 970, y: 150 }, data: { label: 'Publish', stageType: 'build', status: 'idle', description: 'dotnet publish' } },
  { id: 'dn-checkpoint', type: 'checkpoint', position: { x: 1170, y: 150 }, data: { label: 'Pre-Deploy', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'dn-deploy', type: 'pipelineStage', position: { x: 1370, y: 150 }, data: { label: 'Deploy', stageType: 'deploy', status: 'idle', description: 'Azure App Service' } },
  { id: 'dn-runtime', type: 'pipelineStage', position: { x: 1570, y: 150 }, data: { label: 'Runtime Check', stageType: 'test', status: 'idle', description: 'Smoke tests' } },
];

const dotnetEdges: Edge[] = [
  { id: 'de1', source: 'dn-source', target: 'dn-restore' },
  { id: 'de2', source: 'dn-restore', target: 'dn-build' },
  { id: 'de3', source: 'dn-build', target: 'dn-test' },
  { id: 'de4', source: 'dn-build', target: 'dn-security' },
  { id: 'de5', source: 'dn-test', target: 'dn-artifact' },
  { id: 'de6', source: 'dn-security', target: 'dn-artifact' },
  { id: 'de7', source: 'dn-artifact', target: 'dn-checkpoint' },
  { id: 'de8', source: 'dn-checkpoint', target: 'dn-deploy' },
  { id: 'de9', source: 'dn-deploy', target: 'dn-runtime' },
];

// Python Pipeline: Source → Dependency Install → Test → Security → Package → Deploy
const pythonNodes: Node[] = [
  { id: 'py-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'Git checkout' } },
  { id: 'py-venv', type: 'pipelineStage', position: { x: 280, y: 150 }, data: { label: 'Setup Venv', stageType: 'build', status: 'idle', description: 'pip install -r requirements.txt' } },
  { id: 'py-lint', type: 'pipelineStage', position: { x: 510, y: 80 }, data: { label: 'Lint', stageType: 'test', status: 'idle', description: 'pylint, flake8' } },
  { id: 'py-test', type: 'pipelineStage', position: { x: 510, y: 220 }, data: { label: 'Pytest', stageType: 'test', status: 'idle', description: '156 tests' } },
  { id: 'py-security', type: 'pipelineStage', position: { x: 740, y: 150 }, data: { label: 'Security', stageType: 'security', status: 'idle', description: 'bandit, safety check' } },
  { id: 'py-package', type: 'pipelineStage', position: { x: 970, y: 150 }, data: { label: 'Package', stageType: 'build', status: 'idle', description: 'Build wheel/Docker' } },
  { id: 'py-checkpoint', type: 'checkpoint', position: { x: 1170, y: 150 }, data: { label: 'Pre-Deploy', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'py-deploy', type: 'pipelineStage', position: { x: 1370, y: 150 }, data: { label: 'Deploy', stageType: 'deploy', status: 'idle', description: 'Lambda / ECS' } },
];

const pythonEdges: Edge[] = [
  { id: 'pe1', source: 'py-source', target: 'py-venv' },
  { id: 'pe2', source: 'py-venv', target: 'py-lint' },
  { id: 'pe3', source: 'py-venv', target: 'py-test' },
  { id: 'pe4', source: 'py-lint', target: 'py-security' },
  { id: 'pe5', source: 'py-test', target: 'py-security' },
  { id: 'pe6', source: 'py-security', target: 'py-package' },
  { id: 'pe7', source: 'py-package', target: 'py-checkpoint' },
  { id: 'pe8', source: 'py-checkpoint', target: 'py-deploy' },
];

// JavaScript Pipeline: Source → Install → Build → Lint/Test → Security → Deploy
const javascriptNodes: Node[] = [
  { id: 'js-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'Git checkout' } },
  { id: 'js-install', type: 'pipelineStage', position: { x: 280, y: 150 }, data: { label: 'Install', stageType: 'build', status: 'idle', description: 'npm ci' } },
  { id: 'js-build', type: 'pipelineStage', position: { x: 510, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'idle', description: 'npm run build' } },
  { id: 'js-lint', type: 'pipelineStage', position: { x: 740, y: 80 }, data: { label: 'Lint', stageType: 'test', status: 'idle', description: 'ESLint' } },
  { id: 'js-test', type: 'pipelineStage', position: { x: 740, y: 220 }, data: { label: 'Jest Tests', stageType: 'test', status: 'idle', description: '234 tests' } },
  { id: 'js-security', type: 'pipelineStage', position: { x: 970, y: 150 }, data: { label: 'Security', stageType: 'security', status: 'idle', description: 'npm audit, Snyk' } },
  { id: 'js-checkpoint', type: 'checkpoint', position: { x: 1170, y: 150 }, data: { label: 'Pre-Deploy', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'js-deploy', type: 'pipelineStage', position: { x: 1370, y: 150 }, data: { label: 'Deploy', stageType: 'deploy', status: 'idle', description: 'Vercel / S3' } },
];

const javascriptEdges: Edge[] = [
  { id: 'jse1', source: 'js-source', target: 'js-install' },
  { id: 'jse2', source: 'js-install', target: 'js-build' },
  { id: 'jse3', source: 'js-build', target: 'js-lint' },
  { id: 'jse4', source: 'js-build', target: 'js-test' },
  { id: 'jse5', source: 'js-lint', target: 'js-security' },
  { id: 'jse6', source: 'js-test', target: 'js-security' },
  { id: 'jse7', source: 'js-security', target: 'js-checkpoint' },
  { id: 'jse8', source: 'js-checkpoint', target: 'js-deploy' },
];

// TypeScript Pipeline: Source → Install → Type Check → Build → Lint/Test → Security → Deploy
const typescriptNodes: Node[] = [
  { id: 'ts-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'Git checkout' } },
  { id: 'ts-install', type: 'pipelineStage', position: { x: 250, y: 150 }, data: { label: 'Install', stageType: 'build', status: 'idle', description: 'pnpm install' } },
  { id: 'ts-typecheck', type: 'pipelineStage', position: { x: 450, y: 150 }, data: { label: 'Type Check', stageType: 'test', status: 'idle', description: 'tsc --noEmit' } },
  { id: 'ts-build', type: 'pipelineStage', position: { x: 650, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'idle', description: 'Vite build' } },
  { id: 'ts-lint', type: 'pipelineStage', position: { x: 850, y: 80 }, data: { label: 'ESLint', stageType: 'test', status: 'idle', description: 'Strict mode' } },
  { id: 'ts-test', type: 'pipelineStage', position: { x: 850, y: 220 }, data: { label: 'Vitest', stageType: 'test', status: 'idle', description: '189 tests' } },
  { id: 'ts-security', type: 'pipelineStage', position: { x: 1050, y: 150 }, data: { label: 'Security', stageType: 'security', status: 'idle', description: 'npm audit' } },
  { id: 'ts-checkpoint', type: 'checkpoint', position: { x: 1250, y: 150 }, data: { label: 'Pre-Deploy', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'ts-deploy', type: 'pipelineStage', position: { x: 1450, y: 150 }, data: { label: 'Deploy', stageType: 'deploy', status: 'idle', description: 'Cloudflare Pages' } },
];

const typescriptEdges: Edge[] = [
  { id: 'tse1', source: 'ts-source', target: 'ts-install' },
  { id: 'tse2', source: 'ts-install', target: 'ts-typecheck' },
  { id: 'tse3', source: 'ts-typecheck', target: 'ts-build' },
  { id: 'tse4', source: 'ts-build', target: 'ts-lint' },
  { id: 'tse5', source: 'ts-build', target: 'ts-test' },
  { id: 'tse6', source: 'ts-lint', target: 'ts-security' },
  { id: 'tse7', source: 'ts-test', target: 'ts-security' },
  { id: 'tse8', source: 'ts-security', target: 'ts-checkpoint' },
  { id: 'tse9', source: 'ts-checkpoint', target: 'ts-deploy' },
];

// Go Pipeline: Source → Go Build → Test → Security → Binary/Image → Deploy
const goNodes: Node[] = [
  { id: 'go-source', type: 'pipelineStage', position: { x: 50, y: 150 }, data: { label: 'Source', stageType: 'source', status: 'success', description: 'Git checkout' } },
  { id: 'go-mod', type: 'pipelineStage', position: { x: 280, y: 150 }, data: { label: 'Go Mod', stageType: 'build', status: 'idle', description: 'go mod download' } },
  { id: 'go-build', type: 'pipelineStage', position: { x: 510, y: 150 }, data: { label: 'Build', stageType: 'build', status: 'idle', description: 'go build -o app' } },
  { id: 'go-test', type: 'pipelineStage', position: { x: 740, y: 80 }, data: { label: 'Go Test', stageType: 'test', status: 'idle', description: '78 tests' } },
  { id: 'go-vet', type: 'pipelineStage', position: { x: 740, y: 220 }, data: { label: 'Go Vet', stageType: 'test', status: 'idle', description: 'Static analysis' } },
  { id: 'go-security', type: 'pipelineStage', position: { x: 970, y: 150 }, data: { label: 'Security', stageType: 'security', status: 'idle', description: 'gosec, govulncheck' } },
  { id: 'go-image', type: 'pipelineStage', position: { x: 1170, y: 150 }, data: { label: 'Docker Image', stageType: 'build', status: 'idle', description: 'Multi-stage build' } },
  { id: 'go-checkpoint', type: 'checkpoint', position: { x: 1370, y: 150 }, data: { label: 'Pre-Deploy', stageType: 'checkpoint', status: 'checkpoint' } },
  { id: 'go-deploy', type: 'pipelineStage', position: { x: 1570, y: 150 }, data: { label: 'Deploy', stageType: 'deploy', status: 'idle', description: 'K8s Deployment' } },
];

const goEdges: Edge[] = [
  { id: 'ge1', source: 'go-source', target: 'go-mod' },
  { id: 'ge2', source: 'go-mod', target: 'go-build' },
  { id: 'ge3', source: 'go-build', target: 'go-test' },
  { id: 'ge4', source: 'go-build', target: 'go-vet' },
  { id: 'ge5', source: 'go-test', target: 'go-security' },
  { id: 'ge6', source: 'go-vet', target: 'go-security' },
  { id: 'ge7', source: 'go-security', target: 'go-image' },
  { id: 'ge8', source: 'go-image', target: 'go-checkpoint' },
  { id: 'ge9', source: 'go-checkpoint', target: 'go-deploy' },
];

export const languageTemplates: LanguageTemplate[] = [
  { id: 'java', name: 'Java', icon: '☕', buildTool: 'Maven/Gradle', nodes: javaNodes, edges: javaEdges },
  { id: 'dotnet', name: '.NET', icon: '🔷', buildTool: 'dotnet CLI', nodes: dotnetNodes, edges: dotnetEdges },
  { id: 'python', name: 'Python', icon: '🐍', buildTool: 'pip/poetry', nodes: pythonNodes, edges: pythonEdges },
  { id: 'javascript', name: 'JavaScript', icon: '🟨', buildTool: 'npm/yarn', nodes: javascriptNodes, edges: javascriptEdges },
  { id: 'typescript', name: 'TypeScript', icon: '🔵', buildTool: 'tsc/vite', nodes: typescriptNodes, edges: typescriptEdges },
  { id: 'go', name: 'Go', icon: '🐹', buildTool: 'go build', nodes: goNodes, edges: goEdges },
];

export const getLanguageTemplate = (language: LanguageStack): { nodes: Node[]; edges: Edge[] } => {
  const template = languageTemplates.find(t => t.id === language);
  if (!template) {
    return { nodes: [], edges: [] };
  }
  return { nodes: template.nodes, edges: template.edges };
};

export const detectLanguageFromFiles = (files: string[]): LanguageStack | null => {
  const hasFile = (pattern: string) => files.some(f => f.includes(pattern));
  
  if (hasFile('pom.xml') || hasFile('build.gradle')) return 'java';
  if (hasFile('.csproj') || hasFile('.sln')) return 'dotnet';
  if (hasFile('requirements.txt') || hasFile('pyproject.toml') || hasFile('setup.py')) return 'python';
  if (hasFile('tsconfig.json')) return 'typescript';
  if (hasFile('package.json')) return 'javascript';
  if (hasFile('go.mod')) return 'go';
  
  return null;
};
