import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Copy, Check, Terminal, Eye, Code2, Maximize2, Minimize2 } from 'lucide-react';
import { useGame } from '@/context/GameContext';

const STARTERS: Record<string, { code: string; label: string; icon: string }> = {
  html: {
    label: 'HTML',
    icon: '📄',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #764ba2; font-size: 2rem; margin: 0 0 10px; }
    p { color: #666; }
    button {
      background: #764ba2;
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 30px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 15px;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎉 Hello, World!</h1>
    <p>Welcome to the Bitzy Playground</p>
    <button onclick="this.textContent='Clicked! 🚀'">
      Click Me
    </button>
  </div>
</body>
</html>`,
  },
  css: {
    label: 'CSS Art',
    icon: '🎨',
    code: `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a1a2e;
    min-height: 100vh;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    align-items: center;
    justify-content: center;
    padding: 30px;
  }
  .shape {
    width: 80px;
    height: 80px;
    animation: spin 3s infinite linear;
  }
  .circle {
    background: #e94560;
    border-radius: 50%;
    animation: pulse 2s infinite ease-in-out;
  }
  .square {
    background: #0f3460;
    border: 4px solid #e94560;
    animation: spin 4s infinite linear;
  }
  .triangle {
    width: 0; height: 0;
    border-left: 40px solid transparent;
    border-right: 40px solid transparent;
    border-bottom: 80px solid #16213e;
    animation: bounce 1.5s infinite ease-in-out;
    background: transparent;
  }
  .star {
    background: #ffd700;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    animation: pulse 2s infinite ease-in-out reverse;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  h1 {
    width: 100%;
    text-align: center;
    color: white;
    font-family: sans-serif;
    font-size: 1.5rem;
    margin-bottom: 10px;
  }
</style>
</head>
<body>
  <h1>✨ CSS Art Demo</h1>
  <div class="shape circle"></div>
  <div class="shape square"></div>
  <div class="shape triangle"></div>
  <div class="shape star"></div>
</body>
</html>`,
  },
  javascript: {
    label: 'JavaScript',
    icon: '⚡',
    code: `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; margin: 0; }
  h2 { color: #58cc02; }
  #output {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 10px;
    padding: 15px;
    min-height: 100px;
    font-family: monospace;
    line-height: 1.6;
  }
  .log { color: #58a6ff; margin: 2px 0; }
  .result { color: #3fb950; font-weight: bold; }
  button {
    background: #58cc02; color: white; border: none;
    padding: 10px 20px; border-radius: 8px; cursor: pointer;
    font-size: 1rem; margin: 10px 5px 10px 0;
  }
</style>
</head>
<body>
<h2>⚡ JS Playground</h2>
<div id="output"></div>
<button onclick="runDemo()">▶ Run Demo</button>
<button onclick="clearOutput()">🗑 Clear</button>
<script>
  const output = document.getElementById('output');

  function log(msg, type = 'log') {
    const div = document.createElement('div');
    div.className = type;
    div.textContent = '> ' + msg;
    output.appendChild(div);
  }

  function clearOutput() { output.innerHTML = ''; }

  function runDemo() {
    clearOutput();
    log('Starting JavaScript demo...');

    // Arrays
    const fruits = ['🍎', '🍊', '🍋', '🍇', '🍓'];
    log('Array: ' + fruits.join(' '));

    // Map + Filter
    const emojis = fruits.filter((_, i) => i % 2 === 0);
    log('Filtered (even indexes): ' + emojis.join(' '));

    // Objects
    const person = { name: 'Bitzy', level: 42, skills: ['HTML', 'CSS', 'JS'] };
    log('Object: ' + JSON.stringify(person));

    // Destructuring
    const { name, level } = person;
    log(\`Destructured: name=\${name}, level=\${level}\`);

    // Arrow functions
    const double = x => x * 2;
    const nums = [1, 2, 3, 4, 5].map(double);
    log('Doubled: ' + nums.join(', '));

    // Promises
    Promise.resolve('🎉 Async works too!').then(msg => log(msg, 'result'));

    log('Demo complete! Modify the code to experiment.', 'result');
  }

  runDemo();
</script>
</body>
</html>`,
  },
};

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'javascript'>('html');
  const [code, setCode] = useState(STARTERS.html.code);
  const [output, setOutput] = useState(STARTERS.html.code);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showXPPopup } = useGame();

  const handleTabChange = (tab: 'html' | 'css' | 'javascript') => {
    setActiveTab(tab);
    setCode(STARTERS[tab].code);
    setOutput(STARTERS[tab].code);
    setHasRun(false);
  };

  const handleRun = useCallback(() => {
    setOutput(code);
    setHasRun(true);
    if (!hasRun) {
      showXPPopup(10, 'xp', '+10 XP! Code executed! 🚀');
    }
  }, [code, hasRun, showXPPopup]);

  const handleReset = () => {
    setCode(STARTERS[activeTab].code);
    setOutput(STARTERS[activeTab].code);
    setHasRun(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleRun();
    }
  };

  const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={I} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">🛝 Playground</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Write code, see it live • Ctrl+Enter to run</p>
        </div>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="d-btn d-btn-ghost d-btn-sm"
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </motion.div>

      {/* Tab selector */}
      <motion.div variants={I} className="flex gap-2">
        {(['html', 'css', 'javascript'] as const).map(tab => (
          <motion.button
            key={tab}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTabChange(tab)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 font-display font-bold text-sm transition-all"
            style={{
              borderColor: activeTab === tab ? (tab === 'html' ? '#E34C26' : tab === 'css' ? '#264DE4' : '#F7DF1E') : 'var(--border)',
              backgroundColor: activeTab === tab ? (tab === 'html' ? '#FFF5F0' : tab === 'css' ? '#F0F4FF' : '#FFFCE0') : 'var(--white)',
              color: activeTab === tab ? (tab === 'html' ? '#E34C26' : tab === 'css' ? '#264DE4' : '#997700') : 'var(--text-muted)',
            }}
          >
            <span>{STARTERS[tab].icon}</span>
            <span className="hidden sm:inline">{STARTERS[tab].label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Editor + Preview */}
      <motion.div
        variants={I}
        className={`grid gap-4 ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-2xl overflow-auto' : 'grid-cols-1 lg:grid-cols-2'}`}
      >
        {/* Code editor */}
        <div className="d-card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b-2" style={{ borderColor: 'var(--border)', backgroundColor: '#1a1a2e' }}>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-300 font-display">{STARTERS[activeTab].label}</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="relative" style={{ backgroundColor: '#0d1117' }}>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none outline-none text-xs font-mono p-4 leading-relaxed"
              style={{
                backgroundColor: 'transparent',
                color: '#c9d1d9',
                minHeight: fullscreen ? '60vh' : '320px',
                caretColor: '#58CC02',
              }}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
          <div className="flex gap-2 p-3" style={{ backgroundColor: '#1a1a2e' }}>
            <button
              onClick={handleRun}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-display font-bold text-sm text-white"
              style={{ backgroundColor: '#58CC02', boxShadow: '0 4px 0 #45A301' }}
            >
              <Play className="w-4 h-4" />
              Run Code
            </button>
            <div className="flex items-center gap-1 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Terminal className="w-3.5 h-3.5" />
              <span className="text-gray-500 text-[10px]">Ctrl+↵</span>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="d-card p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b-2" style={{ borderColor: 'var(--border)' }}>
            <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-bold font-display" style={{ color: 'var(--text-muted)' }}>Live Preview</span>
            <AnimatePresence>
              {hasRun && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(88,204,2,0.12)', color: '#58CC02' }}
                >
                  ● Live
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative" style={{ minHeight: fullscreen ? '70vh' : '360px' }}>
            {!hasRun && (
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ backgroundColor: 'var(--surface)' }}>
                <span className="text-4xl mb-3">▶️</span>
                <p className="font-display font-bold text-sm">Click Run to see preview</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ctrl+Enter to run quickly</p>
              </div>
            )}
            <iframe
              srcDoc={output}
              className="w-full border-0"
              style={{ height: fullscreen ? '70vh' : '360px', opacity: hasRun ? 1 : 0, transition: 'opacity 0.3s' }}
              sandbox="allow-scripts"
              title="Code Preview"
            />
          </div>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div variants={I} className="d-card d-card-blue p-4">
        <h3 className="font-display font-bold text-sm mb-2">💡 Playground Tips</h3>
        <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
          <li>• Press <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--border)' }}>Ctrl+Enter</kbd> to run code instantly</li>
          <li>• Press <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'var(--border)' }}>Tab</kbd> for 2-space indentation</li>
          <li>• All three starter templates are self-contained HTML documents</li>
          <li>• Your code runs securely in a sandboxed iframe</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}