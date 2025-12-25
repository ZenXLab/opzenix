import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Workflow, 
  Package, 
  Activity,
  ListChecks,
  ArrowLeft
} from 'lucide-react';
import { PipelineTimelineView } from './PipelineTimelineView';
import { CIEvidencePanel } from '@/components/ci/CIEvidencePanel';
import { ArtifactSecurityPanel } from '@/components/artifacts/ArtifactSecurityPanel';
import { LiveDeploymentConsole } from './LiveDeploymentConsole';
import { MVPChecklistPanel } from './MVPChecklistPanel';

interface ExecutionDetailViewProps {
  executionId: string;
  artifactId?: string;
  deploymentId?: string;
  environment?: string;
  onBack?: () => void;
}

export function ExecutionDetailView({
  executionId,
  artifactId,
  deploymentId,
  environment = 'development',
  onBack
}: ExecutionDetailViewProps) {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const handleStageClick = (stageId: string) => {
    setActiveStage(stageId);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        )}

        {/* Pipeline Timeline */}
        <PipelineTimelineView 
          executionId={executionId} 
          onStageClick={handleStageClick}
        />

        {/* Detail Tabs */}
        <Tabs defaultValue="ci" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ci" className="flex items-center gap-1">
              <Workflow className="h-4 w-4" />
              CI Evidence
            </TabsTrigger>
            <TabsTrigger value="artifact" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Artifact
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Deployment
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              MVP Status
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="ci" className="mt-0">
              <CIEvidencePanel executionId={executionId} />
            </TabsContent>

            <TabsContent value="artifact" className="mt-0">
              {artifactId ? (
                <ArtifactSecurityPanel artifactId={artifactId} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No artifact available for this execution</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deployment" className="mt-0">
              {deploymentId ? (
                <LiveDeploymentConsole 
                  deploymentId={deploymentId} 
                  environment={environment}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No active deployment for this execution</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="mt-0">
              <MVPChecklistPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
