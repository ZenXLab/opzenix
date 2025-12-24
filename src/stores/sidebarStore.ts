import { create } from 'zustand';

export type SidebarMode = 'monitor' | 'build' | 'investigate' | 'govern';
export type UserRole = 'junior' | 'devops' | 'sre' | 'platform' | 'security';

interface ModeConfig {
  id: SidebarMode;
  label: string;
  description: string;
  icon: string;
  allowedRoles: UserRole[];
  defaultForRoles: UserRole[];
}

export const MODE_CONFIG: ModeConfig[] = [
  {
    id: 'monitor',
    label: 'Monitor',
    description: 'Observe system health & live activity',
    icon: 'Activity',
    allowedRoles: ['junior', 'devops', 'sre', 'platform', 'security'],
    defaultForRoles: ['junior', 'sre'],
  },
  {
    id: 'build',
    label: 'Build & Deploy',
    description: 'Deploy safely without knowing CI/CD internals',
    icon: 'Rocket',
    allowedRoles: ['junior', 'devops', 'sre', 'platform'],
    defaultForRoles: ['devops'],
  },
  {
    id: 'investigate',
    label: 'Investigate',
    description: 'Fix issues fast, without hunting',
    icon: 'Search',
    allowedRoles: ['devops', 'sre', 'platform'],
    defaultForRoles: [],
  },
  {
    id: 'govern',
    label: 'Govern',
    description: 'Control, compliance, and governance',
    icon: 'Shield',
    allowedRoles: ['platform', 'security'],
    defaultForRoles: ['platform', 'security'],
  },
];

interface SidebarState {
  mode: SidebarMode;
  collapsed: boolean;
  userRole: UserRole;
  
  setMode: (mode: SidebarMode) => void;
  setCollapsed: (collapsed: boolean) => void;
  setUserRole: (role: UserRole) => void;
  toggleCollapsed: () => void;
  
  // Computed helpers
  getAllowedModes: () => SidebarMode[];
  getDefaultMode: () => SidebarMode;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  mode: 'monitor',
  collapsed: false,
  userRole: 'devops',

  setMode: (mode) => set({ mode }),
  setCollapsed: (collapsed) => set({ collapsed }),
  setUserRole: (role) => {
    const state = get();
    const allowedModes = MODE_CONFIG
      .filter(m => m.allowedRoles.includes(role))
      .map(m => m.id);
    
    // If current mode is not allowed, switch to default
    if (!allowedModes.includes(state.mode)) {
      const defaultMode = MODE_CONFIG.find(m => m.defaultForRoles.includes(role))?.id || 'monitor';
      set({ userRole: role, mode: defaultMode });
    } else {
      set({ userRole: role });
    }
  },
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),

  getAllowedModes: () => {
    const { userRole } = get();
    return MODE_CONFIG
      .filter(m => m.allowedRoles.includes(userRole))
      .map(m => m.id);
  },

  getDefaultMode: () => {
    const { userRole } = get();
    return MODE_CONFIG.find(m => m.defaultForRoles.includes(userRole))?.id || 'monitor';
  },
}));
