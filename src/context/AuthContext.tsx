import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { updateStreak as sharedUpdateStreak } from '@/lib/gamification';
import { trpc } from '@/providers/trpc';
import type { User } from '@supabase/supabase-js';

export { getXPForLevel, getLevelFromXP } from '@/context/xpUtils';

export interface Profile {
  id: number;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar: string | null;
  level: number;
  xp: number;
  coins: number;
  energy: number;
  max_energy: number;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  preferred_language: string | null;
  role: 'user' | 'admin';
  // Admin-assignable custom tag (e.g. "Legend", "Beta Tester", "VIP") shown
  // as a badge next to this player's name everywhere. Set from the admin
  // panel's Players tab. Null/empty = no custom tag.
  custom_tag: string | null;
  custom_tag_color: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (username: string, email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  // Premium courses
  purchasedCourseIds: Set<number>;
  hasPurchasedCourse: (courseId: number) => boolean;
  refreshPurchasedCourses: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, isLoggedIn: false, isLoading: true, isAdmin: false,
  login: async () => ({ error: null }), register: async () => ({ error: null }),
  logout: async () => {}, updateProfile: async () => ({ error: null }), refreshProfile: async () => {},
  requestPasswordReset: async () => ({ error: null }), updatePassword: async () => ({ error: null }),
  loginWithGoogle: async () => ({ error: null }),
  purchasedCourseIds: new Set(), hasPurchasedCourse: () => false, refreshPurchasedCourses: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (error || !data) {
      console.log('[Auth] fetchProfile error:', error?.message);
      return null;
    }
    return data as unknown as Profile;
  };

  const loadProfile = async (currentUser: User) => {
    // Try immediate fetch first (existing users)
    let p = await fetchProfile(currentUser.id);

    if (!p) {
      // New signup — wait for DB trigger then retry
      for (const delay of [500, 1000, 2000, 3000]) {
        console.log(`[Auth] Profile not found, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        p = await fetchProfile(currentUser.id);
        if (p) break;
      }
    }

    if (!p) {
      // Trigger never fired — create manually
      console.log('[Auth] Creating profile manually...');
      const profileData = {
        user_id: currentUser.id,
        display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'Learner',
        bio: 'Learning to code one day at a time!',
        role: 'user',
        level: 1,
        xp: 50,
        coins: 50,
        energy: 5,
        max_energy: 5,
        current_streak: 1,
        longest_streak: 1,
        last_login_date: new Date().toISOString().split('T')[0],
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertErr } = await (supabase.from('profiles') as any).insert(profileData);
      if (insertErr?.code === '23505') {
        // Race — row created between our check and insert, just fetch
        p = await fetchProfile(currentUser.id);
      } else if (!insertErr) {
        await new Promise(r => setTimeout(r, 300));
        p = await fetchProfile(currentUser.id);
      }
    }

    console.log('[Auth] Profile loaded:', p ? { xp: p.xp, coins: p.coins, energy: p.energy, level: p.level } : 'FAILED');
    // Update streak on every load (login/session restore)
    if (p) {
      const updated = await updateStreak(p, currentUser.id);
      setProfile(updated ?? p);
    } else {
      setProfile(p);
    }
  };

  // Called every time user loads profile — updates streak based on
  // last_login_date. Logic lives in src/lib/gamification.ts (Feature 18:
  // one implementation, shared by anything that needs streak math).
  const updateStreak = (p: Profile, userId: string) => sharedUpdateStreak(p, userId);

  useEffect(() => {
    let initialDone = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u).finally(() => { setIsLoading(false); initialDone = true; });
      } else {
        setIsLoading(false);
        initialDone = true;
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip INITIAL_SESSION — getSession already handles it
      if (!initialDone && event === 'INITIAL_SESSION') return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { error: error.message };
    if (data.user) await loadProfile(data.user);
    return { error: null };
  };

  const register = async (username: string, email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(), password,
      options: { data: { display_name: username } },
    });
    if (error) return { error: error.message };

    if (data.user) {
      await new Promise(r => setTimeout(r, 2000));
      await loadProfile(data.user);
    }
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not logged in' };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id: _uid, id: _id, created_at: _ca, ...safeUpdates } = updates as Record<string, unknown>;
    const updateData = {
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
      .update(updateData)
      .eq('user_id', user.id);
    if (!error) { const p = await fetchProfile(user.id); setProfile(p); }
    return { error: error?.message || null };
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  };

  // OAuth redirect flow — Supabase sends the browser to Google, then back to
  // /app/dashboard with a session already established. The Google provider
  // must be enabled in the Supabase dashboard (Auth → Providers) for this to
  // work; this call alone doesn't configure that server-side.
  const loginWithGoogle = async (): Promise<{ error: string | null }> => {
    // Native app must come back through the custom URL scheme
    // (com.bitzy.app://auth) so the appUrlOpen listener in main.tsx can
    // catch it — a plain https redirectTo never fires that listener, so the
    // deep link (and the session) was silently lost after picking an
    // account. On web, the normal http(s) redirect still works.
    const { Capacitor } = await import('@capacitor/core');
    const isNative = Capacitor.isNativePlatform();
    const redirectTo = isNative
      ? 'com.bitzy.app://auth'
      : `${window.location.origin}/app/dashboard`;

    if (isNative) {
      // THE ACTUAL BUG: signInWithOAuth() normally does
      // `window.location.href = googleUrl`, which navigates INSIDE the
      // app's own embedded WebView. Google happily loads and lets you pick
      // an account, but when it redirects to com.bitzy.app://auth the
      // WebView has no way to hand a non-http(s) URL off to Android/iOS,
      // so appUrlOpen in main.tsx never fires. The WebView just fails to
      // navigate, and the app's own route guard sees "no session" and
      // bounces you back to /login. That's why it looked like it was
      // redirecting into the app but you landed back on the login page.
      //
      // Fix: get the OAuth URL from Supabase without letting it redirect
      // (skipBrowserRedirect), then open that URL in the SYSTEM browser
      // via @capacitor/browser. The system browser can hand custom
      // schemes off to the OS, which is what actually fires appUrlOpen.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return { error: error.message };
      if (!data?.url) return { error: 'Google sign-in failed to start (no auth URL returned).' };

      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
      } catch (browserErr) {
        // If this throws, @capacitor/browser's native side isn't actually
        // linked into the built APK yet — adding it to package.json alone
        // does nothing until `npm install && npx cap sync android` runs
        // and the app is rebuilt. Log it loudly so it's obvious in
        // `adb logcat` / Safari web inspector, and fall back to opening
        // the URL directly rather than leaving the button stuck on
        // "Redirecting..." forever with nothing visibly happening.
        console.error('[Auth] @capacitor/browser Open failed — was `npx cap sync android` run after adding the plugin, and was the app rebuilt?', browserErr);
        window.location.href = data.url;
      }
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    return { error: error?.message || null };
  };

  // Sends a password-reset email via Supabase. The link in that email
  // redirects back to /reset-password with a recovery session in the URL,
  // which Supabase's client picks up automatically (detectSessionInUrl).
  const requestPasswordReset = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message || null };
  };

  // Only works when called from a valid recovery session (i.e. after the
  // user has followed the reset-password email link).
  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message || null };
  };

  // Fetched automatically after login (query is disabled while logged out).
  // Auto-fetches after login because `enabled: !!user` flips true the
  // moment `user` is set above.
  const myCoursesQuery = trpc.payment.myCourses.useQuery(undefined, { enabled: !!user });
  const purchasedCourseIds = useMemo(
    () => new Set((myCoursesQuery.data ?? []).map((row: any) => row.course_id as number)),
    [myCoursesQuery.data],
  );
  const hasPurchasedCourse = (courseId: number) => purchasedCourseIds.has(courseId);
  const refreshPurchasedCourses = async () => { await myCoursesQuery.refetch(); };

  return (
    <AuthContext.Provider value={{
      user, profile, isLoggedIn: !!user, isLoading, isAdmin: profile?.role === 'admin',
      login, register, logout, updateProfile, refreshProfile, requestPasswordReset, updatePassword, loginWithGoogle,
      purchasedCourseIds, hasPurchasedCourse, refreshPurchasedCourses,
    }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}