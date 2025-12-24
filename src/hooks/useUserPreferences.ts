import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingState {
  completed: boolean;
  step?: number;
  completedAt?: string;
}

interface UserPreferences {
  user_id: string;
  default_mode: string;
  onboarding_state: OnboardingState;
  ui_preferences: Record<string, any>;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For demo purposes, show onboarding for non-authenticated users
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences exist, create default and show onboarding
        const { data: newPrefs } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            default_mode: 'monitor',
            onboarding_state: { completed: false, step: 0 },
            ui_preferences: {}
          })
          .select()
          .single();

        if (newPrefs) {
          const onboardingData = newPrefs.onboarding_state as unknown as OnboardingState;
          const uiPrefsData = newPrefs.ui_preferences as unknown as Record<string, any>;
          const typedPrefs: UserPreferences = {
            user_id: newPrefs.user_id,
            default_mode: newPrefs.default_mode || 'monitor',
            onboarding_state: onboardingData || { completed: false },
            ui_preferences: uiPrefsData || {}
          };
          setPreferences(typedPrefs);
          setShowOnboarding(true);
        }
      } else if (data) {
        const onboardingData = data.onboarding_state as unknown as OnboardingState;
        const uiPrefsData = data.ui_preferences as unknown as Record<string, any>;
        const typedPrefs: UserPreferences = {
          user_id: data.user_id,
          default_mode: data.default_mode || 'monitor',
          onboarding_state: onboardingData || { completed: false },
          ui_preferences: uiPrefsData || {}
        };
        setPreferences(typedPrefs);
        
        // Show onboarding if not completed
        if (!typedPrefs.onboarding_state.completed) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    setShowOnboarding(false);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        onboarding_state: { completed: true, completedAt: new Date().toISOString() }
      });

    setPreferences(prev => prev ? {
      ...prev,
      onboarding_state: { completed: true, completedAt: new Date().toISOString() }
    } : null);
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<Omit<UserPreferences, 'user_id'>>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .update({
        default_mode: updates.default_mode,
        onboarding_state: updates.onboarding_state as any,
        ui_preferences: updates.ui_preferences as any
      })
      .eq('user_id', user.id);

    if (!error) {
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    updatePreferences,
    refetch: fetchPreferences
  };
}
