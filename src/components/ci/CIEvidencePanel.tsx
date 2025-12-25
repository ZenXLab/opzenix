import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Bug, 
  Key, 
  TestTube, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileCode,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CIEvidence {
  id: string;
  execution_id: string;
  step_name: string;
  step_type: string;
  step_order: number;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  summary: string | null;
  details: Record<string, unknown>;
  duration_ms: number | null;
  completed_at: string | null;
}

interface TestResult {
  id: string;
  suite_name: string;
  test_type: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number | null;
  coverage_percent: number | null;
}

interface CIEvidencePanelProps {
  executionId: string;
}

const statusIcon = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  running: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
  passed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  skipped: <AlertTriangle className="h-4 w-4 text-yellow-500" />
};

const statusVariant = {
  pending: 'secondary' as const,
  running: 'default' as const,
  passed: 'default' as const,
  failed: 'destructive' as const,
  skipped: 'outline' as const
};

export function CIEvidencePanel({ executionId }: CIEvidencePanelProps) {
  const [evidence, setEvidence] = useState<CIEvidence[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvidence();
    fetchTestResults();

    // Subscribe to real-time updates
    const evidenceChannel = supabase
      .channel('ci-evidence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ci_evidence',
          filter: `execution_id=eq.${executionId}`
        },
        () => {
          fetchEvidence();
        }
      )
      .subscribe();

    const testChannel = supabase
      .channel('test-results-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_results',
          filter: `execution_id=eq.${executionId}`
        },
        () => {
          fetchTestResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(evidenceChannel);
      supabase.removeChannel(testChannel);
    };
  }, [executionId]);

  const fetchEvidence = async () => {
    const { data, error } = await supabase
      .from('ci_evidence')
      .select('*')
      .eq('execution_id', executionId)
      .order('step_order', { ascending: true });

    if (!error && data) {
      setEvidence(data as CIEvidence[]);
    }
    setLoading(false);
  };

  const fetchTestResults = async () => {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setTestResults(data as TestResult[]);
    }
  };

  const getEvidenceByType = (type: string) => 
    evidence.filter(e => e.step_type === type);

  const sastEvidence = getEvidenceByType('sast');
  const dependencyEvidence = getEvidenceByType('dependency');
  const secretsEvidence = getEvidenceByType('secrets');
  const testEvidence = getEvidenceByType('test');

  const renderEvidenceCard = (item: CIEvidence) => (
    <Card key={item.id} className="mb-3">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusIcon[item.status]}
            <CardTitle className="text-sm font-medium">{item.step_name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {item.duration_ms && (
              <span className="text-xs text-muted-foreground">
                {(item.duration_ms / 1000).toFixed(1)}s
              </span>
            )}
            <Badge variant={statusVariant[item.status]} className="text-xs">
              {item.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {item.summary && (
        <CardContent className="pt-0 pb-3 px-4">
          <p className="text-sm text-muted-foreground">{item.summary}</p>
          {item.details && Object.keys(item.details).length > 0 && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
              {Object.entries(item.details).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

  const renderTestCard = (result: TestResult) => {
    const passRate = result.total_tests > 0 
      ? Math.round((result.passed / result.total_tests) * 100) 
      : 0;
    const status = result.failed > 0 ? 'failed' : 'passed';

    return (
      <Card key={result.id} className="mb-3">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcon[status]}
              <CardTitle className="text-sm font-medium">{result.suite_name}</CardTitle>
              <Badge variant="outline" className="text-xs">{result.test_type}</Badge>
            </div>
            <Badge variant={statusVariant[status]} className="text-xs">
              {passRate}% PASS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-lg font-bold">{result.total_tests}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-2 bg-green-500/10 rounded">
              <div className="text-lg font-bold text-green-500">{result.passed}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            <div className="p-2 bg-destructive/10 rounded">
              <div className="text-lg font-bold text-destructive">{result.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded">
              <div className="text-lg font-bold text-yellow-500">{result.skipped}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
          </div>
          {result.coverage_percent && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Coverage:</span>
              <span className="font-medium">{result.coverage_percent}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (type: string) => (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <FileCode className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No {type} evidence recorded yet</p>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          CI Evidence
        </CardTitle>
        <CardDescription>
          Security scans, tests, and build evidence from the CI pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sast" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sast" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">SAST</span>
              {sastEvidence.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 justify-center text-xs">
                  {sastEvidence.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dependency" className="flex items-center gap-1">
              <Bug className="h-3 w-3" />
              <span className="hidden sm:inline">Deps</span>
              {dependencyEvidence.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 justify-center text-xs">
                  {dependencyEvidence.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="secrets" className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              <span className="hidden sm:inline">Secrets</span>
              {secretsEvidence.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 justify-center text-xs">
                  {secretsEvidence.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              <span className="hidden sm:inline">Tests</span>
              {(testEvidence.length > 0 || testResults.length > 0) && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 justify-center text-xs">
                  {testEvidence.length + testResults.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="sast" className="mt-0">
              {sastEvidence.length > 0 
                ? sastEvidence.map(renderEvidenceCard)
                : renderEmptyState('SAST')}
            </TabsContent>

            <TabsContent value="dependency" className="mt-0">
              {dependencyEvidence.length > 0 
                ? dependencyEvidence.map(renderEvidenceCard)
                : renderEmptyState('dependency scan')}
            </TabsContent>

            <TabsContent value="secrets" className="mt-0">
              {secretsEvidence.length > 0 
                ? secretsEvidence.map(renderEvidenceCard)
                : renderEmptyState('secrets scan')}
            </TabsContent>

            <TabsContent value="tests" className="mt-0">
              {testResults.length > 0 
                ? testResults.map(renderTestCard)
                : testEvidence.length > 0
                ? testEvidence.map(renderEvidenceCard)
                : renderEmptyState('test')}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
