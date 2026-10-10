import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, User, Camera, Trash2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGame, MAX_ENERGY } from '@/context/GameContext';
import { useTheme } from '@/context/ThemeContext';
import LanguagePicker from '@/components/LanguagePicker';
import { applyTranslation, getCurrentLanguage } from '@/lib/googleTranslate';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isAdmin, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { refillEnergy } = useGame();

  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');
  const [photo, setPhoto] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState(getCurrentLanguage());
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setPhoto(profile.avatar || '');
      if (profile.preferred_language) setSelectedLang(profile.preferred_language);
    }
  }, [profile]);

  const saveLanguage = async () => {
    await updateProfile({ preferred_language: selectedLang });
    applyTranslation(selectedLang); // reloads to translate DB-driven content too
  };

  const chgPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) {
      setErr('Image must be under 5MB');
      return;
    }
    setErr('');
    const r = new FileReader();
    r.onload = (ev) => {
      const d = ev.target?.result as string;
      setPhoto(d);
      updateProfile({ avatar: d });
      setSuccess('Photo updated!');
      setTimeout(() => setSuccess(''), 3000);
    };
    r.readAsDataURL(f);
  };

  const saveProfile = async () => {
    setErr('');
    setSuccess('');
    setIsSaving(true);
    const { error } = await updateProfile({
      display_name: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
    });
    if (error) {
      setErr('Failed to save: ' + error);
    } else {
      setSuccess('Profile saved!');
      setTimeout(() => setSuccess(''), 3000);
    }
    setIsSaving(false);
  };

  const displayNameVal = profile?.display_name || 'Learner';
  const roleVal = profile?.role === 'admin' ? 'Admin' : 'Learner';
  const xpVal = profile?.xp ?? 0;
  const coinsVal = profile?.coins ?? 0;
  const energyVal = profile?.energy ?? 0;
  const levelVal = profile?.level ?? 1;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-light)' }} />
        </button>
        <h1 className="font-display text-xl font-bold">Settings</h1>
      </div>

      {/* Feedback */}
      {(err || success) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl text-sm font-bold text-center"
          style={{ backgroundColor: err ? '#FFE8E8' : '#F0FFE5', color: err ? '#FF4B4B' : '#58CC02' }}>
          {err || success}
        </motion.div>
      )}

      {/* Stats Card */}
      <div className="d-card p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="font-display text-lg font-bold" style={{ color: '#FFC800' }}>{xpVal}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>XP</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold" style={{ color: '#FF4B4B' }}>{energyVal}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Hearts</p>
            {energyVal < MAX_ENERGY && (
              <WatchAdButton
                adUnitId={AD_UNITS.heartRefill}
                label="Refill"
                onReward={refillEnergy}
                className="mt-1 text-[10px] font-bold"
                style={{ color: '#FF4B4B' }}
              />
            )}
          </div>
          <div>
            <p className="font-display text-lg font-bold" style={{ color: '#1CB0F6' }}>{coinsVal}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Gems</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold" style={{ color: '#58CC02' }}>Lv.{levelVal}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Level</p>
          </div>
        </div>
      </div>

      {/* Photo */}
      <section>
        <p className="font-display text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>PROFILE PHOTO</p>
        <div className="d-card text-center">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '3px solid #58CC02' }}>
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <User className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#58CC02' }}>
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={chgPhoto} className="hidden" />
          </div>
          <div className="flex items-center gap-2 justify-center">
            <button onClick={() => fileRef.current?.click()} className="d-btn d-btn-sm d-btn-green"><Camera className="w-3.5 h-3.5" /> Change</button>
            {photo && <button onClick={() => { setPhoto(''); updateProfile({ avatar: '' }); }} className="d-btn d-btn-sm d-btn-red"><Trash2 className="w-3.5 h-3.5" /> Remove</button>}
          </div>
        </div>
      </section>

      {/* Profile Info */}
      <section>
        <p className="font-display text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>PROFILE INFO</p>
        <div className="d-card space-y-3">
          <div>
            <label className="text-xs font-bold" style={{ color: 'var(--text-light)' }}>Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="d-input w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold" style={{ color: 'var(--text-light)' }}>Bio</label>
            <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio" className="d-input w-full mt-1" />
          </div>
          <button onClick={saveProfile} disabled={isSaving} className="d-btn d-btn-md d-btn-green w-full disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </section>

      {/* Theme */}
      <section>
        <p className="font-display text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>APPEARANCE</p>
        <div className="d-card">
          <div className="flex gap-2">
            {[
              { k: 'light' as const, label: 'Light', icon: Sun },
              { k: 'dark' as const, label: 'Dark', icon: Moon },
            ].map((opt) => (
              <button key={opt.k} onClick={() => setTheme(opt.k)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-xs"
                style={{
                  borderColor: theme === opt.k ? '#58CC02' : 'var(--border)',
                  backgroundColor: theme === opt.k ? '#F0FFE5' : 'var(--surface)',
                  color: theme === opt.k ? '#58CC02' : 'var(--text-muted)',
                }}>
                <opt.icon className="w-4 h-4" /> {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Language */}
      <section>
        <p className="font-display text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>LANGUAGE</p>
        <div className="d-card space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Translates the whole app — lessons, courses, everything — into your language.
          </p>
          <LanguagePicker selected={selectedLang} onSelect={setSelectedLang} compact />
          {selectedLang !== getCurrentLanguage() && (
            <button onClick={saveLanguage} className="d-btn d-btn-md d-btn-green w-full">
              Apply Language
            </button>
          )}
        </div>
      </section>

      {/* Account */}
      <section>
        <p className="font-display text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>ACCOUNT</p>
        <div className="d-card space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold" style={{ color: 'var(--text-light)' }}>Display Name</span>
            <span className="text-xs font-bold">{displayNameVal}</span>
          </div>
          <div className="h-0.5" style={{ backgroundColor: 'var(--border)' }} />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold" style={{ color: 'var(--text-light)' }}>Role</span>
            <span className="text-xs font-bold">{roleVal}</span>
          </div>
        </div>
      </section>

      {isAdmin && (
        <button onClick={() => navigate('/app/admin')} className="d-btn d-btn-md d-btn-orange w-full">
          <Shield className="w-4 h-4" /> Admin Panel
        </button>
      )}

      <button onClick={logout} className="d-btn d-btn-md d-btn-red w-full">Sign Out</button>
    </div>
  );
}