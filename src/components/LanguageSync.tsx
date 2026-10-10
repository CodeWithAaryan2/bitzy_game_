import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { applyTranslation, getCurrentLanguage } from '@/lib/googleTranslate';

// Mounted once near the app root (inside AuthProvider). If the logged-in
// user has a saved language preference that doesn't match what's currently
// applied in this browser (e.g. they signed in on a new device), it applies
// it automatically — no extra click needed after the first time they chose it.
export default function LanguageSync() {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.preferred_language) return;
    const current = getCurrentLanguage();
    if (profile.preferred_language !== 'en' && profile.preferred_language !== current) {
      applyTranslation(profile.preferred_language, true);
    }
  }, [profile?.preferred_language]);

  return null;
}