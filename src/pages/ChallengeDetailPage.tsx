import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Zap, Trophy, Lightbulb, CheckCircle2, XCircle,
  Loader2, Play, Swords, RotateCcw,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useChallenge } from '@/hooks/useDB';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  Easy:   { color: '#58CC02', bg: 'rgba(88,204,2,0.12)' },
  Medium: { color: '#FF9600', bg: 'rgba(255,150,0,0.12)' },
  Hard:   { color: '#FF4B4B', bg: 'rgba(255,75,75,0.12)' },
};

type Lang = 'javascript' | 'typescript' | 'python';

interface JudgeResult {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  feedback: string;
  perTest: Array<{ label: string; passed: boolean; note: string }>;
}

export default function ChallengeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { showXPPopup, completeChallenge, hasCompletedChallenge } = useGame();
  const { data: challenge, loading } = useChallenge(slug ?? '');

  const [lang, setLang] = useState<Lang>('javascript');
  const [code, setCode] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [judging, setJudging] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [judgeError, setJudgeError] = useState('');

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-16 space-y-4">
        <Swords className="w-12 h-12 mx-auto opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Challenge not found.</p>
        <button onClick={() => navigate('/app/challenges')} className="d-btn d-btn-md d-btn-ghost mx-auto flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>
      </div>
    );
  }

  const diff = difficultyConfig[challenge.difficulty] ?? difficultyConfig.Easy;
  const solved = hasCompletedChallenge(challenge.id);
  const currentCode = code ?? challenge.starter_code?.[lang] ?? '';
  const examples: Array<{ input: string; output: string; explanation?: string }> =
    Array.isArray(challenge.examples) ? challenge.examples : parseExamplesText(challenge.examples);
  const visibleTests = (challenge.test_cases ?? []).filter((t: any) => t.isExample || !t.isHidden);

  const switchLang = (l: Lang) => {
    setLang(l);
    setCode(challenge.starter_code?.[l] ?? '');
  };

  const resetCode = () => setCode(challenge.starter_code?.[lang] ?? '');

  const submit = async () => {
    if (!currentCode.trim() || judging) return;
    setJudging(true);
    setJudgeError('');
    setResult(null);
    try {
      const testsForJudge = (challenge.test_cases ?? []).map((t: any, i: number) =>
        `Test ${i + 1}${t.isHidden ? ' (hidden)' : ''}: input = ${t.input} | expected output = ${t.expectedOutput}`
      ).join('\n');

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          system: `You are a strict but fair code judge for a coding challenge platform. Mentally trace through the candidate's ${lang} code against every test case exactly as a real interpreter would. Be strict about edge cases (empty input, single element, negatives) but do not penalize purely stylistic choices or minor formatting differences in output (e.g. array order when order is explicitly stated not to matter).
Respond ONLY with JSON, no markdown/backticks, in this exact shape:
{"passed":true|false,"passedTests":number,"totalTests":number,"feedback":"2-3 sentence overall verdict, specific and honest","perTest":[{"label":"Test 1","passed":true|false,"note":"short reason, e.g. actual output vs expected"}]}
"passed" (overall) should be true only if ALL tests pass.`,
          messages: [{
            role: 'user',
            content: `Problem: ${challenge.title}\n\n${challenge.problem_statement}\n\nConstraints:\n${challenge.constraints ?? 'none stated'}\n\nTest cases:\n${testsForJudge}\n\nCandidate's ${lang} code:\n\`\`\`${lang}\n${currentCode}\n\`\`\``
          }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text ?? '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      const judgeResult: JudgeResult = {
        passed: !!parsed.passed,
        passedTests: parsed.passedTests ?? 0,
        totalTests: parsed.totalTests ?? (challenge.test_cases?.length ?? 0),
        feedback: parsed.feedback ?? '',
        perTest: Array.isArray(parsed.perTest) ? parsed.perTest : [],
      };
      setResult(judgeResult);
      await completeChallenge(challenge.id, judgeResult.passed, challenge.xp_reward, challenge.coin_reward);
      if (judgeResult.passed) {
        showXPPopup(challenge.xp_reward, 'xp', `🏆 Challenge beaten! +${challenge.xp_reward} XP!`);
      }
    } catch {
      setJudgeError('Could not judge your solution right now — check your connection and try again.');
    }
    setJudging(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <button onClick={() => navigate('/app/challenges')} className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--surface)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-lg truncate">{challenge.title}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg, color: diff.color }}>{challenge.difficulty}</span>
            {challenge.category && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{challenge.category}</span>}
            <span className="text-[10px] flex items-center gap-1 font-bold" style={{ color: '#FFC800' }}><Zap className="w-3 h-3" />{challenge.xp_reward} XP</span>
          </div>
        </div>
        {solved && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0" style={{ backgroundColor: 'rgba(88,204,2,0.12)', color: '#58CC02' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Solved
          </span>
        )}
      </motion.div>

      {/* Problem statement */}
      <motion.div variants={item} className="d-card !p-4 space-y-3">
        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)', lineHeight: 1.6 }}>{challenge.problem_statement}</p>

        {challenge.constraints && (
          <div>
            <p className="font-bold text-xs mb-1">Constraints</p>
            <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{challenge.constraints}</p>
          </div>
        )}

        {examples.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold text-xs">Examples</p>
            {examples.map((ex, i) => (
              <div key={i} className="rounded-2xl p-3 text-xs space-y-0.5" style={{ backgroundColor: 'var(--surface)' }}>
                <p><span className="font-bold">Input:</span> {ex.input}</p>
                <p><span className="font-bold">Output:</span> {ex.output}</p>
                {ex.explanation && <p style={{ color: 'var(--text-muted)' }}>{ex.explanation}</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Hints */}
      {challenge.hints?.length > 0 && (
        <motion.div variants={item} className="d-card !p-4 space-y-2">
          <p className="font-bold text-sm flex items-center gap-1.5"><Lightbulb className="w-4 h-4" style={{ color: '#FFC800' }} /> Hints</p>
          {challenge.hints.slice(0, revealedHints).map((h: any, i: number) => (
            <p key={i} className="text-xs p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255,200,0,0.10)', color: 'var(--text)' }}>💡 {h.text}</p>
          ))}
          {revealedHints < challenge.hints.length && (
            <WatchAdButton
              adUnitId={AD_UNITS.hint}
              label={`Reveal hint ${revealedHints + 1} of ${challenge.hints.length} ▾`}
              onReward={() => setRevealedHints(r => r + 1)}
              className="text-xs font-bold"
              style={{ color: '#1CB0F6' }}
            />
          )}
        </motion.div>
      )}

      {/* Code editor */}
      <motion.div variants={item} className="d-card !p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {(['javascript', 'typescript', 'python'] as Lang[]).map(l => (
              <button key={l} onClick={() => switchLang(l)}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold capitalize"
                style={{ backgroundColor: lang === l ? '#1CB0F6' : 'var(--surface)', color: lang === l ? '#fff' : 'var(--text-muted)' }}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={resetCode} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <textarea
          value={currentCode}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
          className="w-full resize-none outline-none text-sm p-3.5 rounded-2xl leading-relaxed"
          style={{ backgroundColor: '#1E1E2E', color: '#D4D4E8', fontFamily: 'ui-monospace, "SF Mono", Consolas, monospace', minHeight: 220 }}
        />

        {visibleTests.length > 0 && (
          <div className="space-y-1.5">
            <p className="font-bold text-xs">Sample tests</p>
            {visibleTests.map((t: any) => (
              <div key={t.id} className="text-[11px] p-2 rounded-xl font-mono" style={{ backgroundColor: 'var(--surface)' }}>
                in: {String(t.input).replace(/\n/g, ' | ')} → out: {t.expectedOutput}
              </div>
            ))}
          </div>
        )}

        {judgeError && <p className="text-xs font-bold" style={{ color: '#FF4B4B' }}>{judgeError}</p>}

        <button onClick={submit} disabled={!currentCode.trim() || judging}
          className="d-btn d-btn-md w-full text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: '#1CB0F6', boxShadow: '0 4px 0 #0A86BF', opacity: !currentCode.trim() ? 0.5 : 1 }}>
          {judging ? <><Loader2 className="w-4 h-4 animate-spin" /> Judging your code...</> : <><Play className="w-4 h-4" /> Submit Solution</>}
        </button>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="d-card !p-4 space-y-3" style={{ borderColor: result.passed ? '#58CC02' : '#FF4B4B', backgroundColor: result.passed ? 'rgba(88,204,2,0.08)' : 'rgba(255,75,75,0.08)' }}>
            <div className="flex items-center gap-2">
              {result.passed ? <CheckCircle2 className="w-6 h-6" style={{ color: '#58CC02' }} /> : <XCircle className="w-6 h-6" style={{ color: '#FF4B4B' }} />}
              <div>
                <p className="font-display font-bold">{result.passed ? 'All tests passed! 🎉' : 'Not quite yet'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.passedTests}/{result.totalTests} tests passed</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text)' }}>{result.feedback}</p>
            {result.perTest.length > 0 && (
              <div className="space-y-1">
                {result.perTest.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] p-2 rounded-xl" style={{ backgroundColor: 'var(--surface)' }}>
                    {t.passed ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#58CC02' }} /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FF4B4B' }} />}
                    <span><span className="font-bold">{t.label}:</span> {t.note}</span>
                  </div>
                ))}
              </div>
            )}
            {result.passed && (
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#FFC800' }}>
                <Trophy className="w-4 h-4" /> +{challenge.xp_reward} XP · +{challenge.coin_reward} 💎
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Fallback: some legacy challenges may store examples as plain text rather than JSON.
function parseExamplesText(raw: unknown): Array<{ input: string; output: string; explanation?: string }> {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(/\n\s*\n/).filter(Boolean).map(block => {
    const inputMatch = block.match(/Input:\s*(.*)/i);
    const outputMatch = block.match(/Output:\s*(.*)/i);
    const explanationMatch = block.match(/Explanation:\s*(.*)/is);
    return {
      input: inputMatch?.[1]?.trim() ?? block.trim(),
      output: outputMatch?.[1]?.trim() ?? '',
      explanation: explanationMatch?.[1]?.trim(),
    };
  });
}