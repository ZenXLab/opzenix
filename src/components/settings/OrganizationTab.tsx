import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Github, Globe, Lock, 
  Loader2, Plus, Settings, Trash2, ExternalLink,
  Mail, Crown, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  github_org_name: string | null;
  owner_id: string;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

interface Project {
  id: string;
  name: string;
  github_repo_name: string | null;
  github_repo_owner: string | null;
  is_private: boolean;
  status: string | null;
}

export function OrganizationTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchMembers(selectedOrg.id);
      fetchProjects(selectedOrg.id);
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`owner_id.eq.${user.id},id.in.(select organization_id from organization_members where user_id = '${user.id}')`)
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
      if (data && data.length > 0 && !selectedOrg) {
        setSelectedOrg(data[0]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role
        `)
        .eq('organization_id', orgId);

      if (error) throw error;

      // Fetch profiles for each member
      const memberIds = data?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', memberIds);

      const membersWithProfiles = data?.map(member => ({
        ...member,
        profile: profiles?.find(p => p.id === member.user_id)
      })) || [];

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchProjects = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, github_repo_name, github_repo_owner, is_private, status')
        .eq('organization_id', orgId)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedOrg) return;
    
    try {
      // In a real implementation, you'd send an invitation email
      // For now, we'll just show a success toast
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium mb-2">No Organizations</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create a project to automatically set up your organization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Selector */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium shrink-0">Organization:</Label>
        <div className="flex gap-2 overflow-x-auto">
          {organizations.map((org) => (
            <Button
              key={org.id}
              variant={selectedOrg?.id === org.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedOrg(org)}
              className="gap-2"
            >
              {org.avatar_url ? (
                <Avatar className="w-5 h-5">
                  <AvatarImage src={org.avatar_url} />
                  <AvatarFallback>{org.name[0]}</AvatarFallback>
                </Avatar>
              ) : (
                <Building2 className="w-4 h-4" />
              )}
              {org.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedOrg && (
        <>
          {/* Organization Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedOrg.avatar_url ? (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedOrg.avatar_url} />
                      <AvatarFallback>{selectedOrg.name[0]}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-base">{selectedOrg.name}</CardTitle>
                    <CardDescription>@{selectedOrg.slug}</CardDescription>
                  </div>
                </div>
                {selectedOrg.github_org_name && (
                  <a
                    href={`https://github.com/${selectedOrg.github_org_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedOrg.description && (
                <p className="text-sm text-muted-foreground">{selectedOrg.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Team Members</CardTitle>
                  <Badge variant="secondary" className="text-xs">{members.length}</Badge>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join {selectedOrg.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="flex gap-2">
                          <Mail className="w-5 h-5 text-muted-foreground mt-2" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="colleague@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button onClick={handleInviteMember} className="w-full">
                        Send Invitation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.profile?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.profile?.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                        {member.role === 'owner' && <Crown className="w-3 h-3 mr-1" />}
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Connected Repositories */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Connected Repositories</CardTitle>
                <Badge variant="secondary" className="text-xs">{projects.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No repositories connected
                </p>
              ) : (
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {project.is_private ? (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{project.name}</p>
                            {project.github_repo_owner && project.github_repo_name && (
                              <p className="text-xs text-muted-foreground">
                                {project.github_repo_owner}/{project.github_repo_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={project.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs capitalize"
                          >
                            {project.status || 'active'}
                          </Badge>
                          {project.github_repo_owner && project.github_repo_name && (
                            <a
                              href={`https://github.com/${project.github_repo_owner}/${project.github_repo_name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
