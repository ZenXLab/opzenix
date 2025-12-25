
-- =====================================================
-- OPZENIX MVP 1.0.0 - CI Evidence Tables
-- =====================================================

-- 1. Test Results Table (JUnit/xUnit parsed results)
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.executions(id) ON DELETE CASCADE,
  suite_name TEXT NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'unit', -- unit, integration, e2e
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  coverage_percent NUMERIC(5,2),
  report_url TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Vulnerability Scans Table (Trivy/Snyk results)
CREATE TABLE public.vulnerability_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'image', -- image, filesystem, repo
  scanner TEXT NOT NULL DEFAULT 'trivy', -- trivy, snyk, grype
  scan_status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  total_issues INTEGER NOT NULL DEFAULT 0,
  critical INTEGER NOT NULL DEFAULT 0,
  high INTEGER NOT NULL DEFAULT 0,
  medium INTEGER NOT NULL DEFAULT 0,
  low INTEGER NOT NULL DEFAULT 0,
  cve_details JSONB DEFAULT '[]'::jsonb,
  scan_report_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. SBOM Entries Table (Software Bill of Materials)
CREATE TABLE public.sbom_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  format TEXT NOT NULL DEFAULT 'spdx', -- spdx, cyclonedx
  generator TEXT NOT NULL DEFAULT 'syft', -- syft, trivy
  packages JSONB DEFAULT '[]'::jsonb,
  dependencies_count INTEGER NOT NULL DEFAULT 0,
  license_summary JSONB DEFAULT '{}'::jsonb,
  sbom_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. CI Evidence Table (Consolidated evidence per CI step)
CREATE TABLE public.ci_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.executions(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL, -- sast, dast, secrets, dependency, test, build, scan, sign
  step_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, passed, failed, skipped
  evidence_url TEXT,
  summary TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Enable Row Level Security
-- =====================================================
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerability_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sbom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ci_evidence ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for test_results
-- =====================================================
CREATE POLICY "Authenticated users can view test results"
ON public.test_results FOR SELECT
USING (true);

CREATE POLICY "Operators can manage test results"
ON public.test_results FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "System can insert test results"
ON public.test_results FOR INSERT
WITH CHECK (true);

-- =====================================================
-- RLS Policies for vulnerability_scans
-- =====================================================
CREATE POLICY "Authenticated users can view vulnerability scans"
ON public.vulnerability_scans FOR SELECT
USING (true);

CREATE POLICY "Operators can manage vulnerability scans"
ON public.vulnerability_scans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "System can insert vulnerability scans"
ON public.vulnerability_scans FOR INSERT
WITH CHECK (true);

-- =====================================================
-- RLS Policies for sbom_entries
-- =====================================================
CREATE POLICY "Authenticated users can view SBOM entries"
ON public.sbom_entries FOR SELECT
USING (true);

CREATE POLICY "Operators can manage SBOM entries"
ON public.sbom_entries FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "System can insert SBOM entries"
ON public.sbom_entries FOR INSERT
WITH CHECK (true);

-- =====================================================
-- RLS Policies for ci_evidence
-- =====================================================
CREATE POLICY "Authenticated users can view CI evidence"
ON public.ci_evidence FOR SELECT
USING (true);

CREATE POLICY "Operators can manage CI evidence"
ON public.ci_evidence FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "System can insert CI evidence"
ON public.ci_evidence FOR INSERT
WITH CHECK (true);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_test_results_execution_id ON public.test_results(execution_id);
CREATE INDEX idx_test_results_test_type ON public.test_results(test_type);

CREATE INDEX idx_vulnerability_scans_artifact_id ON public.vulnerability_scans(artifact_id);
CREATE INDEX idx_vulnerability_scans_scan_status ON public.vulnerability_scans(scan_status);
CREATE INDEX idx_vulnerability_scans_critical ON public.vulnerability_scans(critical) WHERE critical > 0;

CREATE INDEX idx_sbom_entries_artifact_id ON public.sbom_entries(artifact_id);

CREATE INDEX idx_ci_evidence_execution_id ON public.ci_evidence(execution_id);
CREATE INDEX idx_ci_evidence_step_type ON public.ci_evidence(step_type);
CREATE INDEX idx_ci_evidence_status ON public.ci_evidence(status);

-- =====================================================
-- Enable Realtime for CI monitoring
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vulnerability_scans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ci_evidence;
