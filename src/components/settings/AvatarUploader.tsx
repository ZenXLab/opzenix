import { useState, useRef } from 'react';
import { Upload, Sparkles, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AvatarUploaderProps {
  open: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  userName?: string;
  onAvatarChange: (url: string) => void;
  userId: string;
}

// Generate avatar options using UI Avatars API (no external dependency)
const generateAvatarOptions = (name: string) => {
  const colors = [
    { bg: '0ea5e9', fg: 'ffffff' }, // Sky
    { bg: '8b5cf6', fg: 'ffffff' }, // Violet
    { bg: 'f97316', fg: 'ffffff' }, // Orange
    { bg: '22c55e', fg: 'ffffff' }, // Green
    { bg: 'ec4899', fg: 'ffffff' }, // Pink
    { bg: '06b6d4', fg: 'ffffff' }, // Cyan
    { bg: 'eab308', fg: '000000' }, // Yellow
    { bg: '6366f1', fg: 'ffffff' }, // Indigo
  ];

  return colors.map((color, i) => ({
    id: `generated-${i}`,
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color.bg}&color=${color.fg}&size=256&bold=true&format=png`,
    style: `${color.bg}`,
  }));
};

export function AvatarUploader({
  open,
  onClose,
  currentAvatarUrl,
  userName = 'User',
  onAvatarChange,
  userId,
}: AvatarUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'generate'>('generate');
  const [uploading, setUploading] = useState(false);
  const [selectedGenerated, setSelectedGenerated] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generatedAvatars = generateAvatarOptions(userName);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onAvatarChange(publicUrl);
      toast.success('Avatar uploaded successfully');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectGenerated = async () => {
    if (!selectedGenerated) {
      toast.error('Please select an avatar');
      return;
    }

    setUploading(true);

    try {
      // Fetch the generated avatar and upload it
      const response = await fetch(selectedGenerated);
      const blob = await response.blob();
      const fileName = `${userId}/avatar-generated-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onAvatarChange(publicUrl);
      toast.success('Avatar saved successfully');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Avatar</DialogTitle>
          <DialogDescription>
            Upload your own image or generate one using Opzenix AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={selectedGenerated || currentAvatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'generate')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose from AI-generated avatars based on your name
            </p>
            <div className="grid grid-cols-4 gap-3">
              {generatedAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedGenerated(avatar.url)}
                  className={`rounded-full p-0.5 transition-all ${
                    selectedGenerated === avatar.url
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:ring-2 hover:ring-muted hover:ring-offset-2 hover:ring-offset-background'
                  }`}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={avatar.url} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
            <Button
              onClick={handleSelectGenerated}
              disabled={!selectedGenerated || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Use Selected Avatar'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatar-upload">Upload Image</Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG or GIF. Max 2MB.
              </p>
            </div>
            {uploading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm">Uploading...</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
