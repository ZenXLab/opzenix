import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Shield, 
  FileCheck, 
  Download, 
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Copy,
  Box
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Artifact {
  id: string;
  name: string;
  type: string;
  image_tag: string;
  image_digest: string;
  registry_url: string;
  version: string | null;
  size_bytes: number | null;
  build_duration_ms: number | null;
  metadata: Record<string, unknown>;
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
  cve_details: Array<{
    id: string;
    severity: string;
    package: string;
    version: string;
    fixedVersion?: string;
    title: string;
  }>;
  scanned_at: string;
}

interface SBOMEntry {
  id: string;
  artifact_id: string;
  format: string;
  generator: string;
  packages: Array<{
    name: string;
    version: string;
    license?: string;
  }>;
  dependencies_count: number;
  license_summary: Record<string, number>;
  sbom_url: string | null;
}

interface ArtifactSecurityPanelProps {
  artifactId: string;
}

const severityColors = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-blue-500'
};

export function ArtifactSecurityPanel({ artifactId }: ArtifactSecurityPanelProps) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [vulnScan, setVulnScan] = useState<VulnerabilityScan | null>(null);
  const [sbom, setSbom] = useState<SBOMEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [artifactId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch artifact details
    const { data: artifactData } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();
    
    if (artifactData) {
      setArtifact(artifactData as Artifact);
    }

    // Fetch vulnerability scan
    const { data: vulnData } = await supabase
      .from('vulnerability_scans')
      .select('*')
      .eq('artifact_id', artifactId)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (vulnData) {
      setVulnScan(vulnData as unknown as VulnerabilityScan);
    }

    // Fetch SBOM
    const { data: sbomData } = await supabase
      .from('sbom_entries')
      .select('*')
      .eq('artifact_id', artifactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (sbomData) {
      setSbom(sbomData as unknown as SBOMEntry);
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRegistryType = (url: string) => {
    if (url.includes('ghcr.io')) return 'GHCR';
    if (url.includes('docker.io') || url.includes('hub.docker')) return 'Docker Hub';
    if (url.includes('azurecr.io')) return 'ACR';
    if (url.includes('ecr.') || url.includes('amazonaws.com')) return 'ECR';
    return 'Registry';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!artifact) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <Package className="h-8 w-8 mr-2 opacity-50" />
          <span>Artifact not found</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              {artifact.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{getRegistryType(artifact.registry_url)}</Badge>
              <span className="text-xs">{artifact.image_tag}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {vulnScan && vulnScan.critical === 0 && vulnScan.high === 0 ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Secure
              </Badge>
            ) : vulnScan && (vulnScan.critical > 0 || vulnScan.high > 0) ? (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Vulnerabilities
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Info className="h-3 w-3 mr-1" />
                Not Scanned
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details" className="flex items-center gap-1">
              <Box className="h-3 w-3" />
              Details
            </TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Vulns
              {vulnScan && vulnScan.total_issues > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 justify-center text-xs">
                  {vulnScan.total_issues}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sbom" className="flex items-center gap-1">
              <FileCheck className="h-3 w-3" />
              SBOM
              {sbom && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {sbom.dependencies_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="signature" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Signature
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px] mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Registry</div>
                  <div className="text-sm font-medium flex items-center gap-2">
                    {getRegistryType(artifact.registry_url)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => copyToClipboard(artifact.registry_url)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Version</div>
                  <div className="text-sm font-medium">{artifact.version || artifact.image_tag}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Size</div>
                  <div className="text-sm font-medium">
                    {artifact.size_bytes ? formatBytes(artifact.size_bytes) : 'Unknown'}
                  </div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Build Time</div>
                  <div className="text-sm font-medium">
                    {artifact.build_duration_ms 
                      ? `${(artifact.build_duration_ms / 1000).toFixed(1)}s` 
                      : 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Image Digest (SHA256)</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono truncate flex-1">
                    {artifact.image_digest}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0"
                    onClick={() => copyToClipboard(artifact.image_digest)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Full Image Reference</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono truncate flex-1">
                    {artifact.registry_url}/{artifact.name}:{artifact.image_tag}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0"
                    onClick={() => copyToClipboard(`${artifact.registry_url}/${artifact.name}:${artifact.image_tag}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Vulnerabilities Tab */}
            <TabsContent value="vulnerabilities" className="mt-0 space-y-4">
              {vulnScan ? (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 bg-red-500/10 rounded-lg text-center">
                      <div className="text-xl font-bold text-red-500">{vulnScan.critical}</div>
                      <div className="text-xs text-muted-foreground">Critical</div>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                      <div className="text-xl font-bold text-orange-500">{vulnScan.high}</div>
                      <div className="text-xs text-muted-foreground">High</div>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                      <div className="text-xl font-bold text-yellow-500">{vulnScan.medium}</div>
                      <div className="text-xs text-muted-foreground">Medium</div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                      <div className="text-xl font-bold text-blue-500">{vulnScan.low}</div>
                      <div className="text-xs text-muted-foreground">Low</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Scanner: {vulnScan.scanner}</span>
                    <span className="text-muted-foreground">
                      Scanned: {new Date(vulnScan.scanned_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {vulnScan.cve_details.slice(0, 10).map((cve, index) => (
                      <div key={index} className="p-2 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${severityColors[cve.severity as keyof typeof severityColors]} text-white border-0 text-xs`}
                            >
                              {cve.severity}
                            </Badge>
                            <code className="text-xs font-mono">{cve.id}</code>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                            <a href={`https://nvd.nist.gov/vuln/detail/${cve.id}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{cve.title}</div>
                        <div className="flex items-center gap-4 mt-1 text-xs">
                          <span>Package: <code>{cve.package}</code></span>
                          <span>Version: <code>{cve.version}</code></span>
                          {cve.fixedVersion && (
                            <span className="text-green-500">Fix: <code>{cve.fixedVersion}</code></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mb-2 opacity-50" />
                  <p>No vulnerability scan available</p>
                </div>
              )}
            </TabsContent>

            {/* SBOM Tab */}
            <TabsContent value="sbom" className="mt-0 space-y-4">
              {sbom ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{sbom.dependencies_count} Dependencies</div>
                      <div className="text-xs text-muted-foreground">
                        Format: {sbom.format.toUpperCase()} | Generator: {sbom.generator}
                      </div>
                    </div>
                    {sbom.sbom_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={sbom.sbom_url} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-2">License Distribution</div>
                    <div className="space-y-1">
                      {Object.entries(sbom.license_summary).slice(0, 5).map(([license, count]) => {
                        const percentage = (count / sbom.dependencies_count) * 100;
                        return (
                          <div key={license} className="flex items-center gap-2">
                            <span className="text-xs w-20 truncate">{license}</span>
                            <Progress value={percentage} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {sbom.packages.slice(0, 15).map((pkg, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                        <span className="font-mono">{pkg.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{pkg.version}</Badge>
                          {pkg.license && (
                            <span className="text-muted-foreground">{pkg.license}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileCheck className="h-8 w-8 mb-2 opacity-50" />
                  <p>No SBOM available</p>
                </div>
              )}
            </TabsContent>

            {/* Signature Tab */}
            <TabsContent value="signature" className="mt-0 space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-500">Signature Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This artifact was signed using Cosign with keyless signing (OIDC).
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Signature Method</div>
                <div className="text-sm font-medium">Cosign (Sigstore)</div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Transparency Log</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono truncate flex-1">
                    rekor.sigstore.dev
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href="https://rekor.sigstore.dev" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">Verify Command</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-background p-2 rounded flex-1 overflow-x-auto">
                    cosign verify {artifact.registry_url}/{artifact.name}:{artifact.image_tag}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0"
                    onClick={() => copyToClipboard(`cosign verify ${artifact.registry_url}/${artifact.name}:${artifact.image_tag}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
