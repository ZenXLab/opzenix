import { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Building2, Briefcase, Github, 
  Globe, Loader2, Save, Camera, Wand2, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company: string | null;
  job_title: string | null;
  github_username: string | null;
  timezone: string | null;
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney'
];

// Background colors for auto-generated avatars
const AVATAR_BACKGROUNDS = [
  '0D47A1', '1565C0', '1976D2', '2196F3', // Blues
  '00695C', '00897B', '009688', '26A69A', // Teals
  '4A148C', '6A1B9A', '7B1FA2', '8E24AA', // Purples
  'BF360C', 'D84315', 'E64A19', 'F4511E', // Deep Orange
  '1B5E20', '2E7D32', '388E3C', '43A047', // Greens
];

export function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setCompany(data.company || '');
        setJobTitle(data.job_title || '');
        setTimezone(data.timezone || 'UTC');
      } else {
        // Profile doesn't exist, create one
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
          avatar_url: null,
          company: null,
          job_title: null,
          timezone: 'UTC',
          github_username: null
        };
        
        // Use upsert to handle potential race conditions
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else if (createdProfile) {
          setProfile(createdProfile);
          setFullName(createdProfile.full_name || '');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          company: company.trim() || null,
          job_title: jobTitle.trim() || null,
          timezone,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Avatar uploaded successfully');
      fetchProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const generateOpzenixAvatar = async () => {
    if (!profile) return;

    setUploadingAvatar(true);
    try {
      const name = fullName || profile.email?.split('@')[0] || 'User';
      const randomBg = AVATAR_BACKGROUNDS[Math.floor(Math.random() * AVATAR_BACKGROUNDS.length)];
      
      // Use UI Avatars service for auto-generation
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomBg}&color=ffffff&size=256&bold=true&format=png`;

      // Update profile with generated avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Avatar generated by Opzenix');
      fetchProfile();
    } catch (error) {
      console.error('Error generating avatar:', error);
      toast.error('Failed to generate avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Profile not found</p>
        <Button onClick={fetchProfile} className="mt-4" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const displayName = fullName || profile.full_name || profile.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6">
      {/* Avatar & Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Information</CardTitle>
          <CardDescription>Your personal information and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={generateOpzenixAvatar} className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Generate by Opzenix
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-medium">{displayName}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.github_username && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Github className="w-3.5 h-3.5" />
                  {profile.github_username}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="pl-10"
                    placeholder="Acme Inc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="job-title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="pl-10"
                    placeholder="DevOps Engineer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Connected Accounts</CardTitle>
          <CardDescription>Manage your connected services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <p className="text-xs text-muted-foreground">
                  {profile.github_username 
                    ? `Connected as @${profile.github_username}` 
                    : 'Not connected'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {profile.github_username ? 'Manage' : 'Connect'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}