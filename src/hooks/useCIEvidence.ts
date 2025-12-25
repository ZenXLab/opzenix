import { useState, useEffect, useCallback } from 'react';
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
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TestResult {
  id: string;
  execution_id: string;
  suite_name: string;
  test_type: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number | null;
  coverage_percent: number | null;
  report_url: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface VulnerabilityScan {
  id: string;
  artifact_id: string;
  scan_type: string;
  scanner: string;
  scan_status: string;
  total_issues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  cve_details: Array<Record<string, unknown>>;
  scanned_at: string;
}

interface UseCIEvidenceResult {
  evidence: CIEvidence[];
  testResults: TestResult[];
  vulnerabilityScans: VulnerabilityScan[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getEvidenceByType: (type: string) => CIEvidence[];
  getPipelineProgress: () => {
    total: number;
    completed: number;
    failed: number;
    running: number;
    percentage: number;
  };
}

export function useCIEvidence(executionId: string): UseCIEvidenceResult {
  const [evidence, setEvidence] = useState<CIEvidence[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [vulnerabilityScans, setVulnerabilityScans] = useState<VulnerabilityScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!executionId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch CI evidence
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('ci_evidence')
        .select('*')
        .eq('execution_id', executionId)
        .order('step_order', { ascending: true });

      if (evidenceError) throw evidenceError;
      setEvidence((evidenceData || []) as CIEvidence[]);

      // Fetch test results
      const { data: testData, error: testError } = await supabase
        .from('test_results')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: true });

      if (testError) throw testError;
      setTestResults((testData || []) as TestResult[]);

      // Get artifact IDs for this execution to fetch vulnerability scans
      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('id')
        .eq('execution_id', executionId);

      if (artifacts && artifacts.length > 0) {
        const artifactIds = artifacts.map(a => a.id);
        const { data: vulnData, error: vulnError } = await supabase
          .from('vulnerability_scans')
          .select('*')
          .in('artifact_id', artifactIds)
          .order('scanned_at', { ascending: false });

        if (vulnError) throw vulnError;
        setVulnerabilityScans((vulnData || []) as VulnerabilityScan[]);
      }

    } catch (err) {
      console.error('[useCIEvidence] Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch CI evidence'));
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const evidenceChannel = supabase
      .channel(`ci-evidence-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ci_evidence',
          filter: `execution_id=eq.${executionId}`
        },
        () => fetchData()
      )
      .subscribe();

    const testChannel = supabase
      .channel(`test-results-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_results',
          filter: `execution_id=eq.${executionId}`
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(evidenceChannel);
      supabase.removeChannel(testChannel);
    };
  }, [executionId, fetchData]);

  const getEvidenceByType = useCallback((type: string) => {
    return evidence.filter(e => e.step_type === type);
  }, [evidence]);

  const getPipelineProgress = useCallback(() => {
    const total = evidence.length || 8; // Default to 8 expected steps
    const completed = evidence.filter(e => e.status === 'passed' || e.status === 'failed' || e.status === 'skipped').length;
    const failed = evidence.filter(e => e.status === 'failed').length;
    const running = evidence.filter(e => e.status === 'running').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, failed, running, percentage };
  }, [evidence]);

  return {
    evidence,
    testResults,
    vulnerabilityScans,
    loading,
    error,
    refetch: fetchData,
    getEvidenceByType,
    getPipelineProgress
  };
}
