import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Eye, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  mode: 'viewing' | 'editing';
  cursorPosition?: { x: number; y: number };
  lastSeen: string;
}

const AVATAR_COLORS = [
  'hsl(var(--node-running))',
  'hsl(var(--node-success))',
  'hsl(var(--ai-primary))',
  'hsl(var(--ai-secondary))',
  'hsl(var(--node-warning))',
  'hsl(var(--sec-safe))',
];

interface PresenceIndicatorsProps {
  channelName?: string;
  showCursors?: boolean;
}

const PresenceIndicators = ({ channelName = 'pipeline-editor', showCursors = true }: PresenceIndicatorsProps) => {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [currentUserId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const [currentUserName] = useState(() => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    return names[Math.floor(Math.random() * names.length)];
  });
  const [currentUserColor] = useState(() => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

  useEffect(() => {
    const channel = supabase.channel(channelName);

    // Set up presence tracking
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.user_id !== currentUserId) {
              users.push({
                id: presence.user_id,
                name: presence.user_name,
                color: presence.color,
                mode: presence.mode || 'viewing',
                cursorPosition: presence.cursor,
                lastSeen: presence.online_at,
              });
            }
          });
        });
        
        setPresenceUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track our own presence
          await channel.track({
            user_id: currentUserId,
            user_name: currentUserName,
            color: currentUserColor,
            mode: 'viewing',
            online_at: new Date().toISOString(),
          });
        }
      });

    // Track cursor movement if enabled
    const handleMouseMove = (e: MouseEvent) => {
      if (showCursors) {
        channel.track({
          user_id: currentUserId,
          user_name: currentUserName,
          color: currentUserColor,
          mode: 'editing',
          cursor: { x: e.clientX, y: e.clientY },
          online_at: new Date().toISOString(),
        });
      }
    };

    if (showCursors) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (showCursors) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      supabase.removeChannel(channel);
    };
  }, [channelName, currentUserId, currentUserName, currentUserColor, showCursors]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Current User */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium ring-2 ring-background"
              style={{ 
                backgroundColor: currentUserColor,
                borderColor: currentUserColor,
              }}
            >
              <span className="text-background font-semibold">
                {currentUserName.charAt(0)}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{currentUserName} (You)</p>
          </TooltipContent>
        </Tooltip>

        {/* Other Users */}
        <AnimatePresence>
          {presenceUsers.slice(0, 5).map((user, index) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium ring-2 ring-background relative',
                    index > 0 && '-ml-2'
                  )}
                  style={{ 
                    backgroundColor: user.color,
                    borderColor: user.color,
                    zIndex: presenceUsers.length - index,
                  }}
                >
                  <span className="text-background font-semibold">
                    {user.name.charAt(0)}
                  </span>
                  {/* Mode Indicator */}
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center',
                    user.mode === 'editing' ? 'bg-node-warning' : 'bg-sec-safe'
                  )}>
                    {user.mode === 'editing' ? (
                      <Edit3 className="w-2 h-2 text-background" />
                    ) : (
                      <Eye className="w-2 h-2 text-background" />
                    )}
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{user.name}</span>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded',
                    user.mode === 'editing' ? 'bg-node-warning/20 text-node-warning' : 'bg-sec-safe/20 text-sec-safe'
                  )}>
                    {user.mode === 'editing' ? 'Editing' : 'Viewing'}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </AnimatePresence>

        {/* Overflow indicator */}
        {presenceUsers.length > 5 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-medium -ml-2">
                +{presenceUsers.length - 5}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{presenceUsers.length - 5} more users</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Total count */}
        <div className="ml-2 px-2 py-1 bg-secondary/50 rounded-md flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-sec-safe animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {presenceUsers.length + 1} online
          </span>
        </div>
      </div>

      {/* Remote Cursors */}
      {showCursors && (
        <AnimatePresence>
          {presenceUsers
            .filter((u) => u.cursorPosition)
            .map((user) => (
              <motion.div
                key={`cursor-${user.id}`}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  x: user.cursorPosition!.x,
                  y: user.cursorPosition!.y,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                className="fixed pointer-events-none z-[100]"
                style={{ left: 0, top: 0 }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: user.color }}
                >
                  <path
                    d="M5.65376 12.4563L8.98696 11.2286L12.5 12.5L5.65376 3.00376L5.65376 12.4563Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <div
                  className="absolute left-4 top-4 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                  style={{ 
                    backgroundColor: user.color,
                    color: 'hsl(var(--background))',
                  }}
                >
                  {user.name}
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      )}
    </TooltipProvider>
  );
};

export default PresenceIndicators;
