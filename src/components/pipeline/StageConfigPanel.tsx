import { useState, useEffect } from 'react';
import { X, Settings, Trash2, Play, Code, Terminal, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Node } from '@xyflow/react';

interface StageConfigPanelProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
}

const StageConfigPanel = ({ node, onClose, onUpdate, onDelete }: StageConfigPanelProps) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [command, setCommand] = useState('');
  const [timeout, setTimeout] = useState('300');
  const [retries, setRetries] = useState('0');

  useEffect(() => {
    if (node) {
      setLabel((node.data as any).label || '');
      setDescription((node.data as any).description || '');
      setCommand((node.data as any).command || '');
      setTimeout((node.data as any).timeout || '300');
      setRetries((node.data as any).retries || '0');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onUpdate(node.id, {
      ...node.data,
      label,
      description,
      command,
      timeout,
      retries,
    });
  };

  const stageType = (node.data as any).stageType;

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Configure Stage</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stage Type Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded uppercase">
            {stageType}
          </span>
          <span className="text-xs text-muted-foreground">#{node.id.slice(-6)}</span>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Stage Name</label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter stage name"
            className="bg-background"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            className="bg-background"
          />
        </div>

        {/* Command (for build/test/deploy) */}
        {['build', 'test', 'deploy', 'security'].includes(stageType) && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              Command
            </label>
            <Textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npm run build"
              className="bg-background font-mono text-xs min-h-[80px]"
            />
          </div>
        )}

        {/* Timeout */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Timeout (seconds)
          </label>
          <Input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Retries */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Retries on Failure</label>
          <Input
            type="number"
            value={retries}
            onChange={(e) => setRetries(e.target.value)}
            min="0"
            max="5"
            className="bg-background"
          />
        </div>

        {/* Environment Variables Preview */}
        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">Available Variables</p>
          <div className="space-y-1 text-xs font-mono text-muted-foreground">
            <p>$&#123;COMMIT_SHA&#125;</p>
            <p>$&#123;BRANCH&#125;</p>
            <p>$&#123;ENVIRONMENT&#125;</p>
            <p>$&#123;VERSION&#125;</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
        <Button size="sm" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default StageConfigPanel;
