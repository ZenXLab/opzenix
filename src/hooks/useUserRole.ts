import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSidebarStore, UserRole, SidebarMode, MODE_CONFIG } from '@/stores/sidebarStore';

type AppRole = 'admin' | 'operator' | 'viewer';

// Map database roles to sidebar roles
const roleMapping: Record<AppRole, UserRole> = {
  admin: 'platform',
  operator: 'devops',
  viewer: 'junior',
};

// Map sidebar roles to default modes
const defaultModes: Record<UserRole, SidebarMode> = {
  junior: 'monitor',
  devops: 'build',
  sre: 'monitor',
  platform: 'govern',
  security: 'govern',
};

export function useUserRole() {
  const [dbRole, setDbRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { setUserRole, setMode } = useSidebarStore();

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.log('[UserRole] No authenticated user, defaulting to viewer');
          setDbRole('viewer');
          setUserRole('junior');
          setMode('monitor');
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Fetch role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError || !roleData) {
          console.log('[UserRole] No role found, defaulting to viewer');
          setDbRole('viewer');
          setUserRole('junior');
          setMode('monitor');
        } else {
          const role = roleData.role as AppRole;
          const sidebarRole = roleMapping[role];
          const defaultMode = defaultModes[sidebarRole];
          
          console.log(`[UserRole] User ${user.id} has role: ${role} -> ${sidebarRole}, default mode: ${defaultMode}`);
          setDbRole(role);
          setUserRole(sidebarRole);
          setMode(defaultMode);
        }
      } catch (error) {
        console.error('[UserRole] Error fetching user role:', error);
        setDbRole('viewer');
        setUserRole('junior');
        setMode('monitor');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserRole();
      } else if (event === 'SIGNED_OUT') {
        setDbRole('viewer');
        setUserRole('junior');
        setMode('monitor');
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUserRole, setMode]);

  return {
    role: dbRole,
    userId,
    loading,
    isAdmin: dbRole === 'admin',
    isOperator: dbRole === 'operator' || dbRole === 'admin',
    isViewer: dbRole === 'viewer',
  };
}
