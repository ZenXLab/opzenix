import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Package,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Tag,
  FileText,
  Layers,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Artifact {
  id: string;
  name: string;
  type: string;
  version: string;
  imageTag: string;
  imageDigest: string;
  registryUrl: string;
  sizeBytes: number;
  buildDurationMs: number;
  createdAt: string;
  vulnerabilities?: { critical: number; high: number; medium: number; low: number };
  sbom?: { dependenciesCount: number; format: string };
}

interface ArtifactsRegistryPanelProps {
  onBack?: () => void;
}

export const ArtifactsRegistryPanel = ({ onBack }: ArtifactsRegistryPanelProps) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const { data: artifactsData } = await supabase
        .from('artifacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (artifactsData && artifactsData.length > 0) {
        // Fetch vulnerability data
        const artifactIds = artifactsData.map(a => a.id);
        const { data: vulnData } = await supabase
          .from('vulnerability_scans')
          .select('*')
          .in('artifact_id', artifactIds);

        const { data: sbomData } = await supabase
          .from('sbom_entries')
          .select('*')
          .in('artifact_id', artifactIds);

        setArtifacts(
          artifactsData.map((a) => {
            const vuln = vulnData?.find(v => v.artifact_id === a.id);
            const sbom = sbomData?.find(s => s.artifact_id === a.id);
            return {
              id: a.id,
              name: a.name,
              type: a.type,
              version: a.version || '1.0.0',
              imageTag: a.image_tag || 'latest',
              imageDigest: a.image_digest,
              registryUrl: a.registry_url,
              sizeBytes: a.size_bytes || 0,
              buildDurationMs: a.build_duration_ms || 0,
              createdAt: a.created_at,
              vulnerabilities: vuln ? {
                critical: vuln.critical,
                high: vuln.high,
                medium: vuln.medium,
                low: vuln.low,
              } : undefined,
              sbom: sbom ? {
                dependenciesCount: sbom.dependencies_count,
                format: sbom.format,
              } : undefined,
            };
          })
        );
      } else {
        // Mock data
        setArtifacts([
          {
            id: '1',
            name: 'frontend-app',
            type: 'container',
            version: '2.1.0',
            imageTag: 'v2.1.0-build.456',
            imageDigest: 'sha256:abc123...',
            registryUrl: 'ghcr.io/org/frontend-app',
            sizeBytes: 245000000,
            buildDurationMs: 125000,
            createdAt: new Date().toISOString(),
            vulnerabilities: { critical: 0, high: 2, medium: 5, low: 12 },
            sbom: { dependenciesCount: 234, format: 'CycloneDX' },
          },
          {
            id: '2',
            name: 'api-service',
            type: 'container',
            version: '1.5.3',
            imageTag: 'v1.5.3-build.789',
            imageDigest: 'sha256:def456...',
            registryUrl: 'ghcr.io/org/api-service',
            sizeBytes: 180000000,
            buildDurationMs: 98000,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            vulnerabilities: { critical: 1, high: 3, medium: 8, low: 20 },
            sbom: { dependenciesCount: 156, format: 'SPDX' },
          },
          {
            id: '3',
            name: 'worker-service',
            type: 'container',
            version: '1.2.0',
            imageTag: 'v1.2.0-build.321',
            imageDigest: 'sha256:ghi789...',
            registryUrl: 'ghcr.io/org/worker-service',
            sizeBytes: 120000000,
            buildDurationMs: 75000,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            vulnerabilities: { critical: 0, high: 0, medium: 2, low: 8 },
            sbom: { dependenciesCount: 89, format: 'CycloneDX' },
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch artifacts:', error);
      toast.error('Failed to load artifacts');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  const getVulnSeverity = (vuln?: Artifact['vulnerabilities']) => {
    if (!vuln) return 'unknown';
    if (vuln.critical > 0) return 'critical';
    if (vuln.high > 0) return 'high';
    if (vuln.medium > 0) return 'medium';
    return 'low';
  };

  const filteredArtifacts = artifacts.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: artifacts.length,
    containers: artifacts.filter(a => a.type === 'container').length,
    withVulns: artifacts.filter(a => a.vulnerabilities && (a.vulnerabilities.critical > 0 || a.vulnerabilities.high > 0)).length,
    totalSize: artifacts.reduce((acc, a) => acc + a.sizeBytes, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="p-2 rounded-lg bg-primary/10">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Artifacts Registry</h1>
              <p className="text-sm text-muted-foreground">Manage container images, SBOMs, and vulnerability scans</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchArtifacts}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4 text-center">
              <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground uppercase">Total Artifacts</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <Layers className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold text-blue-500">{stats.containers}</p>
              <p className="text-xs text-blue-500/80 uppercase">Containers</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold text-amber-500">{stats.withVulns}</p>
              <p className="text-xs text-amber-500/80 uppercase">With Issues</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-4 text-center">
              <HardDrive className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{formatBytes(stats.totalSize)}</p>
              <p className="text-xs text-muted-foreground uppercase">Total Size</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="container">Containers</SelectItem>
              <SelectItem value="binary">Binaries</SelectItem>
              <SelectItem value="archive">Archives</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Artifacts List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredArtifacts.map((artifact) => {
              const severity = getVulnSeverity(artifact.vulnerabilities);
              return (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedArtifact(artifact)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-lg bg-muted">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{artifact.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                <Tag className="w-3 h-3 mr-1" />
                                {artifact.imageTag}
                              </Badge>
                              {severity === 'critical' && (
                                <Badge variant="destructive" className="text-[10px]">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Critical
                                </Badge>
                              )}
                              {severity === 'high' && (
                                <Badge className="text-[10px] bg-orange-500">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  High
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(artifact.createdAt).toLocaleDateString()}
                              </span>
                              <span>{formatBytes(artifact.sizeBytes)}</span>
                              <span>Build: {formatDuration(artifact.buildDurationMs)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {artifact.vulnerabilities && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-red-500">{artifact.vulnerabilities.critical}C</span>
                              <span className="text-orange-500">{artifact.vulnerabilities.high}H</span>
                              <span className="text-yellow-500">{artifact.vulnerabilities.medium}M</span>
                            </div>
                          )}
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Artifact Detail Dialog */}
      <Dialog open={!!selectedArtifact} onOpenChange={() => setSelectedArtifact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {selectedArtifact?.name}
            </DialogTitle>
            <DialogDescription>
              Artifact details, vulnerabilities, and SBOM information
            </DialogDescription>
          </DialogHeader>
          {selectedArtifact && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                <TabsTrigger value="sbom">SBOM</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="font-mono">{selectedArtifact.version}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Image Tag</p>
                    <p className="font-mono text-sm">{selectedArtifact.imageTag}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="font-medium">{formatBytes(selectedArtifact.sizeBytes)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Build Duration</p>
                    <p className="font-medium">{formatDuration(selectedArtifact.buildDurationMs)}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Registry URL</p>
                  <p className="font-mono text-sm break-all">{selectedArtifact.registryUrl}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Image Digest</p>
                  <p className="font-mono text-sm break-all">{selectedArtifact.imageDigest}</p>
                </div>
              </TabsContent>
              <TabsContent value="vulnerabilities" className="mt-4">
                {selectedArtifact.vulnerabilities ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                        <p className="text-2xl font-bold text-red-500">{selectedArtifact.vulnerabilities.critical}</p>
                        <p className="text-[10px] text-red-500 uppercase">Critical</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                        <p className="text-2xl font-bold text-orange-500">{selectedArtifact.vulnerabilities.high}</p>
                        <p className="text-[10px] text-orange-500 uppercase">High</p>
                      </div>
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                        <p className="text-2xl font-bold text-yellow-500">{selectedArtifact.vulnerabilities.medium}</p>
                        <p className="text-[10px] text-yellow-500 uppercase">Medium</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <p className="text-2xl font-bold text-muted-foreground">{selectedArtifact.vulnerabilities.low}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Low</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      View Full Scan Report
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No vulnerability scan available</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="sbom" className="mt-4">
                {selectedArtifact.sbom ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Dependencies</p>
                        <p className="text-xl font-bold">{selectedArtifact.sbom.dependenciesCount}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Format</p>
                        <p className="text-xl font-bold">{selectedArtifact.sbom.format}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download SBOM
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No SBOM available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtifactsRegistryPanel;
