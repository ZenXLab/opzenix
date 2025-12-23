import { useState, useEffect, useCallback } from 'react';
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

interface CollaboratorState {
  cursors: CollaboratorCursor[];
  nodes: Node[];
  edges: Edge[];
}

const CURSOR_COLORS = [
  'hsl(var(--ai-primary))',
  'hsl(var(--sec-safe))',
  'hsl(var(--sec-warning))',
  'hsl(var(--node-paused))',
  'hsl(var(--primary))',
];

export const useRealtimeCollaboration = (
  channelName: string,
  currentNodes: Node[],
  currentEdges: Edge[],
  onNodesUpdate: (nodes: Node[]) => void,
  onEdgesUpdate: (edges: Edge[]) => void
) => {
  const [collaborators, setCollaborators] = useState<CollaboratorCursor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userId] = useState(() => `user-${Math.random().toString(36).slice(2, 8)}`);
  const [userName] = useState(() => {
    const names = ['Sarah C.', 'Mike J.', 'Emma W.', 'David L.', 'Anna P.'];
    return names[Math.floor(Math.random() * names.length)];
  });
  const [userColor] = useState(() => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  useEffect(() => {
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

    // Handle broadcast for node/edge updates
    channel.on('broadcast', { event: 'nodes_update' }, ({ payload }) => {
      if (payload.userId !== userId) {
        onNodesUpdate(payload.nodes);
      }
    });

    channel.on('broadcast', { event: 'edges_update' }, ({ payload }) => {
      if (payload.userId !== userId) {
        onEdgesUpdate(payload.edges);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await channel.track({
          name: userName,
          color: userColor,
          x: 0,
          y: 0,
          mode: 'viewing',
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [channelName, userId, userName, userColor, onNodesUpdate, onEdgesUpdate]);

  const updateCursorPosition = useCallback(async (x: number, y: number, mode: 'viewing' | 'editing' = 'viewing') => {
    const channel = supabase.channel(channelName);
    await channel.track({
      name: userName,
      color: userColor,
      x,
      y,
      mode,
    });
  }, [channelName, userName, userColor]);

  const broadcastNodesUpdate = useCallback((nodes: Node[]) => {
    const channel = supabase.channel(channelName);
    channel.send({
      type: 'broadcast',
      event: 'nodes_update',
      payload: { userId, nodes }
    });
  }, [channelName, userId]);

  const broadcastEdgesUpdate = useCallback((edges: Edge[]) => {
    const channel = supabase.channel(channelName);
    channel.send({
      type: 'broadcast',
      event: 'edges_update',
      payload: { userId, edges }
    });
  }, [channelName, userId]);

  return {
    collaborators,
    isConnected,
    userId,
    userName,
    userColor,
    updateCursorPosition,
    broadcastNodesUpdate,
    broadcastEdgesUpdate,
  };
};

export default useRealtimeCollaboration;
