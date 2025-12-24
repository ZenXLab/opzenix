import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, CheckCircle2, AlertCircle, Loader2, 
  ExternalLink, LogOut, Key, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGitHubConnection } from '@/hooks/useGitHubConnection';

interface GitHubConnectionCardProps {
  onConnected?: () => void;
  compact?: boolean;
}

export function GitHubConnectionCard({ onConnected, compact = false }: GitHubConnectionCardProps) {
  const {
    isConnected,
    isLoading,
    user,
    connectWithToken,
    disconnect,
    fetchRepos
  } = useGitHubConnection();

  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);

  const handleConnect = async () => {
    if (!tokenInput.trim()) return;
    
    const success = await connectWithToken(tokenInput.trim());
    if (success) {
      setTokenInput('');
      setShowTokenInput(false);
      onConnected?.();
    }
  };

  if (compact && isConnected && user) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar_url} alt={user.login} />
          <AvatarFallback>{user.login[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.login}</p>
          <p className="text-xs text-muted-foreground">GitHub Connected</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">GitHub Connection</CardTitle>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          {isConnected 
            ? 'Your GitHub account is connected. You can access your repositories.'
            : 'Connect your GitHub account to access your repositories.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {isConnected && user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} alt={user.login} />
                  <AvatarFallback>{user.login[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.name || user.login}</p>
                  <p className="text-sm text-muted-foreground">@{user.login}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>
                <a 
                  href={`https://github.com/${user.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchRepos()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Repos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnect}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </div>
            </motion.div>
          ) : showTokenInput ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="github-token">Personal Access Token</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="github-token"
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="pl-10 pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Create a token with <code className="bg-secondary px-1 rounded">repo</code> and{' '}
                  <code className="bg-secondary px-1 rounded">read:org</code> scopes at{' '}
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,read:org&description=Opzenix%20Pipeline"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Settings
                  </a>
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleConnect}
                  disabled={!tokenInput.trim() || isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Connect
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTokenInput(false);
                    setTokenInput('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button
                onClick={() => setShowTokenInput(true)}
                className="gap-2 w-full"
              >
                <GitBranch className="h-4 w-4" />
                Connect with GitHub
              </Button>
              
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Why a Personal Access Token?</p>
                    <p>PATs provide secure access to your repos without storing passwords. Your token is encrypted and never shared.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}