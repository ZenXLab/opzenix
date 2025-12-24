import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  url: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

interface GitHubBranch {
  name: string;
  sha: string;
  protected: boolean;
}

interface StackDetection {
  language: string | null;
  framework: string | null;
  buildTool: string | null;
  confidence: number;
}

interface GitHubOrg {
  login: string;
  id: number;
  avatarUrl: string;
  description: string | null;
}

export function useGitHubConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [organizations, setOrganizations] = useState<GitHubOrg[]>([]);
  const [detectedStack, setDetectedStack] = useState<StackDetection | null>(null);

  // Check for existing GitHub connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: tokenData } = await supabase
          .from('github_tokens')
          .select('encrypted_token, is_valid')
          .eq('user_id', authUser.id)
          .single();

        if (tokenData?.encrypted_token && tokenData.is_valid) {
          // Validate the token
          const { data, error } = await supabase.functions.invoke('github-api', {
            body: {
              action: 'validate-token',
              token: tokenData.encrypted_token
            }
          });

          if (!error && data.valid) {
            setToken(tokenData.encrypted_token);
            setUser(data.user);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('Error checking GitHub connection:', error);
      }
    };

    checkExistingConnection();
  }, []);

  const connectWithToken = useCallback(async (pat: string) => {
    setIsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'validate-token',
          token: pat,
          userId: authUser?.id
        }
      });

      if (error || !data.valid) {
        toast.error('Invalid GitHub token. Please check your PAT and try again.');
        return false;
      }

      setToken(pat);
      setUser(data.user);
      setIsConnected(true);
      toast.success(`Connected as ${data.user.login}`);
      return true;
    } catch (error) {
      console.error('GitHub connection error:', error);
      toast.error('Failed to connect to GitHub');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase
          .from('github_tokens')
          .delete()
          .eq('user_id', authUser.id);
      }

      setToken(null);
      setUser(null);
      setIsConnected(false);
      setRepos([]);
      setBranches([]);
      setOrganizations([]);
      toast.success('GitHub disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  }, []);

  const fetchRepos = useCallback(async () => {
    if (!token) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'list-repos',
          token
        }
      });

      if (error) throw error;
      
      setRepos(data.repos || []);
      return data.repos || [];
    } catch (error) {
      console.error('Error fetching repos:', error);
      toast.error('Failed to fetch repositories');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchBranches = useCallback(async (owner: string, repo: string) => {
    if (!token) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'list-branches',
          token,
          owner,
          repo
        }
      });

      if (error) throw error;
      
      setBranches(data.branches || []);
      return data.branches || [];
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to fetch branches');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const detectStack = useCallback(async (owner: string, repo: string) => {
    if (!token) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'detect-stack',
          token,
          owner,
          repo
        }
      });

      if (error) throw error;
      
      setDetectedStack(data.stack);
      return data.stack as StackDetection;
    } catch (error) {
      console.error('Error detecting stack:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchOrganizations = useCallback(async () => {
    if (!token) return [];
    
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'list-orgs',
          token
        }
      });

      if (error) throw error;
      
      setOrganizations(data.organizations || []);
      return data.organizations || [];
    } catch (error) {
      console.error('Error fetching orgs:', error);
      return [];
    }
  }, [token]);

  const getLatestCommit = useCallback(async (owner: string, repo: string, branch: string) => {
    if (!token) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('github-api', {
        body: {
          action: 'get-commit',
          token,
          owner,
          repo,
          branch
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching commit:', error);
      return null;
    }
  }, [token]);

  return {
    isConnected,
    isLoading,
    user,
    repos,
    branches,
    organizations,
    detectedStack,
    connectWithToken,
    disconnect,
    fetchRepos,
    fetchBranches,
    detectStack,
    fetchOrganizations,
    getLatestCommit
  };
}