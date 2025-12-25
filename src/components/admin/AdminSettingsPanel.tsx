import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Shield,
  Lock,
  Settings2,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Crown,
  UserCog,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// 🔐 ADMIN SETTINGS PANEL - Enterprise Control
// ============================================

type TabValue = 'users' | 'environments' | 'features';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'operator' | 'viewer';
  created_at: string;
  profile?: {
    email: string;
    full_name: string;
    avatar_url: string;
  };
}

interface EnvironmentLock {
  id: string;
  environment: string;
  is_locked: boolean;
  lock_reason: string | null;
  required_role: 'admin' | 'operator' | 'viewer';
  requires_approval: boolean;
  updated_at: string;
}

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  roles: string[];
}

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'bg-primary', icon: Crown, description: 'Full access to all features' },
  operator: { label: 'Operator', color: 'bg-blue-500', icon: UserCog, description: 'Deploy and manage pipelines' },
  viewer: { label: 'Viewer', color: 'bg-muted-foreground', icon: Eye, description: 'Read-only access' },
};

const ENVIRONMENT_CONFIG = [
  { id: 'dev', label: 'Development', color: 'bg-sec-safe' },
  { id: 'uat', label: 'UAT Testing', color: 'bg-blue-500' },
  { id: 'staging', label: 'Staging', color: 'bg-yellow-500' },
  { id: 'preprod', label: 'Pre-Production', color: 'bg-orange-500' },
  { id: 'prod', label: 'Production', color: 'bg-sec-danger' },
];

const DEFAULT_FEATURES: FeatureToggle[] = [
  { id: 'artifacts', name: 'Artifacts Registry', description: 'Browse and manage build artifacts', enabled: true, roles: ['admin', 'operator', 'viewer'] },
  { id: 'audit', name: 'Audit Logs', description: 'View immutable audit trail', enabled: true, roles: ['admin', 'operator', 'viewer'] },
  { id: 'security', name: 'Security Center', description: 'Vulnerability scans and compliance', enabled: true, roles: ['admin', 'operator'] },
  { id: 'secrets', name: 'Secrets Vault', description: 'Manage secrets and environment variables', enabled: true, roles: ['admin'] },
  { id: 'terminal', name: 'Debug Console', description: 'Troubleshooting pipeline issues', enabled: true, roles: ['admin'] },
  { id: 'approvals', name: 'Approval Workflows', description: 'Manual approval gates', enabled: true, roles: ['admin', 'operator'] },
  { id: 'rollback', name: 'Rollback Controls', description: 'Deployment rollback capabilities', enabled: true, roles: ['admin', 'operator'] },
  { id: 'breakglass', name: 'Break Glass', description: 'Emergency override for production', enabled: true, roles: ['admin'] },
];

export function AdminSettingsPanel() {
  const [activeTab, setActiveTab] = useState<TabValue>('users');
  const [users, setUsers] = useState<UserRole[]>([]);
  const [locks, setLocks] = useState<EnvironmentLock[]>([]);
  const [features, setFeatures] = useState<FeatureToggle[]>(DEFAULT_FEATURES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editRoleDialog, setEditRoleDialog] = useState<{ open: boolean; user: UserRole | null }>({ open: false, user: null });
  const [editLockDialog, setEditLockDialog] = useState<{ open: boolean; lock: EnvironmentLock | null }>({ open: false, lock: null });
  const [newRole, setNewRole] = useState<'admin' | 'operator' | 'viewer'>('viewer');
  const [lockReason, setLockReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user roles with profiles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (rolesData) {
        // Fetch profiles separately
        const userIds = rolesData.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds);

        const usersWithProfiles = rolesData.map(role => ({
          ...role,
          profile: profilesData?.find(p => p.id === role.user_id),
        }));

        setUsers(usersWithProfiles as UserRole[]);
      }

      // Fetch environment locks
      const { data: locksData } = await supabase
        .from('environment_locks')
        .select('*')
        .order('environment');

      if (locksData) {
        setLocks(locksData as EnvironmentLock[]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editRoleDialog.user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', editRoleDialog.user.id);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        action: 'role_update',
        resource_type: 'user_role',
        resource_id: editRoleDialog.user.id,
        details: { 
          old_role: editRoleDialog.user.role, 
          new_role: newRole,
          user_id: editRoleDialog.user.user_id,
        },
      });

      toast.success('Role updated successfully');
      setEditRoleDialog({ open: false, user: null });
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleToggleLock = async (lock: EnvironmentLock) => {
    try {
      const { error } = await supabase
        .from('environment_locks')
        .update({ 
          is_locked: !lock.is_locked,
          lock_reason: !lock.is_locked ? lockReason || 'Locked by admin' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lock.id);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        action: lock.is_locked ? 'environment_unlock' : 'environment_lock',
        resource_type: 'environment_lock',
        resource_id: lock.id,
        details: { environment: lock.environment, reason: lockReason },
      });

      toast.success(`${lock.environment} ${lock.is_locked ? 'unlocked' : 'locked'}`);
      setEditLockDialog({ open: false, lock: null });
      setLockReason('');
      fetchData();
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Failed to update environment lock');
    }
  };

  const handleToggleFeature = (featureId: string, enabled: boolean) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, enabled } : f
    ));
    toast.success(`Feature ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleToggleFeatureRole = (featureId: string, role: string, add: boolean) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const roles = add 
        ? [...f.roles, role]
        : f.roles.filter(r => r !== role);
      return { ...f, roles };
    }));
  };

  const filteredUsers = users.filter(user => 
    !searchQuery || 
    user.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border px-6 py-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Settings</h1>
              <p className="text-xs text-muted-foreground">Manage users, environments, and features</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/30 px-6">
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary/10">
              <Users className="w-4 h-4" />
              User Roles
              <Badge variant="secondary" className="text-[10px]">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="environments" className="gap-2 data-[state=active]:bg-primary/10">
              <Lock className="w-4 h-4" />
              Environment Locks
              <Badge variant="secondary" className="text-[10px]">{locks.filter(l => l.is_locked).length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2 data-[state=active]:bg-primary/10">
              <Shield className="w-4 h-4" />
              Feature Toggles
              <Badge variant="secondary" className="text-[10px]">{features.filter(f => f.enabled).length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Users Tab */}
          <TabsContent value="users" className="p-6 m-0">
            <div className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Badge variant="outline" className="text-xs">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* User List */}
              <div className="grid gap-3">
                {filteredUsers.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role];
                  const RoleIcon = roleConfig.icon;

                  return (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              {user.profile?.avatar_url ? (
                                <img src={user.profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                <Users className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {user.profile?.full_name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.profile?.email || user.user_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={cn('gap-1.5', roleConfig.color)}>
                              <RoleIcon className="w-3 h-3" />
                              {roleConfig.label}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setNewRole(user.role);
                                setEditRoleDialog({ open: true, user });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Environments Tab */}
          <TabsContent value="environments" className="p-6 m-0">
            <div className="grid gap-4">
              {ENVIRONMENT_CONFIG.map((env) => {
                const lock = locks.find(l => l.environment.toLowerCase() === env.id);
                const isLocked = lock?.is_locked ?? false;

                return (
                  <Card key={env.id} className={cn(
                    'transition-all',
                    isLocked && 'border-sec-warning/50 bg-sec-warning/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn('w-3 h-3 rounded-full', env.color)} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{env.label}</p>
                            {lock?.lock_reason && (
                              <p className="text-xs text-sec-warning mt-0.5">{lock.lock_reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {lock?.requires_approval && (
                            <Badge variant="outline" className="text-[10px]">Requires Approval</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {lock?.required_role || 'admin'} only
                          </Badge>
                          <div className="flex items-center gap-2">
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-sec-warning" />
                            ) : (
                              <Check className="w-4 h-4 text-sec-safe" />
                            )}
                            <Switch
                              checked={!isLocked}
                              onCheckedChange={() => {
                                if (lock) {
                                  if (!isLocked) {
                                    setEditLockDialog({ open: true, lock });
                                  } else {
                                    handleToggleLock(lock);
                                  }
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground w-16">
                              {isLocked ? 'Locked' : 'Open'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-lg border border-border bg-muted/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-sec-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Environment Lock Policy</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Locking an environment prevents all deployments until unlocked by an admin.
                    All lock/unlock actions are recorded in the immutable audit log.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="p-6 m-0">
            <div className="grid gap-4">
              {features.map((feature) => (
                <Card key={feature.id} className={cn(
                  'transition-all',
                  !feature.enabled && 'opacity-60'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-foreground">{feature.name}</p>
                          <Badge variant={feature.enabled ? 'default' : 'secondary'} className="text-[10px]">
                            {feature.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        
                        {/* Role Access */}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] text-muted-foreground">Access:</span>
                          {(['admin', 'operator', 'viewer'] as const).map((role) => {
                            const hasRole = feature.roles.includes(role);
                            return (
                              <button
                                key={role}
                                onClick={() => handleToggleFeatureRole(feature.id, role, !hasRole)}
                                className={cn(
                                  'px-2 py-1 rounded text-[10px] font-medium transition-colors',
                                  hasRole 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                )}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog.open} onOpenChange={(open) => setEditRoleDialog({ open, user: open ? editRoleDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editRoleDialog.user?.profile?.full_name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{config.label}</span>
                          <span className="text-xs text-muted-foreground">- {config.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Environment Dialog */}
      <Dialog open={editLockDialog.open} onOpenChange={(open) => setEditLockDialog({ open, lock: open ? editLockDialog.lock : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Environment</DialogTitle>
            <DialogDescription>
              Provide a reason for locking {editLockDialog.lock?.environment}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lock Reason</Label>
              <Textarea
                placeholder="e.g., Scheduled maintenance window"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLockDialog({ open: false, lock: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => editLockDialog.lock && handleToggleLock(editLockDialog.lock)}>
              Lock Environment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSettingsPanel;
