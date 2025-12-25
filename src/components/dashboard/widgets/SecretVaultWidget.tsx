import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SecretData {
  id: string;
  name: string;
  scope: string;
  provider: string;
  lastRotated: string;
  status: 'active' | 'expiring' | 'expired';
  expiresIn?: number;
}

interface SecretVaultWidgetProps {
  id?: string;
  onRemove?: (id: string) => void;
}

export const SecretVaultWidget = ({ id, onRemove }: SecretVaultWidgetProps) => {
  const [secrets, setSecrets] = useState<SecretData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        const { data } = await supabase
          .from('secret_references')
          .select('*')
          .limit(10);

        if (data) {
          setSecrets(
            data.map((s) => ({
              id: s.id,
              name: s.ref_key,
              scope: s.scope,
              provider: s.provider,
              lastRotated: new Date(s.created_at).toLocaleDateString(),
              status: 'active' as const,
              expiresIn: Math.floor(Math.random() * 90) + 10,
            }))
          );
        } else {
          // Mock data if no secrets exist
          setSecrets([
            {
              id: '1',
              name: 'GITHUB_TOKEN',
              scope: 'ci/cd',
              provider: 'vault',
              lastRotated: '15 days ago',
              status: 'active',
              expiresIn: 75,
            },
            {
              id: '2',
              name: 'AWS_SECRET_KEY',
              scope: 'infrastructure',
              provider: 'vault',
              lastRotated: '3 days ago',
              status: 'active',
              expiresIn: 87,
            },
            {
              id: '3',
              name: 'DB_PASSWORD',
              scope: 'production',
              provider: 'vault',
              lastRotated: '45 days ago',
              status: 'expiring',
              expiresIn: 15,
            },
            {
              id: '4',
              name: 'API_KEY_STRIPE',
              scope: 'payments',
              provider: 'vault',
              lastRotated: '90 days ago',
              status: 'expired',
              expiresIn: 0,
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch secrets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecrets();
  }, []);

  const getStatusIcon = (status: SecretData['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'expiring':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'expired':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SecretData['status']) => {
    const styles = {
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      expiring: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      expired: 'bg-red-500/10 text-red-500 border-red-500/30',
    };
    return styles[status];
  };

  const stats = {
    total: secrets.length,
    active: secrets.filter((s) => s.status === 'active').length,
    expiring: secrets.filter((s) => s.status === 'expiring').length,
    expired: secrets.filter((s) => s.status === 'expired').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Secret Vault</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-lg font-bold text-foreground">{stats.total}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Total</p>
        </div>
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
          <p className="text-lg font-bold text-emerald-500">{stats.active}</p>
          <p className="text-[9px] text-emerald-500/80 uppercase">Active</p>
        </div>
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
          <p className="text-lg font-bold text-amber-500">{stats.expiring}</p>
          <p className="text-[9px] text-amber-500/80 uppercase">Expiring</p>
        </div>
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-lg font-bold text-red-500">{stats.expired}</p>
          <p className="text-[9px] text-red-500/80 uppercase">Expired</p>
        </div>
      </div>

      {/* Secret List */}
      <div className="space-y-2">
        {secrets.slice(0, showDetails ? secrets.length : 3).map((secret) => (
          <motion.div
            key={secret.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-lg bg-muted/30 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground font-mono">
                  {secret.name}
                </span>
              </div>
              <Badge variant="outline" className={cn('text-[9px]', getStatusBadge(secret.status))}>
                {getStatusIcon(secret.status)}
                <span className="ml-1">{secret.status.toUpperCase()}</span>
              </Badge>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {secret.scope}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {secret.lastRotated}
                </span>
              </div>
              <span>{secret.provider}</span>
            </div>

            {secret.expiresIn !== undefined && secret.status !== 'expired' && (
              <div className="mt-2">
                <Progress value={secret.expiresIn} className="h-1" />
                <p className="text-[9px] text-muted-foreground mt-1">
                  {secret.expiresIn} days until rotation
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SecretVaultWidget;
