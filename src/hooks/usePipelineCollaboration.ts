import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Node, Edge } from '@xyflow/react';

interface CollaboratorCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  mode: 'viewing' | 'editing';
}

const CURSOR_COLORS = [
  'hsl(var(--ai-primary))',
  'hsl(var(--sec-safe))',
  'hsl(var(--sec-warning))',
  'hsl(var(--node-paused))',
  'hsl(var(--primary))',
];

const COLLABORATOR_NAMES = ['Sarah C.', 'Mike J.', 'Emma W.', 'David L.', 'Anna P.', 'James K.', 'Lisa R.'];

export const usePipelineCollaboration = (
  pipelineId: string,
  isActive: boolean
) => {
  const [collaborators, setCollaborators] = useState<CollaboratorCursor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  const [userId] = useState(() => `user-${Math.random().toString(36).slice(2, 8)}`);
  const [userName] = useState(() => COLLABORATOR_NAMES[Math.floor(Math.random() * COLLABORATOR_NAMES.length)]);
  const [userColor] = useState(() => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  // Setup channel subscription
  useEffect(() => {
    if (!isActive || !pipelineId) return;

    const channelName = `pipeline-collab-${pipelineId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } }
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const cursors: CollaboratorCursor[] = [];
      
      Object.entries(state).forEach(([key, presences]) => {
        if (key !== userId && presences.length > 0) {
          const presence = presences[0] as any;
          cursors.push({
            id: key,
            name: presence.name || 'Unknown',
            color: presence.color || CURSOR_COLORS[0],
            x: presence.x || 0,
            y: presence.y || 0,
            mode: presence.mode || 'viewing',
          });
        }
      });
      
      setCollaborators(cursors);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await channel.track({
          name: userName,
          color: userColor,
          x: 0,
          y: 0,
          mode: 'viewing' as const,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [pipelineId, isActive, userId, userName, userColor]);

  // Update cursor position
  const updateCursor = useCallback(async (x: number, y: number, mode: 'viewing' | 'editing' = 'viewing') => {
    if (!channelRef.current || !isConnected) return;
    
    await channelRef.current.track({
      name: userName,
      color: userColor,
      x,
      y,
      mode,
    });
  }, [isConnected, userName, userColor]);

  // Broadcast node changes
  const broadcastNodeChange = useCallback((nodes: Node[]) => {
    if (!channelRef.current || !isConnected) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'nodes_update',
      payload: { userId, nodes }
    });
  }, [isConnected, userId]);

  // Broadcast edge changes
  const broadcastEdgeChange = useCallback((edges: Edge[]) => {
    if (!channelRef.current || !isConnected) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'edges_update',
      payload: { userId, edges }
    });
  }, [isConnected, userId]);

  // Subscribe to node/edge updates from others
  const subscribeToUpdates = useCallback((
    onNodesUpdate: (nodes: Node[]) => void,
    onEdgesUpdate: (edges: Edge[]) => void
  ) => {
    if (!channelRef.current) return () => {};

    channelRef.current.on('broadcast', { event: 'nodes_update' }, ({ payload }) => {
      if (payload.userId !== userId) {
        onNodesUpdate(payload.nodes);
      }
    });

    channelRef.current.on('broadcast', { event: 'edges_update' }, ({ payload }) => {
      if (payload.userId !== userId) {
        onEdgesUpdate(payload.edges);
      }
    });

    return () => {};
  }, [userId]);

  return {
    collaborators,
    isConnected,
    userId,
    userName,
    userColor,
    updateCursor,
    broadcastNodeChange,
    broadcastEdgeChange,
    subscribeToUpdates,
  };
};

export default usePipelineCollaboration;
