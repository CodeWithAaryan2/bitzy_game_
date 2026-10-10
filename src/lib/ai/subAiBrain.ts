// ============================================================
// SUB AI BRAIN — No API, Pure local knowledge engine
// ============================================================

export interface SubAIResponse {
  text: string;
  confidence: number;
}

// ── DETECT LANGUAGE ──────────────────────────────────────────
const HINDI_WORDS = ['kya','kaise','karo','bhai','yaar','hai','hain','mein','ka','ki','ke','nahi','hota','karta','karein','batao','samjhao','explain','sikhna','puch','dobara','theek','acha','bilkul','bahut','thoda','zyada','abhi','pehle','baad','aur','lekin','toh','matlab','seedha','sab','kuch','hoga','dost','tera','mera','apna'];

export function detectLang(text: string): 'hinglish' | 'english' {
  const words = text.toLowerCase().split(/\s+/);
  const hindiCount = words.filter(w => HINDI_WORDS.includes(w)).length;
  return hindiCount >= 1 ? 'hinglish' : 'english';
}

// ── DETECT WORLD LANGUAGE (script + common-word based, fully offline) ──
// This recognizes the language the person is typing in, even though the
// deep technical content in the knowledge base is only written out in
// English and Hinglish. When we detect something else, we greet the
// person and frame the answer in their language, then hand off to the
// English/Hinglish explanation underneath — a small, honest, local
// approximation of true multilingual support without calling any API.
export type WorldLang =
  | 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'zh' | 'ja' | 'ko'
  | 'ru' | 'bn' | 'ta' | 'te' | 'ur' | 'id' | 'tr' | 'it';

const SCRIPT_RANGES: Array<{ lang: WorldLang; regex: RegExp }> = [
  { lang: 'hi', regex: /[\u0900-\u097F]/ },       // Devanagari (Hindi/Marathi)
  { lang: 'ar', regex: /[\u0600-\u06FF]/ },       // Arabic / Urdu-ish script
  { lang: 'ur', regex: /[\u0620-\u064A\uFB50-\uFDFF]/ }, // rough Urdu overlap, checked after ar
  { lang: 'zh', regex: /[\u4E00-\u9FFF]/ },       // Chinese (CJK)
  { lang: 'ja', regex: /[\u3040-\u30FF]/ },       // Japanese Hiragana/Katakana
  { lang: 'ko', regex: /[\uAC00-\uD7AF]/ },       // Korean Hangul
  { lang: 'ru', regex: /[\u0400-\u04FF]/ },       // Cyrillic (Russian)
  { lang: 'bn', regex: /[\u0980-\u09FF]/ },       // Bengali
  { lang: 'ta', regex: /[\u0B80-\u0BFF]/ },       // Tamil
  { lang: 'te', regex: /[\u0C00-\u0C7F]/ },       // Telugu
];

// Common stopwords for Latin-script languages that Hindi-word detection can't catch
const WORD_HINTS: Array<{ lang: WorldLang; words: string[] }> = [
  { lang: 'es', words: ['que', 'como', 'por', 'para', 'cómo', 'qué', 'explica', 'explícame', 'hola', 'gracias', 'necesito'] },
  { lang: 'fr', words: ['comment', 'pourquoi', 'explique', 'bonjour', 'merci', 'je', 'suis', 'peux', "qu'est"] },
  { lang: 'de', words: ['wie', 'was', 'warum', 'erkläre', 'danke', 'hallo', 'ich', 'kannst', 'bitte'] },
  { lang: 'pt', words: ['como', 'por que', 'explica', 'obrigado', 'olá', 'você', 'preciso', 'pode'] },
  { lang: 'id', words: ['bagaimana', 'kenapa', 'jelaskan', 'terima', 'kasih', 'tolong', 'apa'] },
  { lang: 'tr', words: ['nasıl', 'neden', 'açıkla', 'teşekkür', 'merhaba', 'lütfen'] },
  { lang: 'it', words: ['come', 'perché', 'spiega', 'grazie', 'ciao', 'puoi'] },
];

export function detectWorldLang(text: string): WorldLang {
  for (const { lang, regex } of SCRIPT_RANGES) {
    if (regex.test(text)) return lang;
  }
  const words = text.toLowerCase().split(/\s+/);
  if (words.some(w => HINDI_WORDS.includes(w))) return 'hi';
  for (const { lang, words: hints } of WORD_HINTS) {
    if (words.some(w => hints.includes(w))) return lang;
  }
  return 'en';
}

// Short localized framing line shown when the question was asked in a
// language we can detect but can't fully answer in yet (content stays
// English/Hinglish below this line).
const LANG_INTROS: Partial<Record<WorldLang, string>> = {
  es: 'Puedo entender tu pregunta en español. Por ahora explico en detalle en inglés/hindi, pero aquí tienes la respuesta completa:',
  fr: "Je comprends ta question en français. Pour l'instant, j'explique en détail en anglais/hindi, mais voici la réponse complète :",
  de: 'Ich verstehe deine Frage auf Deutsch. Momentan erkläre ich ausführlich auf Englisch/Hindi, hier ist trotzdem die volle Antwort:',
  pt: 'Entendo sua pergunta em português. Por enquanto explico em detalhe em inglês/hindi, mas aqui está a resposta completa:',
  ar: 'أفهم سؤالك بالعربية. حاليًا أشرح بالتفصيل بالإنجليزية/الهندية، لكن إليك الإجابة الكاملة أدناه:',
  ur: 'میں آپ کا سوال اردو میں سمجھ سکتا ہوں۔ فی الحال میں انگریزی/ہندی میں تفصیل سے بتاتا ہوں، مکمل جواب نیچے ہے:',
  zh: '我能理解你用中文提出的问题。目前详细讲解仍以英语/印地语为主,完整答案如下:',
  ja: '日本語での質問を理解できます。今のところ詳しい説明は英語/ヒンディー語ですが、以下に完全な回答があります:',
  ko: '한국어 질문을 이해할 수 있어요. 지금은 자세한 설명을 영어/힌디어로 드리지만, 아래 전체 답변을 확인하세요:',
  ru: 'Я понимаю ваш вопрос на русском. Пока подробное объяснение на английском/хинди, но вот полный ответ ниже:',
  bn: 'আমি বাংলায় আপনার প্রশ্ন বুঝতে পারছি। আপাতত বিস্তারিত ব্যাখ্যা ইংরেজি/হিন্দিতে দিচ্ছি, নিচে সম্পূর্ণ উত্তর:',
  ta: 'உங்கள் தமிழ் கேள்வியை என்னால் புரிந்துகொள்ள முடிகிறது. தற்போது விரிவான விளக்கம் ஆங்கிலம்/இந்தியில் உள்ளது, முழு பதில் கீழே:',
  te: 'మీ తెలుగు ప్రశ్నను నేను అర్థం చేసుకోగలను. ప్రస్తుతం వివరణ ఇంగ్లీష్/హిందీలో ఇస్తున్నాను, పూర్తి సమాధానం క్రింద ఉంది:',
  id: 'Saya memahami pertanyaan Anda dalam Bahasa Indonesia. Untuk saat ini penjelasan detail dalam Inggris/Hindi, tapi berikut jawaban lengkapnya:',
  tr: 'Sorunuzu Türkçe olarak anlayabiliyorum. Şu an ayrıntılı açıklamayı İngilizce/Hintçe yapıyorum, tam cevap aşağıda:',
  it: 'Capisco la tua domanda in italiano. Per ora spiego in dettaglio in inglese/hindi, ma ecco la risposta completa:',
};

// ── KNOWLEDGE BASE ────────────────────────────────────────────
const KB: Record<string, { keys: string[]; en: string; hi: string }> = {

  // ── BITZY APP ──────────────────────────────────────────────
  xp: {
    keys: ['xp','experience','point','score','earn xp','xp kaise','level up','xp system'],
    en: `**XP (Experience Points)** — yeh Bitzy ka main currency hai! 🎯

**How to earn XP:**
• ✅ Complete a lesson → **+25 XP**
• 📝 Complete a quiz → **+50 XP**
• ⚡ Solve an Arena challenge → **+75 XP**
• 🔥 Daily streak bonus → **+10 XP per day**

**Level System:**
• Level 1 → Level 2 needs 100 XP
• Each level needs 100 more XP than the previous
• Higher level = more respect on Leaderboard!

**Pro tip:** Arena challenges give the most XP. Solve 1 challenge = 3 lessons worth of XP! 🚀`,
    hi: `**XP (Experience Points)** — yeh Bitzy ka sabse important cheez hai! 🎯

**XP kaise kamao:**
• ✅ Lesson complete karo → **+25 XP**
• 📝 Quiz complete karo → **+50 XP**
• ⚡ Arena challenge solve karo → **+75 XP**
• 🔥 Daily streak → **+10 XP har din**

**Level System:**
• Level 1 se Level 2 ke liye 100 XP chahiye
• Har level pe 100 zyada XP lagte hain
• Jitna zyada level, leaderboard pe utni izzat! 😎

**Pro tip bhai:** Arena challenges mein sabse zyada XP milta hai. 1 challenge = 3 lessons ka XP! 🚀`
  },

  energy: {
    keys: ['energy','heart','hearts','life','lives','energy kya','hearts kya','energy kaise','refill'],
    en: `**Energy / Hearts System** ⚡

Energy is your "fuel" in Bitzy. You need it to:
• 📖 Open and complete lessons
• 💡 Use hints in Arena
• ▶️ Run code in challenges

**Rules:**
• You start with **5 energy**
• Each action costs **1 energy**
• Energy **auto-refills over time** (1 per hour)
• When energy = 0, wait for refill or come back later

**Tips:**
• Plan your sessions — don't waste energy on easy stuff
• Morning mein fresh energy hoti hai!
• Focus on hardest topics when energy is full`,
    hi: `**Energy / Hearts System** ⚡

Energy matlab Bitzy mein tumhara "fuel" — iske bina kuch nahi hoga!

**Energy kab lagti hai:**
• 📖 Lesson kholne pe
• 💡 Arena mein hint use karne pe
• ▶️ Code run karne pe

**Rules:**
• Shuru mein **5 energy** milti hai
• Har action mein **1 energy** jati hai
• Energy **khud se refill** hoti hai — 1 per hour
• Jab 0 ho jaye, thoda wait karo ya kal aao 😄

**Tip yaar:** Jab puri energy ho tab mushkil topics karo — easy cheezein baad mein!`
  },

  streak: {
    keys: ['streak','streaks','daily','login streak','fire','365','consecutive','din'],
    en: `**Streak System** 🔥

A streak = how many days in a row you've logged into Bitzy!

**Streak Rewards:**
• 3-day streak → 🎁 Bonus coins + badge
• 7-day streak → 🏆 Special badge + XP boost
• 30-day streak → 💎 Rare badge!

**How to keep your streak:**
1. Login every single day (even for 5 mins)
2. Complete at least 1 lesson/quiz
3. Midnight reset — so login before 12am!

**Streak broke? Don't worry!** Start again — consistency is what matters. The best coders code every day! 💪`,
    hi: `**Streak System** 🔥

Streak = kitne din se lagaataar Bitzy use kar rahe ho!

**Streak pe kya milega:**
• 3 din ka streak → 🎁 Bonus coins + badge
• 7 din ka streak → 🏆 Special badge + XP boost
• 30 din ka streak → 💎 Rare badge!

**Streak kaise bachao:**
1. Har din login karo (5 minute bhi chalega)
2. Kam se kam 1 lesson ya quiz karo
3. Midnight pe reset hoti hai — 12 baje se pehle karo!

**Bhai streak toot gayi?** Koi baat nahi! Firse shuru karo — ek baar habit ban gayi toh rok nahi sakte! 💪`
  },

  coins: {
    keys: ['coin','coins','gem','gems','currency','shop','buy','purchase','paisa'],
    en: `**Coins & Gems** 💰

Coins are Bitzy's reward currency!

**Earn coins:**
• Complete lesson → **+10 coins**
• Complete quiz → **+15 coins**
• Solve Arena challenge → **+30 coins**
• Daily streak bonus → extra coins!

**Use coins for:**
• 🛍️ Future shop items (coming soon!)
• 🏆 Unlocking special content
• Showing off your wealth on profile 😄

**Tip:** Coins don't expire — keep earning and save up!`,
    hi: `**Coins & Gems** 💰

Coins = Bitzy ki apni currency bhai!

**Coins kaise milenge:**
• Lesson complete → **+10 coins**
• Quiz complete → **+15 coins**
• Arena challenge → **+30 coins**
• Daily streak pe bonus!

**Coins ka use:**
• 🛍️ Future shop items (jaldi aa raha hai!)
• 🏆 Special content unlock
• Profile pe flex karo 😄

Bhai coins kabhi expire nahi hote — kamao aur save karo!`
  },

  badges: {
    keys: ['badge','badges','achievement','achievements','unlock','trophy','reward','medal'],
    en: `**Badges & Achievements** 🏅

Badges are special rewards you unlock by hitting milestones!

**Types of badges:**
• 🎓 **Learning badges** — Complete X lessons
• ⚡ **Arena badges** — Solve X challenges
• 🔥 **Streak badges** — 3, 7, 30 day streaks
• 📈 **Level badges** — Reach Level 5, 10, 20...
• 🏆 **Special badges** — Rare, secret achievements

**How to see your badges:**
Go to **Profile → Badges** section

**Tips to unlock fast:**
1. Do lessons daily for streak badges
2. Arena challenges for combat badges
3. Level up consistently for level badges

Show them off — they're your coding trophies! 🏆`,
    hi: `**Badges & Achievements** 🏅

Badges = tumhari coding trophies! Milestones hit karo, badges unlock karo!

**Badge types:**
• 🎓 **Learning badges** — X lessons complete karo
• ⚡ **Arena badges** — X challenges solve karo
• 🔥 **Streak badges** — 3, 7, 30 din ke streaks
• 📈 **Level badges** — Level 5, 10, 20 reach karo
• 🏆 **Special badges** — Rare aur secret wale!

**Badges kahan dekhein:**
**Profile → Badges** section mein jao

**Jaldi unlock karne ke tips:**
1. Roz lessons karo streak badges ke liye
2. Arena challenges karo combat badges ke liye
3. Consistently level up karte raho

Inhe dikhao yaar — yeh sab tumhari mehnat ka saboot hai! 💪`
  },

  courses: {
    keys: ['course','courses','curriculum','syllabus','learn','sikhna','konsa course','beginner','start','shuru'],
    en: `**Bitzy Courses** 📚

We have courses for every level!

**Beginner Path (Start here!):**
1. 🌐 **HTML** — Building web pages
2. 🎨 **CSS** — Making things beautiful
3. ⚡ **JavaScript** — Making things interactive
4. 🐍 **Python** — Great for logic & AI

**Intermediate:**
5. 🔧 **Git** — Version control (must know!)
6. 📘 **TypeScript** — JavaScript with superpowers
7. 🗄️ **SQL** — Databases & data management

**Advanced:**
8. ⚛️ **React** — Modern web apps
9. 🟢 **Node.js** — Backend development
10. 🔣 **Data Structures** — Algorithms & logic

**Recommended path for absolute beginners:**
HTML → CSS → JavaScript → Python → Git`,
    hi: `**Bitzy Courses** 📚

Har level ke liye courses hain bhai!

**Beginner Path (Yahan se shuru karo!):**
1. 🌐 **HTML** — Web pages banana
2. 🎨 **CSS** — Cheezein sundar banana
3. ⚡ **JavaScript** — Cheezein interactive banana
4. 🐍 **Python** — Logic aur AI ke liye

**Intermediate:**
5. 🔧 **Git** — Version control (zaroor seekho!)
6. 📘 **TypeScript** — JavaScript ka bada bhai
7. 🗄️ **SQL** — Databases manage karna

**Advanced:**
8. ⚛️ **React** — Modern web apps
9. 🟢 **Node.js** — Backend development
10. 🔣 **Data Structures** — Algorithms & logic

**Bilkul beginner ho? Yeh path follow karo:**
HTML → CSS → JavaScript → Python → Git`
  },

  arena: {
    keys: ['arena','challenge','challenges','problem','solve','competitive','coding challenge','arena kya'],
    en: `**Arena — Coding Challenges** ⚔️

Arena is where you test your real coding skills!

**How it works:**
1. Choose a challenge (Easy/Medium/Hard)
2. Read the problem statement
3. Write your solution in the code editor
4. Run tests to check your answer
5. Submit when all tests pass!

**Rewards per challenge:**
• Easy → **+30 XP, +15 coins**
• Medium → **+50 XP, +25 coins**
• Hard → **+75 XP, +40 coins**

**Hints system:**
• Each hint costs 1 energy
• Use wisely — try yourself first!

**Tips to solve faster:**
1. Read problem twice before coding
2. Write pseudocode first
3. Test with simple examples
4. Use hints only when truly stuck`,
    hi: `**Arena — Coding Challenges** ⚔️

Arena mein apni real coding skills test karo!

**Kaise kaam karta hai:**
1. Challenge choose karo (Easy/Medium/Hard)
2. Problem padho
3. Code editor mein solution likho
4. Tests run karo
5. Sab pass ho jaye toh submit karo!

**Rewards:**
• Easy → **+30 XP, +15 coins**
• Medium → **+50 XP, +25 coins**
• Hard → **+75 XP, +40 coins**

**Hints:**
• Har hint mein 1 energy lagti hai
• Pehle khud try karo bhai!

**Tips:**
1. Problem do baar padho pehle
2. Pehle pseudocode likho
3. Simple examples se test karo
4. Hint sirf jab bilkul nahi samjhe`
  },

  games: {
    keys: ['game','games','play','quiz game','speed typing','bug hunt','memory','code battle','mini game'],
    en: `**Bitzy Games** 🎮

Fun games to reinforce your coding skills!

**Available Games:**
• 🧠 **Code Quiz** — Answer coding MCQs, earn XP fast
• ⌨️ **Speed Typing** — Type code faster, improve accuracy
• 🐛 **Bug Hunt** — Find the bug in broken code
• 🧩 **Memory Match** — Match code terms to definitions
• ⚔️ **Code Battle** — PvP-style coding challenges
• 🔮 **Code Prediction** — Predict code output
• 📝 **Fill in the Blank** — Complete the missing code

**Best games for beginners:** Code Quiz + Memory Match
**Best for practice:** Bug Hunt + Fill in the Blank
**Most XP:** Code Battle + Code Quiz`,
    hi: `**Bitzy Games** 🎮

Fun games se coding skills strong karo!

**Available Games:**
• 🧠 **Code Quiz** — Coding MCQs, fast XP
• ⌨️ **Speed Typing** — Tez type karo, accuracy badho
• 🐛 **Bug Hunt** — Broken code mein bug dhundho
• 🧩 **Memory Match** — Code terms aur definitions match karo
• ⚔️ **Code Battle** — PvP coding challenges
• 🔮 **Code Prediction** — Code ka output predict karo
• 📝 **Fill in the Blank** — Missing code complete karo

**Beginners ke liye:** Code Quiz + Memory Match
**Practice ke liye:** Bug Hunt + Fill in the Blank
**Zyada XP:** Code Battle + Code Quiz`
  },

  leaderboard: {
    keys: ['leaderboard','rank','ranking','top player','diamond league','league','position','#1','number 1'],
    en: `**Diamond League Leaderboard** 🏆

The leaderboard shows all Bitzy players ranked by XP!

**How ranking works:**
1. Primary sort: **Total XP** (highest first)
2. Tie-breaker: **Streak** (longer streak wins)

**Top 3 get a special podium!** 👑🥈🥉

**How to climb ranks:**
• Do Arena challenges (most XP per activity)
• Complete quizzes daily
• Maintain your streak
• Play Code Quiz game repeatedly

**Pro strategy:** 1 Arena challenge > 3 lessons in terms of XP. Focus on Arena!`,
    hi: `**Diamond League Leaderboard** 🏆

Sab Bitzy players yahan XP ke hisaab se rank hote hain!

**Ranking kaise hoti hai:**
1. Pehle: **Total XP** (jitna zyada, utna upar)
2. Agar tie ho: **Streak** (jiska zyada, woh aage)

**Top 3 ko special podium milta hai!** 👑🥈🥉

**Rank kaise chadho:**
• Arena challenges karo (sabse zyada XP)
• Roz quizzes complete karo
• Streak maintain raho
• Code Quiz game repeatedly khelo

**Pro tip bhai:** 1 Arena challenge = 3 lessons ka XP. Arena focus karo!`
  },

  // ── PROGRAMMING TOPICS ─────────────────────────────────────

  variables: {
    keys: ['variable','variables','var','let','const','declare','declaration','assignment','var vs let','let vs const'],
    en: `**Variables in JavaScript** 📦

Think of variables like labeled boxes — you store data in them!

**3 ways to declare:**
\`\`\`javascript
var name = "Bitzy";    // Old way — avoid this
let age = 16;          // Can change later ✅
const PI = 3.14;       // Never changes ✅
\`\`\`

**Key differences:**
| | var | let | const |
|--|--|--|--|
| Can reassign | ✅ | ✅ | ❌ |
| Block scoped | ❌ | ✅ | ✅ |
| Hoisted | ✅ | ❌ | ❌ |

**Rule of thumb:**
• Use \`const\` by default
• Use \`let\` if you need to reassign
• Never use \`var\` in modern code

**Try karo:** Create a variable for your name and age using const and let!`,
    hi: `**Variables in JavaScript** 📦

Variables ko aise socho — labeled boxes jisme data rakhte hain!

**3 tarike:**
\`\`\`javascript
var name = "Bitzy";    // Purana tarika — mat use karo
let age = 16;          // Baad mein badal sakte ho ✅
const PI = 3.14;       // Kabhi nahi badlega ✅
\`\`\`

**Farak kya hai:**
• \`const\` — value kabhi nahi badlegi
• \`let\` — value baad mein badal sakte ho
• \`var\` — purana hai, avoid karo

**Simple rule yaar:**
• Default pe \`const\` use karo
• Agar value change karni ho toh \`let\`
• \`var\` kabhi mat use karo modern code mein

**Try karo:** Apna naam aur age \`const\` aur \`let\` se banao!`
  },

  functions: {
    keys: ['function','functions','arrow function','callback','return','def','method','func','parameter','argument'],
    en: `**Functions in JavaScript** ⚙️

Functions are reusable blocks of code — like recipes!

**3 ways to write functions:**
\`\`\`javascript
// 1. Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

// 2. Function expression
const greet = function(name) {
  return "Hello, " + name + "!";
};

// 3. Arrow function (modern, preferred)
const greet = (name) => {
  return "Hello, " + name + "!";
};

// Short arrow (single return)
const greet = name => "Hello, " + name + "!";
\`\`\`

**Calling a function:**
\`\`\`javascript
console.log(greet("Aaryan")); // Hello, Aaryan!
\`\`\`

**Key concepts:**
• **Parameters** = inputs (name)
• **Return** = output
• **Calling** = using the function

**Try karo:** Write a function that takes 2 numbers and returns their sum!`,
    hi: `**Functions in JavaScript** ⚙️

Functions = reusable code blocks — jaise recipes hoti hain!

**3 tarike:**
\`\`\`javascript
// 1. Normal function
function greet(naam) {
  return "Hello, " + naam + "!";
}

// 2. Arrow function (modern way)
const greet = (naam) => {
  return "Hello, " + naam + "!";
};

// Short form
const greet = naam => "Hello, " + naam + "!";
\`\`\`

**Use kaise karein:**
\`\`\`javascript
console.log(greet("Aaryan")); // Hello, Aaryan!
\`\`\`

**Yaad rakho:**
• **Parameters** = inputs jo andar jaate hain
• **Return** = output jo bahar aata hai
• **Calling** = function ko use karna

**Try karo bhai:** Ek function banao jo 2 numbers leke unka sum return kare!`
  },

  closures: {
    keys: ['closure','closures','scope','lexical','inner function','outer function','closure kya','closure explain'],
    en: `**Closures in JavaScript** 🔐

A closure = a function that remembers variables from its outer scope, even after the outer function finishes!

**Simple example:**
\`\`\`javascript
function counter() {
  let count = 0;           // outer variable

  return function() {      // inner function (closure)
    count++;
    return count;
  };
}

const myCounter = counter();
console.log(myCounter()); // 1
console.log(myCounter()); // 2
console.log(myCounter()); // 3
\`\`\`

**What happened?**
• \`counter()\` ran and finished
• But \`count\` is still alive! 👻
• The inner function "closed over" the \`count\` variable

**Real world use:**
\`\`\`javascript
function makeMultiplier(x) {
  return (num) => num * x;  // remembers x!
}

const double = makeMultiplier(2);
const triple = makeMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
\`\`\`

**Try karo:** Make a function that remembers how many times it's been called!`,
    hi: `**Closures in JavaScript** 🔐

Closure = ek function jo apne bahar ke variables yaad rakhta hai, chahe outer function khatam ho jaye!

**Simple example:**
\`\`\`javascript
function counter() {
  let count = 0;        // bahar ka variable

  return function() {   // andar ka function (closure)
    count++;
    return count;
  };
}

const myCounter = counter();
console.log(myCounter()); // 1
console.log(myCounter()); // 2
console.log(myCounter()); // 3
\`\`\`

**Kya hua yahan:**
• \`counter()\` khatam ho gaya
• Lekin \`count\` abhi bhi zinda hai! 👻
• Inner function ne \`count\` ko "yaad" rakh liya

**Analogy:** Socho jaise ek dukaan band ho gayi, lekin dukandaar ne apni chabhi rakhi hui hai — andar ghus sakta hai!

**Real use:**
\`\`\`javascript
function multiplier(x) {
  return (num) => num * x; // x yaad hai!
}

const double = multiplier(2);
console.log(double(5)); // 10
\`\`\`

**Try karo bhai:** Ek function banao jo count kare kitni baar call hua!`
  },

  arrays: {
    keys: ['array','arrays','list','push','pop','map','filter','reduce','foreach','slice','splice','index','length'],
    en: `**Arrays in JavaScript** 📋

Arrays = ordered lists of items!

**Create an array:**
\`\`\`javascript
const fruits = ["apple", "banana", "mango"];
const nums = [1, 2, 3, 4, 5];
\`\`\`

**Access items (0-indexed!):**
\`\`\`javascript
console.log(fruits[0]); // "apple"
console.log(fruits[2]); // "mango"
\`\`\`

**Most useful methods:**
\`\`\`javascript
// Add/Remove
fruits.push("grape");     // add at end
fruits.pop();             // remove from end
fruits.unshift("kiwi");   // add at start

// Transform (return new array)
const upper = fruits.map(f => f.toUpperCase());
const long = fruits.filter(f => f.length > 5);
const total = nums.reduce((sum, n) => sum + n, 0);

// Find
const found = fruits.find(f => f === "mango");
const idx = fruits.indexOf("banana"); // 1
\`\`\`

**Try karo:** Create an array of 5 numbers, then use filter to keep only even numbers!`,
    hi: `**Arrays in JavaScript** 📋

Array = items ki ordered list — jaise ek numbered list!

**Array banao:**
\`\`\`javascript
const fruits = ["apple", "banana", "mango"];
const nums = [1, 2, 3, 4, 5];
\`\`\`

**Items access karo (0 se shuru hoti hai):**
\`\`\`javascript
console.log(fruits[0]); // "apple"
console.log(fruits[2]); // "mango"
\`\`\`

**Sabse kaam ke methods:**
\`\`\`javascript
fruits.push("grape");  // end mein add
fruits.pop();          // end se remove

// New array banate hain
const bade = fruits.map(f => f.toUpperCase());
const chote = fruits.filter(f => f.length <= 5);
const sum = nums.reduce((total, n) => total + n, 0);
\`\`\`

**Try karo bhai:** 5 numbers ki array banao, phir sirf even numbers filter karo!`
  },

  objects: {
    keys: ['object','objects','key value','property','method','json','dot notation','bracket notation','this'],
    en: `**Objects in JavaScript** 🎁

Objects store related data together — like a real-world thing with properties!

**Create an object:**
\`\`\`javascript
const person = {
  name: "Aaryan",
  age: 16,
  city: "Mumbai",
  isStudent: true
};
\`\`\`

**Access properties:**
\`\`\`javascript
console.log(person.name);      // "Aaryan" (dot notation)
console.log(person["age"]);    // 16 (bracket notation)
\`\`\`

**Add/Update/Delete:**
\`\`\`javascript
person.email = "a@b.com";     // add
person.age = 17;               // update
delete person.city;            // delete
\`\`\`

**Methods (functions inside objects):**
\`\`\`javascript
const dog = {
  name: "Buddy",
  bark: function() {
    return this.name + " says: Woof!";
  }
};

console.log(dog.bark()); // "Buddy says: Woof!"
\`\`\`

**Try karo:** Create an object for yourself with name, age, hobby, and a method to introduce yourself!`,
    hi: `**Objects in JavaScript** 🎁

Object = ek real-world cheez ka digital representation — properties aur values ke saath!

**Object banao:**
\`\`\`javascript
const person = {
  name: "Aaryan",
  age: 16,
  city: "Mumbai",
  student: true
};
\`\`\`

**Properties access karo:**
\`\`\`javascript
console.log(person.name);    // "Aaryan"
console.log(person["age"]);  // 16
\`\`\`

**Add/Update/Delete:**
\`\`\`javascript
person.email = "a@b.com";  // naya property
person.age = 17;            // update
delete person.city;         // delete
\`\`\`

**Methods — functions inside object:**
\`\`\`javascript
const dog = {
  name: "Buddy",
  bark() {
    return this.name + " bol raha hai: Woof!";
  }
};
console.log(dog.bark()); // "Buddy bol raha hai: Woof!"
\`\`\`

**Try karo:** Apna ek object banao — naam, age, hobby, aur ek method jo tumhara introduction de!`
  },

  promises: {
    keys: ['promise','promises','async','await','async await','then','catch','asynchronous','fetch','api call','setTimeout'],
    en: `**Promises & Async/Await** ⏳

Promises handle things that take time — like API calls!

**The problem:**
\`\`\`javascript
// This doesn't work — data isn't ready yet!
const data = fetchFromServer(); // takes 2 seconds
console.log(data); // undefined! 😱
\`\`\`

**Solution 1 — Promises:**
\`\`\`javascript
fetchFromServer()
  .then(data => {
    console.log(data); // works! ✅
  })
  .catch(error => {
    console.log("Error:", error);
  });
\`\`\`

**Solution 2 — Async/Await (cleaner):**
\`\`\`javascript
async function loadData() {
  try {
    const data = await fetchFromServer();
    console.log(data); // works! ✅
  } catch (error) {
    console.log("Error:", error);
  }
}

loadData();
\`\`\`

**Real example — fetch API:**
\`\`\`javascript
async function getUsers() {
  const res = await fetch("https://api.example.com/users");
  const users = await res.json();
  return users;
}
\`\`\`

**Try karo:** Wrap a setTimeout in a Promise and resolve it after 2 seconds!`,
    hi: `**Promises & Async/Await** ⏳

Promise = ek guarantee ki "yeh kaam ho jayega, thoda wait karo!"

**Problem:**
\`\`\`javascript
// Yeh kaam nahi karta — data abhi ready nahi!
const data = serverSeData(); // 2 second lagenge
console.log(data); // undefined! 😱
\`\`\`

**Solution 1 — Promise:**
\`\`\`javascript
serverSeData()
  .then(data => {
    console.log(data); // ho gaya! ✅
  })
  .catch(error => {
    console.log("Error:", error);
  });
\`\`\`

**Solution 2 — Async/Await (better aur clean):**
\`\`\`javascript
async function dataLao() {
  try {
    const data = await serverSeData();
    console.log(data); // ✅
  } catch (error) {
    console.log("Error:", error);
  }
}
\`\`\`

**Analogy bhai:** Socho tumne pizza order kiya — promise hai ki milega. await matlab "jab tak nahi aaya, ruk jao". .then() matlab "aane ke baad yeh karo"!

**Try karo:** setTimeout ko Promise mein wrap karo aur 2 second baad resolve karo!`
  },

  reactHooks: {
    keys: ['hook','hooks','usestate','useeffect','useref','usecallback','usememo','usecontext','react hook','state management'],
    en: `**React Hooks** ⚛️

Hooks let you use state and other React features in functional components!

**useState — store data:**
\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // initial value = 0

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
\`\`\`

**useEffect — run code on events:**
\`\`\`jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // runs when component mounts
    console.log("Component loaded!");
    
    // cleanup function
    return () => console.log("Component removed!");
  }, []); // [] = run only once
\`\`\`

**useRef — access DOM elements:**
\`\`\`jsx
const inputRef = useRef(null);

<input ref={inputRef} />
<button onClick={() => inputRef.current.focus()}>
  Focus Input
</button>
\`\`\`

**Golden rules:**
1. Only call hooks at the top level (not inside if/loops)
2. Only call hooks in React functions
3. Always include dependencies in useEffect array

**Try karo:** Build a counter with useState that also logs every count change using useEffect!`,
    hi: `**React Hooks** ⚛️

Hooks = functional components mein state aur features use karne ka tarika!

**useState — data store karo:**
\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0); // 0 se shuru

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
\`\`\`

**useEffect — side effects handle karo:**
\`\`\`jsx
useEffect(() => {
  console.log("Component load hua!");
  
  return () => console.log("Component hata!");
}, []); // [] = sirf ek baar chale
\`\`\`

**Analogy bhai:**
• \`useState\` = ek diary jisme value likho
• \`useEffect\` = ek watcher jo changes dekhe
• \`useRef\` = ek sticky note jo render pe reset nahi hoti

**Golden rules:**
1. Hooks sirf top level pe call karo (if/loop mein nahi)
2. Sirf React functions mein use karo

**Try karo:** Counter banao jisme useState se count track ho aur useEffect se har change log ho!`
  },

  css: {
    keys: ['css','flexbox','grid','styling','style','layout','flex','display','position','margin','padding','responsive','media query','tailwind','bootstrap'],
    en: `**CSS — Styling Made Simple** 🎨

CSS makes your HTML look beautiful!

**Flexbox (most useful layout):**
\`\`\`css
.container {
  display: flex;
  justify-content: center;   /* horizontal alignment */
  align-items: center;       /* vertical alignment */
  gap: 16px;                 /* space between items */
  flex-wrap: wrap;           /* wrap to next line */
}
\`\`\`

**CSS Grid (for complex layouts):**
\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 equal columns */
  gap: 20px;
}
\`\`\`

**The Box Model:**
\`\`\`
┌─────────────────────────┐
│         MARGIN          │
│  ┌───────────────────┐  │
│  │      BORDER       │  │
│  │  ┌─────────────┐  │  │
│  │  │   PADDING   │  │  │
│  │  │  ┌───────┐  │  │  │
│  │  │  │ CONTENT│  │  │  │
│  │  │  └───────┘  │  │  │
\`\`\`

**Responsive design:**
\`\`\`css
/* Mobile first */
.box { width: 100%; }

/* Tablet and up */
@media (min-width: 768px) {
  .box { width: 50%; }
}

/* Desktop */
@media (min-width: 1024px) {
  .box { width: 33%; }
}
\`\`\`

**Try karo:** Center a div both horizontally and vertically using flexbox!`,
    hi: `**CSS — Styling ka Magic** 🎨

CSS se HTML ko sundar banate hain!

**Flexbox (sabse useful):**
\`\`\`css
.container {
  display: flex;
  justify-content: center; /* horizontal center */
  align-items: center;     /* vertical center */
  gap: 16px;               /* items ke beech space */
}
\`\`\`

**Grid (complex layouts ke liye):**
\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 columns */
  gap: 20px;
}
\`\`\`

**Box Model yaad rakho:**
• **Content** = actual cheez
• **Padding** = content ke around inner space
• **Border** = line/outline
• **Margin** = bahar ka space

**Responsive design:**
\`\`\`css
/* Mobile */
.box { width: 100%; }

/* Tablet se upar */
@media (min-width: 768px) {
  .box { width: 50%; }
}
\`\`\`

**Analogy:** Padding = kapde ke andar ka space, Margin = logon ke beech ka space 😄

**Try karo bhai:** Flexbox use karke ek div ko screen ke bilkul center mein rakho!`
  },

  python: {
    keys: ['python','py','python basics','print','def python','list python','dict','dictionary','pip','indentation'],
    en: `**Python — Beginner's Best Friend** 🐍

Python is clean, readable, and powerful!

**Basics:**
\`\`\`python
# Variables (no need to declare type!)
name = "Aaryan"
age = 16
is_student = True

# Print
print(f"Hello {name}, you are {age}!")

# Input from user
user_input = input("Enter your name: ")
\`\`\`

**Lists (like JS arrays):**
\`\`\`python
fruits = ["apple", "banana", "mango"]
fruits.append("grape")      # add
fruits.remove("banana")     # remove
print(fruits[0])            # "apple"

# List comprehension (powerful!)
squares = [x**2 for x in range(1, 6)]
# [1, 4, 9, 16, 25]
\`\`\`

**Functions:**
\`\`\`python
def greet(name, age=0):    # default parameter
    return f"Hi {name}, you are {age} years old!"

print(greet("Aaryan", 16))
\`\`\`

**Dictionaries (like JS objects):**
\`\`\`python
person = {
    "name": "Aaryan",
    "age": 16,
    "city": "Mumbai"
}

print(person["name"])      # "Aaryan"
person["email"] = "a@b.com"  # add key
\`\`\`

**Try karo:** Write a Python function that takes a list of numbers and returns only the even ones!`,
    hi: `**Python — Sabse Aasan Language** 🐍

Python simple, clean, aur powerful hai — beginners ki best friend!

**Basics:**
\`\`\`python
# Variables — type batana zaruri nahi!
naam = "Aaryan"
age = 16
student = True

# Print
print(f"Hello {naam}, age hai {age}!")

# User se input
user = input("Apna naam likho: ")
\`\`\`

**Lists (JS arrays jaisi):**
\`\`\`python
fruits = ["apple", "banana", "mango"]
fruits.append("grape")   # add
fruits.remove("banana")  # remove

# Short trick
squares = [x**2 for x in range(1, 6)]
# [1, 4, 9, 16, 25]
\`\`\`

**Functions:**
\`\`\`python
def greet(naam, age=0):
    return f"Hi {naam}, tumhari age {age} hai!"

print(greet("Aaryan", 16))
\`\`\`

**Dictionary (JS object jaisa):**
\`\`\`python
person = {
    "naam": "Aaryan",
    "age": 16,
    "city": "Mumbai"
}
print(person["naam"])
\`\`\`

**Python ka superpower:** Code padha seedha samajh aata hai, English jaisa lagta hai!

**Try karo bhai:** Ek function banao jo numbers ki list le aur sirf even numbers return kare!`
  },

  git: {
    keys: ['git','github','version control','commit','push','pull','branch','merge','clone','repository','repo','init'],
    en: `**Git — Version Control** 🔧

Git saves your code history — like Ctrl+Z on steroids!

**Essential commands:**
\`\`\`bash
# Setup (one time)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Start a project
git init                    # new repo
git clone <url>             # clone existing repo

# Daily workflow
git status                  # see what changed
git add .                   # stage all changes
git add filename.js         # stage one file
git commit -m "your message" # save snapshot

# Sync with GitHub
git push origin main        # upload
git pull origin main        # download
\`\`\`

**Branching:**
\`\`\`bash
git branch feature-login    # create branch
git checkout feature-login  # switch to it
git checkout -b new-feature # create + switch in one go

git merge feature-login     # merge into current branch
\`\`\`

**The Golden Rule:**
Commit early, commit often. Each commit = one logical change!

**Try karo:** Init a git repo, make a file, add and commit it!`,
    hi: `**Git — Version Control** 🔧

Git = tumhare code ka time machine — koi bhi purana version wapas la sakte ho!

**Zaruri commands:**
\`\`\`bash
# Pehli baar setup
git config --global user.name "Tumhara Naam"
git config --global user.email "email@example.com"

# Project shuru karo
git init                      # naya repo
git clone <url>               # existing copy karo

# Roz ka kaam
git status                    # kya badla dekho
git add .                     # sab changes stage karo
git commit -m "message"       # snapshot save karo

# GitHub pe bhejo
git push origin main          # upload
git pull origin main          # download
\`\`\`

**Branching (alag feature pe kaam karo):**
\`\`\`bash
git checkout -b new-feature  # naya branch banao + switch karo
git merge new-feature         # wapas merge karo
\`\`\`

**Analogy bhai:**
• **Commit** = game ka checkpoint save karna
• **Branch** = game ka naya playthrough
• **Merge** = dono playthroughs combine karna

**Try karo:** Apne computer pe git init karo, ek file banao, aur pehla commit karo!`
  },

  sql: {
    keys: ['sql','database','query','select','table','insert','update','delete','join','where','mysql','postgres','supabase','db'],
    en: `**SQL — Database Language** 🗄️

SQL lets you store, retrieve, and manipulate data in databases!

**Basic CRUD operations:**
\`\`\`sql
-- CREATE (Insert data)
INSERT INTO users (name, age, email)
VALUES ('Aaryan', 16, 'a@b.com');

-- READ (Get data)
SELECT * FROM users;
SELECT name, age FROM users WHERE age > 15;
SELECT * FROM users ORDER BY age DESC LIMIT 10;

-- UPDATE (Modify data)
UPDATE users SET age = 17 WHERE name = 'Aaryan';

-- DELETE (Remove data)
DELETE FROM users WHERE age < 13;
\`\`\`

**JOINs (connect tables):**
\`\`\`sql
-- Get users with their orders
SELECT users.name, orders.product
FROM users
INNER JOIN orders ON users.id = orders.user_id;
\`\`\`

**Useful functions:**
\`\`\`sql
SELECT COUNT(*) FROM users;          -- count rows
SELECT AVG(age) FROM users;          -- average
SELECT MAX(age), MIN(age) FROM users; -- max/min
SELECT * FROM users WHERE name LIKE '%ary%'; -- search
\`\`\`

**Try karo:** Write a query to find all users above age 18, ordered by name!`,
    hi: `**SQL — Database ki Language** 🗄️

SQL se database mein data store, fetch aur manage karte hain!

**Basic operations:**
\`\`\`sql
-- Data daalo (CREATE)
INSERT INTO users (naam, age, email)
VALUES ('Aaryan', 16, 'a@b.com');

-- Data nikalo (READ)
SELECT * FROM users;
SELECT naam, age FROM users WHERE age > 15;

-- Data badlo (UPDATE)
UPDATE users SET age = 17 WHERE naam = 'Aaryan';

-- Data hatao (DELETE)
DELETE FROM users WHERE age < 13;
\`\`\`

**JOIN — do tables connect karo:**
\`\`\`sql
SELECT users.naam, orders.product
FROM users
INNER JOIN orders ON users.id = orders.user_id;
\`\`\`

**Analogy bhai:**
• **Table** = Excel sheet
• **Row** = ek entry
• **Column** = ek field (naam, age, etc.)
• **SELECT** = filter lagao aur data nikalo

**Try karo:** Ek query likho jo 18 se upar ke sab users ko naam ke order mein dikhaye!`
  },

  typescript: {
    keys: ['typescript','ts','type','interface','enum','generic','type annotation','typed','tsc'],
    en: `**TypeScript — JavaScript with Superpowers** 📘

TypeScript adds types to JavaScript — catches errors before runtime!

**Basic types:**
\`\`\`typescript
// Primitives
let name: string = "Aaryan";
let age: number = 16;
let isStudent: boolean = true;

// Arrays
let scores: number[] = [95, 87, 92];
let tags: string[] = ["html", "css", "js"];

// Function with types
function greet(name: string, age: number): string {
  return \`Hi \${name}, you are \${age}!\`;
}
\`\`\`

**Interfaces (define object shapes):**
\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // optional with ?
}

const user: User = {
  id: 1,
  name: "Aaryan",
  email: "a@b.com"
};
\`\`\`

**Union types:**
\`\`\`typescript
let id: string | number = "abc123"; // string OR number
id = 42; // also valid!
\`\`\`

**Why use TypeScript?**
• Catches bugs before you run the code
• Amazing autocomplete in VS Code
• Makes big projects manageable

**Try karo:** Convert a simple JS function to TypeScript with proper type annotations!`,
    hi: `**TypeScript — JavaScript ka Bada Bhai** 📘

TypeScript = JavaScript + types. Errors run time se pehle pakad leta hai!

**Basic types:**
\`\`\`typescript
let naam: string = "Aaryan";
let age: number = 16;
let student: boolean = true;

// Array
let scores: number[] = [95, 87, 92];

// Function
function greet(naam: string, age: number): string {
  return \`Hi \${naam}!\`;
}
\`\`\`

**Interface — object ka blueprint:**
\`\`\`typescript
interface User {
  id: number;
  naam: string;
  email: string;
  age?: number; // optional
}

const user: User = {
  id: 1,
  naam: "Aaryan",
  email: "a@b.com"
};
\`\`\`

**TypeScript kyun use karein:**
• Code likhte waqt hi error bata deta hai
• VS Code mein autocomplete bahut acha milta hai
• Bade projects mein sanity banaye rakhta hai

**Analogy bhai:** TypeScript = driving license wala system. Bina license (type) ke gadi (value) chalane nahi deta!

**Try karo:** Ek simple JS function ko TypeScript mein convert karo types ke saath!`
  },

  dataStructures: {
    keys: ['data structure','algorithm','linked list','stack','queue','tree','binary tree','hash','big o','complexity','sorting','recursion','dsa'],
    en: `**Data Structures & Algorithms** 🔣

DSA = how to organize data + how to solve problems efficiently!

**Stack (LIFO — Last In, First Out):**
\`\`\`javascript
const stack = [];
stack.push(1);    // [1]
stack.push(2);    // [1, 2]
stack.push(3);    // [1, 2, 3]
stack.pop();      // returns 3, stack = [1, 2]
\`\`\`

**Queue (FIFO — First In, First Out):**
\`\`\`javascript
const queue = [];
queue.push("A");  // ["A"]
queue.push("B");  // ["A", "B"]
queue.shift();    // returns "A", queue = ["B"]
\`\`\`

**Big O Notation (efficiency):**
| Notation | Name | Example |
|--|--|--|
| O(1) | Constant | Array access |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Loop through array |
| O(n²) | Quadratic | Nested loops |

**Recursion:**
\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;    // base case
  return n * factorial(n - 1); // recursive call
}
console.log(factorial(5)); // 120
\`\`\`

**Try karo:** Implement a stack that also tracks the minimum element in O(1) time!`,
    hi: `**Data Structures & Algorithms** 🔣

DSA = data organize karna + problems efficiently solve karna!

**Stack (LIFO — jo last aaya wo pehle jaayega):**
\`\`\`javascript
const stack = [];
stack.push(1);  // [1]
stack.push(2);  // [1, 2]
stack.pop();    // 2 nikla, [1]
\`\`\`

**Queue (FIFO — jo pehle aaya wo pehle jaayega):**
\`\`\`javascript
const queue = [];
queue.push("A"); // ["A"]
queue.push("B"); // ["A", "B"]
queue.shift();   // "A" nikla
\`\`\`

**Big O — code ki efficiency:**
• O(1) = constant — har baar same time
• O(n) = linear — data double = time double
• O(n²) = quadratic — nested loops, slow!

**Recursion:**
\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;          // base case
  return n * factorial(n - 1);   // apne aap ko call karo
}
console.log(factorial(5)); // 120
\`\`\`

**Analogy:**
• Stack = plate stack — upar wali pehle utho
• Queue = line mein khade hona — pehle aao, pehle jao

**Try karo bhai:** Stack implement karo jo minimum element bhi O(1) mein de!`
  },

  html: {
    keys: ['html','tag','element','semantic','div','span','head','body','form','input','button','link','href','src'],
    en: `**HTML — Structure of the Web** 🌐

HTML is the skeleton of every webpage!

**Basic structure:**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <h1>Hello World!</h1>
  <p>This is a paragraph.</p>
</body>
</html>
\`\`\`

**Common tags:**
\`\`\`html
<!-- Headings -->
<h1>Biggest</h1>  <h6>Smallest</h6>

<!-- Text -->
<p>Paragraph</p>
<strong>Bold</strong>  <em>Italic</em>

<!-- Links & Images -->
<a href="https://bitzy.app">Visit Bitzy</a>
<img src="logo.png" alt="Logo">

<!-- Lists -->
<ul><li>Unordered item</li></ul>
<ol><li>Ordered item</li></ol>

<!-- Forms -->
<input type="text" placeholder="Enter name">
<button type="submit">Submit</button>
\`\`\`

**Semantic HTML (use these!):**
\`\`\`html
<header>, <nav>, <main>, <section>, 
<article>, <aside>, <footer>
\`\`\`

**Try karo:** Build a basic profile card with your name, photo, and 3 hobbies using proper HTML!`,
    hi: `**HTML — Web ka Skeleton** 🌐

HTML = har webpage ki body. Iske bina kuch nahi!

**Basic structure:**
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Mera Page</title>
</head>
<body>
  <h1>Hello Duniya!</h1>
  <p>Yeh ek paragraph hai.</p>
</body>
</html>
\`\`\`

**Kaam ke tags:**
\`\`\`html
<!-- Headings -->
<h1>Sabse bada</h1>

<!-- Text -->
<p>Paragraph</p>
<strong>Bold</strong>

<!-- Links aur Images -->
<a href="https://bitzy.app">Bitzy kholo</a>
<img src="photo.png" alt="Photo">

<!-- Lists -->
<ul><li>Unordered</li></ul>
<ol><li>Ordered</li></ol>

<!-- Forms -->
<input type="text" placeholder="Naam likho">
<button>Submit</button>
\`\`\`

**Analogy bhai:** HTML = ghar ka dhanccha. CSS = painting aur decoration. JS = bijli aur AC!

**Try karo:** Ek profile card banao — apna naam, photo, aur 3 hobbies HTML mein!`
  },

  react: {
    keys: ['react','component','jsx','props','state','reactjs','vite','create react app','react router','next.js','nextjs'],
    en: `**React — Modern Web Apps** ⚛️

React lets you build UIs from reusable components!

**Your first component:**
\`\`\`jsx
// Simple component
function Greeting({ name, age }) {
  return (
    <div className="card">
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old.</p>
    </div>
  );
}

// Use it
<Greeting name="Aaryan" age={16} />
\`\`\`

**useState for interactivity:**
\`\`\`jsx
import { useState } from 'react';

function Toggle() {
  const [isOn, setIsOn] = useState(false);

  return (
    <button onClick={() => setIsOn(!isOn)}>
      {isOn ? "ON 🟢" : "OFF 🔴"}
    </button>
  );
}
\`\`\`

**Props = read-only inputs to a component**
**State = internal data that can change**

**Conditional rendering:**
\`\`\`jsx
{isLoggedIn ? <Dashboard /> : <Login />}
{items.length > 0 && <ItemList items={items} />}
\`\`\`

**List rendering:**
\`\`\`jsx
const names = ["Alice", "Bob", "Charlie"];

{names.map((name, index) => (
  <p key={index}>{name}</p>
))}
\`\`\`

**Try karo:** Build a counter component with +/- buttons and a reset button!`,
    hi: `**React — Modern Web Apps** ⚛️

React = reusable components se UI banana!

**Pehla component:**
\`\`\`jsx
function Greeting({ naam, age }) {
  return (
    <div>
      <h1>Hello, {naam}!</h1>
      <p>Tumhari age {age} hai.</p>
    </div>
  );
}

// Use karo
<Greeting naam="Aaryan" age={16} />
\`\`\`

**useState — interactive banao:**
\`\`\`jsx
import { useState } from 'react';

function Toggle() {
  const [on, setOn] = useState(false);

  return (
    <button onClick={() => setOn(!on)}>
      {on ? "ON 🟢" : "OFF 🔴"}
    </button>
  );
}
\`\`\`

**Key concepts:**
• **Props** = component ko bahar se data dena (read-only)
• **State** = component ka apna data (change ho sakta hai)
• **JSX** = HTML-jaisa syntax JavaScript mein

**Analogy bhai:**
• Component = Lego brick
• Props = brick ka color/size
• State = brick ka glow (change ho sakta hai)

**Try karo:** +/- aur reset buttons wala counter component banao!`
  },

  debugging: {
    keys: ['debug','debugging','error','bug','fix','console.log','console','breakpoint','typeof','undefined','null','nan','syntax error','type error'],
    en: `**Debugging — Find & Fix Bugs** 🐛

Debugging is a superpower — every great developer debugs well!

**Step 1 — Read the error:**
\`\`\`
TypeError: Cannot read property 'name' of undefined
          ↑ Error type    ↑ What went wrong
\`\`\`

**Common errors:**
| Error | Cause |
|--|--|
| TypeError | Wrong type used |
| ReferenceError | Variable not defined |
| SyntaxError | Wrong syntax (typo) |
| undefined | Variable exists but no value |
| null | Intentionally empty |

**Debugging tools:**
\`\`\`javascript
// 1. console.log (most used!)
console.log("value:", myVariable);

// 2. Check type
console.log(typeof myVariable); // "string", "number", etc.

// 3. Conditional check
if (!myVariable) {
  console.log("Variable is empty!");
}

// 4. Try-catch for async errors
try {
  const data = await fetchData();
} catch (error) {
  console.error("Error:", error.message);
}
\`\`\`

**Debugging mindset:**
1. Don't panic — bugs are normal!
2. Read the error message carefully
3. Check line number mentioned in error
4. Add console.logs to trace the issue
5. Google the exact error message

**Try karo:** Intentionally break your code and practice reading error messages!`,
    hi: `**Debugging — Bug Dhundho aur Thao!** 🐛

Debugging = code doctor banna. Har developer yeh karta hai!

**Step 1 — Error padho:**
\`\`\`
TypeError: Cannot read property 'name' of undefined
↑ Kya galat hua           ↑ Kyun galat hua
\`\`\`

**Common errors:**
• **TypeError** — galat type use ki
• **ReferenceError** — variable define nahi hai
• **SyntaxError** — typo ya galat syntax
• **undefined** — variable hai par value nahi

**Debugging tools:**
\`\`\`javascript
// 1. console.log (sabse zyada use hota hai!)
console.log("yahan hun:", myVariable);

// 2. Type check karo
console.log(typeof myVariable);

// 3. Conditional check
if (!myVariable) {
  console.log("Variable empty hai!");
}

// 4. Try-catch
try {
  const data = await fetchData();
} catch (error) {
  console.error("Error:", error.message);
}
\`\`\`

**Debugging mindset bhai:**
1. Ghabrao mat — bugs normal hain!
2. Error message dhyan se padho
3. Line number dekho
4. Console.log lagao trace karne ke liye
5. Exact error Google karo — Stack Overflow mein answer milega!

**Try karo:** Apna code tod ke practice karo error messages padhne ki!`
  },
  greeting: {
    keys: ['hi','hello','hey','namaste','yo','sup','good morning','good evening','kaise ho','whats up'],
    en: `Hey there! 👋 I'm **Sub AI**, your Bitzy coding mentor!\n\nAsk me about:\n• 💻 **Coding** — JavaScript, Python, React, CSS, SQL, Git, TypeScript, DSA\n• 🎮 **Bitzy** — XP, streaks, energy, badges, arena, games, leaderboard\n\nWhat do you want to learn today? 🚀`,
    hi: `Hey bhai! 👋 Main **Sub AI** hun, tumhara Bitzy coding mentor!\n\nKya puch sakte ho:\n• 💻 **Coding** — JavaScript, Python, React, CSS, SQL, Git, TypeScript, DSA\n• 🎮 **Bitzy** — XP, streaks, energy, badges, arena, games, leaderboard\n\nAaj kya seekhna hai? 🚀`
  },

  thanks: {
    keys: ['thanks','thank you','thanx','shukriya','dhanyavad','ty','thx'],
    en: `You're welcome! 😊 Keep coding, keep grinding — every line of code makes you better! 🚀\n\nAnything else I can help with?`,
    hi: `Koi baat nahi bhai! 😊 Coding karte raho, har line tumhe better banati hai! 🚀\n\nKuch aur puchna hai?`
  },

  about: {
    keys: ['what is bitzy','bitzy kya hai','about bitzy','who are you','sub ai','what can you do','help','madad'],
    en: `**About Bitzy** 🎮\n\nBitzy is a gamified platform to learn coding through:\n• 📚 Interactive courses (HTML to React)\n• ⚔️ Arena coding challenges\n• 🎲 Fun mini-games\n• 🏆 XP, streaks, badges & leaderboard\n\n**I'm Sub AI** — your built-in coding mentor. I can:\n• Explain any programming concept\n• Debug your code\n• Run mock interviews\n• Help plan projects\n\nTry asking: "explain closures" or "how does XP work"!`,
    hi: `**Bitzy ke baare mein** 🎮\n\nBitzy ek gamified coding platform hai:\n• 📚 Interactive courses (HTML se React tak)\n• ⚔️ Arena coding challenges\n• 🎲 Fun mini-games\n• 🏆 XP, streaks, badges aur leaderboard\n\n**Main Sub AI hun** — tumhara built-in coding mentor. Main:\n• Koi bhi programming concept samjha sakta hun\n• Code debug kar sakta hun\n• Mock interview le sakta hun\n• Project planning mein help karta hun\n\nTry karo: "closures explain karo" ya "XP kaise milta hai"!`
  },

  support: {
    keys: ['contact','support','help me','issue','problem with app','report bug','feedback','customer care','complaint'],
    en: `**Need help?** 🛟\n\nFor app issues, bugs, or feedback, check our **Privacy & Support** page (linked in the footer of the home page) — it has our contact email and support form.\n\nFor coding doubts, ask me directly — I'm available 24/7! 😄`,
    hi: `**Help chahiye?** 🛟\n\nApp issues, bugs ya feedback ke liye home page ke footer mein **Privacy & Support** page check karo — wahan contact email aur support form hai.\n\nCoding doubts ke liye mujhse seedha puch — main 24/7 available hun! 😄`
  },

  loops: {
    keys: ['loop','loops','for loop','while loop','do while','iterate','iteration','for...of','for...in','forEach','for each'],
    en: "**Loops in JavaScript** \ud83d\udd01\n\nLoops repeat code multiple times!\n\n**for loop:**\n```javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(i); // 0,1,2,3,4\n}\n```\n\n**while loop:**\n```javascript\nlet i = 0;\nwhile (i < 5) {\n  console.log(i);\n  i++;\n}\n```\n\n**for...of (arrays):**\n```javascript\nfor (const fruit of [\"apple\",\"banana\"]) {\n  console.log(fruit);\n}\n```\n\n**for...in (objects):**\n```javascript\nfor (const key in {a:1,b:2}) {\n  console.log(key); // \"a\", \"b\"\n}\n```\n\n**Try karo:** Print numbers 1 to 10 using a for loop!",
    hi: "**Loops in JavaScript** \ud83d\udd01\n\nLoops = code ko baar baar chalana!\n\n**for loop:**\n```javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(i); // 0,1,2,3,4\n}\n```\n\n**while loop:**\n```javascript\nlet i = 0;\nwhile (i < 5) {\n  console.log(i);\n  i++;\n}\n```\n\n**for...of (arrays ke liye):**\n```javascript\nfor (const fruit of [\"apple\",\"banana\"]) {\n  console.log(fruit);\n}\n```\n\n**Try karo bhai:** for loop se 1 se 10 tak numbers print karo!"
  },

  conditionals: {
    keys: ['if','else','if else','switch','condition','conditional','ternary','comparison','== vs ===','strict equality'],
    en: "**Conditionals in JavaScript** \ud83d\udd00\n\n**if / else:**\n```javascript\nif (age >= 18) {\n  console.log(\"Adult\");\n} else if (age >= 13) {\n  console.log(\"Teen\");\n} else {\n  console.log(\"Kid\");\n}\n```\n\n**Ternary (short if-else):**\n```javascript\nconst status = age >= 18 ? \"Adult\" : \"Minor\";\n```\n\n**switch:**\n```javascript\nswitch(day) {\n  case 1: console.log(\"Monday\"); break;\n  case 2: console.log(\"Tuesday\"); break;\n  default: console.log(\"Other\");\n}\n```\n\n**== vs ===:**\n- `==` compares value only (loose)\n- `===` compares value AND type (strict), always use this\n```javascript\n\"5\" == 5   // true (bad!)\n\"5\" === 5  // false (correct check)\n```\n\n**Try karo:** Write an if-else that checks if a number is even or odd!",
    hi: "**Conditionals in JavaScript** \ud83d\udd00\n\n**if / else:**\n```javascript\nif (age >= 18) {\n  console.log(\"Adult\");\n} else if (age >= 13) {\n  console.log(\"Teen\");\n} else {\n  console.log(\"Kid\");\n}\n```\n\n**Ternary (short if-else):**\n```javascript\nconst status = age >= 18 ? \"Adult\" : \"Minor\";\n```\n\n**== vs === bhai:**\n- `==` sirf value check karta hai (galat)\n- `===` value AND type dono check karta hai, ALWAYS use this\n```javascript\n\"5\" == 5   // true (bura)\n\"5\" === 5  // false (sahi)\n```\n\n**Try karo:** Ek if-else likho jo check kare number even ya odd hai!"
  },

  nodejs: {
    keys: ['node','nodejs','node.js','express','npm','backend','server','rest api','endpoint'],
    en: "**Node.js - Backend with JavaScript** \ud83d\udfe2\n\nNode.js lets you run JavaScript on the server!\n\n**Basic Express server:**\n```javascript\nconst express = require('express');\nconst app = express();\n\napp.get('/api/users', (req, res) => {\n  res.json({ users: ['Aaryan', 'Riya'] });\n});\n\napp.listen(3000, () => console.log('Server running!'));\n```\n\n**npm basics:**\n```bash\nnpm init -y          # create package.json\nnpm install express  # install package\nnpm run dev          # run script\n```\n\n**Key concepts:**\n- **Routes** = URL endpoints (/api/users)\n- **Middleware** = functions that run before route handler\n- **req/res** = request and response objects\n\n**Try karo:** Create an Express server with a /hello route!",
    hi: "**Node.js - JavaScript Backend** \ud83d\udfe2\n\nNode.js se JavaScript server pe chala sakte ho!\n\n**Basic Express server:**\n```javascript\nconst express = require('express');\nconst app = express();\n\napp.get('/api/users', (req, res) => {\n  res.json({ users: ['Aaryan', 'Riya'] });\n});\n\napp.listen(3000, () => console.log('Server chal raha hai!'));\n```\n\n**npm basics:**\n```bash\nnpm init -y\nnpm install express\nnpm run dev\n```\n\n**Yaad rakho:**\n- **Routes** = URL endpoints\n- **Middleware** = route se pehle chalne wala function\n- **req/res** = request aur response\n\n**Try karo:** Express server banao jisme /hello route ho!"
  },

  // ══════════════════════════════════════════════════════════
  // EXPANDED KNOWLEDGE — JavaScript deep dive
  // ══════════════════════════════════════════════════════════

  asyncAwait: {
    keys: ['async','await','async await','asynchronous','callback','promise','then catch','fetch api'],
    en: `**Async/Await in JavaScript** ⏳

Modern way to handle asynchronous code without messy callbacks.

\`\`\`javascript
async function getUser() {
  try {
    const response = await fetch('https://api.example.com/user');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Failed:', error);
  }
}
\`\`\`

**Rules:**
- \`async\` function always returns a Promise
- \`await\` pauses execution until the Promise resolves
- Always wrap \`await\` in try/catch for error handling

**Old way (Promises):**
\`\`\`javascript
fetch(url).then(res => res.json()).then(data => console.log(data)).catch(err => console.error(err));
\`\`\`

**Try karo:** Write an async function that fetches data and logs an error if it fails!`,
    hi: `**Async/Await JavaScript mein** ⏳

Asynchronous code handle karne ka modern tareeka, messy callbacks ke bina.

\`\`\`javascript
async function getUser() {
  try {
    const response = await fetch('https://api.example.com/user');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Fail ho gaya:', error);
  }
}
\`\`\`

**Rules:**
- \`async\` function hamesha Promise return karta hai
- \`await\` execution ko pause karta hai jab tak Promise resolve na ho
- \`await\` ko hamesha try/catch mein wrap karo error ke liye

**Try karo:** Ek async function likho jo data fetch kare aur error aane pe log kare!`
  },

  spreadRest: {
    keys: ['spread operator','rest operator','...','spread rest','three dots'],
    en: `**Spread & Rest Operators (...)** 📦

**Spread** — expands an array/object:
\`\`\`javascript
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1,2,3,4,5]

const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 }; // {a:1, b:2}
\`\`\`

**Rest** — collects remaining items into one variable:
\`\`\`javascript
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6

const [first, ...rest] = [1, 2, 3, 4];
// first = 1, rest = [2,3,4]
\`\`\`

**Try karo:** Merge two arrays using spread operator!`,
    hi: `**Spread & Rest Operators (...)** 📦

**Spread** — array/object ko expand karta hai:
\`\`\`javascript
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1,2,3,4,5]
\`\`\`

**Rest** — baaki items ko ek variable mein collect karta hai:
\`\`\`javascript
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6
\`\`\`

**Try karo:** Spread operator use karke do arrays merge karo!`
  },

  destructuring: {
    keys: ['destructuring','destructure','array destructuring','object destructuring'],
    en: `**Destructuring in JavaScript** 🎁

**Array destructuring:**
\`\`\`javascript
const [a, b, c] = [1, 2, 3];
console.log(a, b, c); // 1 2 3
\`\`\`

**Object destructuring:**
\`\`\`javascript
const { name, age } = { name: 'Aaryan', age: 20 };
console.log(name, age); // Aaryan 20
\`\`\`

**With default values & renaming:**
\`\`\`javascript
const { name: userName = 'Guest' } = {};
console.log(userName); // Guest
\`\`\`

**In function parameters:**
\`\`\`javascript
function greet({ name, age }) {
  console.log(\`Hi \${name}, age \${age}\`);
}
\`\`\`

**Try karo:** Destructure a user object with name, email, and age!`,
    hi: `**Destructuring JavaScript mein** 🎁

**Array destructuring:**
\`\`\`javascript
const [a, b, c] = [1, 2, 3];
\`\`\`

**Object destructuring:**
\`\`\`javascript
const { name, age } = { name: 'Aaryan', age: 20 };
\`\`\`

**Default value ke saath:**
\`\`\`javascript
const { name: userName = 'Guest' } = {};
\`\`\`

**Try karo:** Ek user object destructure karo (name, email, age)!`
  },

  arrayMethods: {
    keys: ['map filter reduce','array methods','map function','filter function','reduce function','.map(','.filter(','.reduce('],
    en: `**map, filter, reduce** — the most-used array methods 🧰

**map** — transforms every item, returns new array:
\`\`\`javascript
[1, 2, 3].map(n => n * 2); // [2, 4, 6]
\`\`\`

**filter** — keeps items that pass a test:
\`\`\`javascript
[1, 2, 3, 4].filter(n => n % 2 === 0); // [2, 4]
\`\`\`

**reduce** — combines all items into one value:
\`\`\`javascript
[1, 2, 3, 4].reduce((sum, n) => sum + n, 0); // 10
\`\`\`

**Chaining them together:**
\`\`\`javascript
const total = [1, 2, 3, 4, 5]
  .filter(n => n % 2 === 0)
  .map(n => n * 10)
  .reduce((sum, n) => sum + n, 0); // 60
\`\`\`

**Try karo:** Use filter + map to double all numbers greater than 3 in [1,2,3,4,5,6]!`,
    hi: `**map, filter, reduce** — sabse zyada use hone wale array methods 🧰

**map** — har item transform karta hai:
\`\`\`javascript
[1, 2, 3].map(n => n * 2); // [2, 4, 6]
\`\`\`

**filter** — jo test pass kare wahi rakhta hai:
\`\`\`javascript
[1, 2, 3, 4].filter(n => n % 2 === 0); // [2, 4]
\`\`\`

**reduce** — sab items ko ek value mein combine karta hai:
\`\`\`javascript
[1, 2, 3, 4].reduce((sum, n) => sum + n, 0); // 10
\`\`\`

**Try karo:** filter + map use karke [1,2,3,4,5,6] mein se 3 se bade numbers double karo!`
  },

  hoistingScope: {
    keys: ['hoisting','scope','var let const difference','block scope','function scope','temporal dead zone'],
    en: `**Hoisting & Scope** 🎈

**var vs let vs const:**
\`\`\`javascript
var x = 1;   // function-scoped, hoisted, can redeclare
let y = 2;   // block-scoped, hoisted but not initialized
const z = 3; // block-scoped, cannot reassign
\`\`\`

**Hoisting** — declarations move to the top of their scope during compile, but \`let\`/\`const\` stay in a "temporal dead zone" until the line runs:
\`\`\`javascript
console.log(a); // undefined (var is hoisted)
var a = 5;

console.log(b); // ReferenceError (TDZ)
let b = 5;
\`\`\`

**Block scope example:**
\`\`\`javascript
if (true) {
  let inside = 'only visible here';
}
console.log(inside); // Error — not accessible outside
\`\`\`

**Rule of thumb:** always use \`const\` by default, \`let\` when you need to reassign, avoid \`var\`.`,
    hi: `**Hoisting & Scope** 🎈

**var vs let vs const:**
\`\`\`javascript
var x = 1;   // function-scoped
let y = 2;   // block-scoped
const z = 3; // reassign nahi kar sakte
\`\`\`

**Hoisting** — declarations compile time pe scope ke top pe chali jaati hain:
\`\`\`javascript
console.log(a); // undefined (var hoisted)
var a = 5;

console.log(b); // Error (temporal dead zone)
let b = 5;
\`\`\`

**Rule:** hamesha \`const\` default use karo, reassign karna ho toh \`let\`, \`var\` avoid karo.`
  },

  domEvents: {
    keys: ['dom','document object model','addEventListener','dom manipulation','querySelector','event listener','click event'],
    en: `**DOM Manipulation & Events** 🖱️

**Selecting elements:**
\`\`\`javascript
const btn = document.querySelector('.my-button');
const items = document.querySelectorAll('.item');
\`\`\`

**Changing content/style:**
\`\`\`javascript
btn.textContent = 'Clicked!';
btn.style.color = 'red';
btn.classList.add('active');
\`\`\`

**Listening to events:**
\`\`\`javascript
btn.addEventListener('click', (e) => {
  console.log('Button clicked!', e.target);
});
\`\`\`

**Creating elements:**
\`\`\`javascript
const div = document.createElement('div');
div.textContent = 'New element';
document.body.appendChild(div);
\`\`\`

**Try karo:** Add a click listener that toggles a CSS class on a button!`,
    hi: `**DOM Manipulation & Events** 🖱️

**Elements select karna:**
\`\`\`javascript
const btn = document.querySelector('.my-button');
\`\`\`

**Content/style change karna:**
\`\`\`javascript
btn.textContent = 'Clicked!';
btn.classList.add('active');
\`\`\`

**Event sunna:**
\`\`\`javascript
btn.addEventListener('click', (e) => {
  console.log('Button clicked!');
});
\`\`\`

**Try karo:** Ek click listener add karo jo button pe class toggle kare!`
  },

  jsonModules: {
    keys: ['json','json.stringify','json.parse','import export','es modules','module'],
    en: `**JSON & ES Modules** 📄

**JSON (JavaScript Object Notation):**
\`\`\`javascript
const obj = { name: 'Aaryan', age: 20 };
const jsonStr = JSON.stringify(obj); // '{"name":"Aaryan","age":20}'
const backToObj = JSON.parse(jsonStr); // {name:'Aaryan', age:20}
\`\`\`

**ES Modules (import/export):**
\`\`\`javascript
// math.js
export function add(a, b) { return a + b; }
export default function multiply(a, b) { return a * b; }

// main.js
import multiply, { add } from './math.js';
\`\`\`

**Try karo:** Convert an array of objects to a JSON string and back!`,
    hi: `**JSON & ES Modules** 📄

**JSON:**
\`\`\`javascript
const obj = { name: 'Aaryan', age: 20 };
const jsonStr = JSON.stringify(obj);
const backToObj = JSON.parse(jsonStr);
\`\`\`

**ES Modules:**
\`\`\`javascript
// math.js
export function add(a, b) { return a + b; }

// main.js
import { add } from './math.js';
\`\`\`

**Try karo:** Ek objects ka array JSON string mein convert karo aur wapas parse karo!`
  },

  errorHandling: {
    keys: ['error handling','try catch','throw error','exception','finally block'],
    en: `**Error Handling in JavaScript** 🚨

\`\`\`javascript
try {
  const result = riskyOperation();
  console.log(result);
} catch (error) {
  console.error('Something went wrong:', error.message);
} finally {
  console.log('This always runs');
}
\`\`\`

**Throwing custom errors:**
\`\`\`javascript
function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}
\`\`\`

**Custom error classes:**
\`\`\`javascript
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
\`\`\`

**Try karo:** Write a function that throws an error for negative numbers!`,
    hi: `**Error Handling JavaScript mein** 🚨

\`\`\`javascript
try {
  const result = riskyOperation();
} catch (error) {
  console.error('Kuch galat hua:', error.message);
} finally {
  console.log('Yeh hamesha chalega');
}
\`\`\`

**Custom error throw karna:**
\`\`\`javascript
function divide(a, b) {
  if (b === 0) throw new Error('Zero se divide nahi kar sakte');
  return a / b;
}
\`\`\`

**Try karo:** Ek function likho jo negative number pe error throw kare!`
  },

  // ══════════════════════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════════════════════

  flexbox: {
    keys: ['flexbox','flex','display flex','justify-content','align-items','flex direction'],
    en: `**Flexbox — 1D Layout** 📐

\`\`\`css
.container {
  display: flex;
  justify-content: center;  /* horizontal alignment */
  align-items: center;      /* vertical alignment */
  flex-direction: row;      /* or column */
  gap: 16px;
}
\`\`\`

**Common values:**
- \`justify-content\`: flex-start, center, space-between, space-around
- \`align-items\`: stretch, center, flex-start, flex-end
- \`flex: 1\` on a child = grow to fill available space

**Centering anything perfectly:**
\`\`\`css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
\`\`\`

**Try karo:** Build a navbar with a logo on the left and links on the right using flexbox!`,
    hi: `**Flexbox — 1D Layout** 📐

\`\`\`css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}
\`\`\`

**Kisi bhi cheez ko perfectly center karna:**
\`\`\`css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
\`\`\`

**Try karo:** Flexbox se ek navbar banao — left mein logo, right mein links!`
  },

  cssGrid: {
    keys: ['css grid','grid layout','grid-template-columns','display grid','grid-template-areas'],
    en: `**CSS Grid — 2D Layout** 🔲

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.item {
  grid-column: span 2; /* spans 2 columns */
}
\`\`\`

**Responsive grid (auto-fit):**
\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
\`\`\`

**Grid vs Flexbox:** Grid = 2D (rows AND columns), Flexbox = 1D (row OR column). Use Grid for page layouts, Flexbox for components.

**Try karo:** Build a 3-column responsive card grid using CSS Grid!`,
    hi: `**CSS Grid — 2D Layout** 🔲

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
\`\`\`

**Responsive grid:**
\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
\`\`\`

**Grid vs Flexbox:** Grid = 2D (rows AUR columns), Flexbox = 1D (row YA column).

**Try karo:** CSS Grid se 3-column responsive card grid banao!`
  },

  boxModelPosition: {
    keys: ['box model','padding margin border','position absolute','position relative','z-index','box-sizing'],
    en: `**Box Model & Positioning** 📦

**Box model:** content → padding → border → margin

\`\`\`css
.box {
  box-sizing: border-box; /* padding+border included in width */
  width: 200px;
  padding: 16px;
  border: 2px solid #333;
  margin: 20px;
}
\`\`\`

**Positioning:**
\`\`\`css
.relative { position: relative; top: 10px; }   /* moves relative to itself */
.absolute { position: absolute; top: 0; right: 0; } /* relative to nearest positioned parent */
.fixed { position: fixed; bottom: 20px; }      /* relative to viewport, stays on scroll */
.sticky { position: sticky; top: 0; }          /* sticks after scrolling past it */
\`\`\`

**z-index** controls stacking order (higher = on top), only works on positioned elements.

**Try karo:** Create a fixed navbar that stays at the top while scrolling!`,
    hi: `**Box Model & Positioning** 📦

**Box model:** content → padding → border → margin

\`\`\`css
.box {
  box-sizing: border-box;
  padding: 16px;
  border: 2px solid #333;
  margin: 20px;
}
\`\`\`

**Positioning:**
\`\`\`css
.relative { position: relative; top: 10px; }
.absolute { position: absolute; top: 0; right: 0; }
.fixed { position: fixed; bottom: 20px; }
.sticky { position: sticky; top: 0; }
\`\`\`

**Try karo:** Ek fixed navbar banao jo scroll pe top pe hi rahe!`
  },

  responsiveDesign: {
    keys: ['responsive design','media query','media queries','mobile first','breakpoints','viewport'],
    en: `**Responsive Design** 📱💻

**Media queries** apply CSS based on screen size:
\`\`\`css
/* Mobile first approach */
.container { padding: 12px; }

@media (min-width: 768px) {
  .container { padding: 24px; }
}

@media (min-width: 1024px) {
  .container { padding: 40px; max-width: 1200px; margin: 0 auto; }
}
\`\`\`

**Viewport meta tag** (always add this in HTML):
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

**Common breakpoints:** mobile < 768px, tablet 768-1024px, desktop > 1024px

**Try karo:** Make a 3-column grid become 1-column on mobile using a media query!`,
    hi: `**Responsive Design** 📱💻

**Media queries** screen size ke hisaab se CSS apply karti hain:
\`\`\`css
.container { padding: 12px; }

@media (min-width: 768px) {
  .container { padding: 24px; }
}
\`\`\`

**Viewport tag** (HTML mein hamesha add karo):
\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

**Try karo:** Media query se 3-column grid ko mobile pe 1-column banao!`
  },

  cssAnimations: {
    keys: ['css animation','keyframes','transition','css transitions','hover effect','animate'],
    en: `**CSS Transitions & Animations** ✨

**Transition** (smooth change between states):
\`\`\`css
.button {
  background: blue;
  transition: background 0.3s ease, transform 0.2s;
}
.button:hover {
  background: darkblue;
  transform: scale(1.05);
}
\`\`\`

**Keyframe animation:**
\`\`\`css
@keyframes bounce {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-20px); }
  100% { transform: translateY(0); }
}
.ball {
  animation: bounce 1s infinite ease-in-out;
}
\`\`\`

**Try karo:** Create a button that grows slightly and changes color on hover!`,
    hi: `**CSS Transitions & Animations** ✨

**Transition:**
\`\`\`css
.button {
  transition: background 0.3s ease, transform 0.2s;
}
.button:hover {
  transform: scale(1.05);
}
\`\`\`

**Keyframe animation:**
\`\`\`css
@keyframes bounce {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-20px); }
  100% { transform: translateY(0); }
}
.ball { animation: bounce 1s infinite; }
\`\`\`

**Try karo:** Ek button banao jo hover pe grow ho aur color change kare!`
  },

  // ══════════════════════════════════════════════════════════
  // HTML
  // ══════════════════════════════════════════════════════════

  htmlForms: {
    keys: ['html forms','form tag','input types','form validation','label','submit button'],
    en: `**HTML Forms** 📝

\`\`\`html
<form action="/submit" method="POST">
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required />

  <label for="age">Age:</label>
  <input type="number" id="age" name="age" min="1" max="120" />

  <select name="country">
    <option value="in">India</option>
    <option value="us">USA</option>
  </select>

  <textarea name="message" rows="4"></textarea>

  <button type="submit">Submit</button>
</form>
\`\`\`

**Key input types:** text, email, password, number, date, checkbox, radio, file

**Try karo:** Build a signup form with name, email, and password fields!`,
    hi: `**HTML Forms** 📝

\`\`\`html
<form action="/submit" method="POST">
  <label for="email">Email:</label>
  <input type="email" id="email" name="email" required />

  <select name="country">
    <option value="in">India</option>
  </select>

  <button type="submit">Submit</button>
</form>
\`\`\`

**Input types:** text, email, password, number, date, checkbox, radio

**Try karo:** Ek signup form banao — name, email, password fields ke saath!`
  },

  semanticHtml: {
    keys: ['semantic html','header footer nav','article section','semantic tags','accessibility','aria'],
    en: `**Semantic HTML & Accessibility** ♿

Use meaningful tags instead of generic \`<div>\` everywhere:
\`\`\`html
<header>Logo + Nav</header>
<nav><a href="/">Home</a></nav>
<main>
  <article>
    <h1>Blog Post Title</h1>
    <section>Content here</section>
  </article>
  <aside>Related links</aside>
</main>
<footer>© 2026</footer>
\`\`\`

**Why it matters:**
- Better SEO (search engines understand structure)
- Better accessibility (screen readers navigate easily)
- More readable code

**Basic accessibility:**
\`\`\`html
<img src="cat.jpg" alt="A sleeping cat" />
<button aria-label="Close menu">✕</button>
\`\`\`

**Try karo:** Convert a div-only layout into semantic HTML!`,
    hi: `**Semantic HTML & Accessibility** ♿

Har jagah generic \`<div>\` ki jagah meaningful tags use karo:
\`\`\`html
<header>Logo + Nav</header>
<main>
  <article>
    <h1>Blog Title</h1>
  </article>
</main>
<footer>© 2026</footer>
\`\`\`

**Kyun important hai:** better SEO, better accessibility, readable code.

**Try karo:** Ek div-only layout ko semantic HTML mein convert karo!`
  },

  // ══════════════════════════════════════════════════════════
  // PYTHON
  // ══════════════════════════════════════════════════════════

  pythonLoopsFunctions: {
    keys: ['python loop','python function','python def','python for','python while'],
    en: `**Python Loops & Functions** 🐍

**Loops:**
\`\`\`python
for i in range(5):
    print(i)  # 0 1 2 3 4

for fruit in ['apple', 'banana']:
    print(fruit)

i = 0
while i < 5:
    print(i)
    i += 1
\`\`\`

**Functions:**
\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Aaryan"))            # Hello, Aaryan!
print(greet("Riya", "Namaste"))   # Namaste, Riya!
\`\`\`

**Try karo:** Write a function that returns the sum of a list of numbers!`,
    hi: `**Python Loops & Functions** 🐍

**Loops:**
\`\`\`python
for i in range(5):
    print(i)

i = 0
while i < 5:
    print(i)
    i += 1
\`\`\`

**Functions:**
\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"
\`\`\`

**Try karo:** Ek function likho jo list of numbers ka sum return kare!`
  },

  pythonListsDicts: {
    keys: ['python list','python dict','python dictionary','list comprehension','python tuple','python set'],
    en: `**Python Lists, Dicts & Comprehensions** 📚

**Lists:**
\`\`\`python
fruits = ["apple", "banana", "mango"]
fruits.append("grape")
print(fruits[0])       # apple
print(fruits[-1])      # grape (last item)
\`\`\`

**Dictionaries:**
\`\`\`python
user = {"name": "Aaryan", "age": 20}
print(user["name"])    # Aaryan
user["city"] = "Mumbai"
\`\`\`

**List comprehension** (Python's superpower):
\`\`\`python
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
\`\`\`

**Try karo:** Use a list comprehension to get all squares of even numbers 1-10!`,
    hi: `**Python Lists, Dicts & Comprehensions** 📚

**Lists:**
\`\`\`python
fruits = ["apple", "banana", "mango"]
fruits.append("grape")
\`\`\`

**Dictionaries:**
\`\`\`python
user = {"name": "Aaryan", "age": 20}
print(user["name"])
\`\`\`

**List comprehension:**
\`\`\`python
squares = [x**2 for x in range(10)]
\`\`\`

**Try karo:** List comprehension se 1-10 ke even numbers ke squares nikaalo!`
  },

  pythonOOP: {
    keys: ['python class','python oop','python object','self keyword','python inheritance','python __init__'],
    en: `**Python OOP (Classes)** 🏗️

\`\`\`python
class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade

    def introduce(self):
        return f"I'm {self.name}, grade {self.grade}"

s1 = Student("Aaryan", 10)
print(s1.introduce())
\`\`\`

**Inheritance:**
\`\`\`python
class Person:
    def __init__(self, name):
        self.name = name

class Student(Person):
    def __init__(self, name, school):
        super().__init__(name)
        self.school = school
\`\`\`

**Try karo:** Create a Car class with brand, model, and a honk() method!`,
    hi: `**Python OOP (Classes)** 🏗️

\`\`\`python
class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade

    def introduce(self):
        return f"I'm {self.name}, grade {self.grade}"
\`\`\`

**Inheritance:**
\`\`\`python
class Person:
    def __init__(self, name):
        self.name = name

class Student(Person):
    def __init__(self, name, school):
        super().__init__(name)
        self.school = school
\`\`\`

**Try karo:** Car class banao — brand, model, aur honk() method ke saath!`
  },

  pythonErrorFiles: {
    keys: ['python try except','python exception','python file handling','open file python','python error handling'],
    en: `**Python Error Handling & Files** 📂

**Try/except:**
\`\`\`python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")
except Exception as e:
    print(f"Something went wrong: {e}")
finally:
    print("Always runs")
\`\`\`

**File handling:**
\`\`\`python
with open("data.txt", "r") as f:
    content = f.read()

with open("output.txt", "w") as f:
    f.write("Hello, file!")
\`\`\`

Using \`with\` automatically closes the file — always prefer it.

**Try karo:** Write a try/except that catches a "list index out of range" error!`,
    hi: `**Python Error Handling & Files** 📂

**Try/except:**
\`\`\`python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Zero se divide nahi kar sakte!")
finally:
    print("Yeh hamesha chalega")
\`\`\`

**File handling:**
\`\`\`python
with open("data.txt", "r") as f:
    content = f.read()
\`\`\`

**Try karo:** Ek try/except likho jo list index error catch kare!`
  },

  // ══════════════════════════════════════════════════════════
  // REACT
  // ══════════════════════════════════════════════════════════

  useState: {
    keys: ['usestate','use state','react state','setstate hook'],
    en: `**useState Hook** ⚛️

Lets a component "remember" values between renders.

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`

**Updating based on previous state (important for correctness):**
\`\`\`jsx
setCount(prev => prev + 1); // safer than setCount(count + 1)
\`\`\`

**With objects/arrays** — always create a new copy:
\`\`\`jsx
setUser(prev => ({ ...prev, name: 'New Name' }));
\`\`\`

**Try karo:** Build a like button that toggles between liked/unliked!`,
    hi: `**useState Hook** ⚛️

Component ko renders ke beech values "yaad" rakhne deta hai.

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`

**Previous state ke basis pe update (zaroori hai):**
\`\`\`jsx
setCount(prev => prev + 1);
\`\`\`

**Try karo:** Ek like button banao jo liked/unliked toggle kare!`
  },

  useEffect: {
    keys: ['useeffect','use effect','react lifecycle','component did mount','dependency array'],
    en: `**useEffect Hook** ⚛️

Runs side effects (API calls, subscriptions, DOM updates) after render.

\`\`\`jsx
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]); // re-runs whenever userId changes

  return <div>{user?.name}</div>;
}
\`\`\`

**Dependency array rules:**
- \`[]\` → runs once on mount only
- \`[value]\` → runs when \`value\` changes
- no array → runs on EVERY render (usually a mistake!)

**Cleanup function:**
\`\`\`jsx
useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000);
  return () => clearInterval(timer); // cleanup on unmount
}, []);
\`\`\`

**Try karo:** Write a useEffect that fetches data once when the component mounts!`,
    hi: `**useEffect Hook** ⚛️

Render ke baad side effects (API calls, subscriptions) run karta hai.

\`\`\`jsx
useEffect(() => {
  fetch(\`/api/users/\${userId}\`)
    .then(res => res.json())
    .then(setUser);
}, [userId]);
\`\`\`

**Dependency array rules:**
- \`[]\` → sirf mount pe ek baar chalega
- \`[value]\` → jab \`value\` change ho tab chalega
- array na ho → HAR render pe chalega (usually galti hai!)

**Try karo:** Ek useEffect likho jo component mount hote hi data fetch kare!`
  },

  reactProps: {
    keys: ['react props','props drilling','component props','children prop'],
    en: `**Props in React** 🎒

Props pass data from parent to child components (read-only).

\`\`\`jsx
function Welcome({ name, age }) {
  return <h1>Hi {name}, you are {age}!</h1>;
}

function App() {
  return <Welcome name="Aaryan" age={20} />;
}
\`\`\`

**children prop** (for wrapping content):
\`\`\`jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card><p>This is inside the card</p></Card>
\`\`\`

**Rule:** props are read-only — a component should never modify its own props. Use state for anything that changes.

**Try karo:** Build a reusable Button component that accepts a label and onClick prop!`,
    hi: `**React Props** 🎒

Props parent se child components mein data pass karte hain (read-only).

\`\`\`jsx
function Welcome({ name, age }) {
  return <h1>Hi {name}, you are {age}!</h1>;
}

function App() {
  return <Welcome name="Aaryan" age={20} />;
}
\`\`\`

**children prop:**
\`\`\`jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}
\`\`\`

**Try karo:** Ek reusable Button component banao jo label aur onClick prop le!`
  },

  reactContext: {
    keys: ['usecontext','react context','context api','global state react','prop drilling solution'],
    en: `**useContext & Context API** 🌐

Solves "prop drilling" — sharing data across many components without passing props manually at every level.

\`\`\`jsx
// 1. Create context
const ThemeContext = createContext();

// 2. Provide it at the top
function App() {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Page />
    </ThemeContext.Provider>
  );
}

// 3. Use it anywhere deep in the tree
function Button() {
  const { theme } = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
\`\`\`

Use Context for: theme, auth/user info, language. For complex global state, consider a dedicated state library.

**Try karo:** Create a context that shares the logged-in user's name across components!`,
    hi: `**useContext & Context API** 🌐

"Prop drilling" solve karta hai — data ko har level pe manually pass kiye bina share karna.

\`\`\`jsx
const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Page />
    </ThemeContext.Provider>
  );
}

function Button() {
  const { theme } = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
\`\`\`

**Try karo:** Ek context banao jo logged-in user ka naam share kare!`
  },

  reactKeys: {
    keys: ['react keys','key prop','list rendering react','map in react'],
    en: `**Rendering Lists & the "key" prop** 🔑

\`\`\`jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
\`\`\`

**Why keys matter:** React uses \`key\` to track which items changed/added/removed, so it updates the DOM efficiently instead of re-rendering everything.

**Rules:**
- Use a stable, unique id (like \`todo.id\`) — never the array index if the list can reorder
- Keys must be unique among siblings, not globally

**Try karo:** Render a list of users with each user's id as the key!`,
    hi: `**Lists Render karna & "key" prop** 🔑

\`\`\`jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
\`\`\`

**Key kyun zaroori hai:** React track karta hai kaunsa item change/add/remove hua, isse DOM efficiently update hota hai.

**Rule:** stable unique id use karo, array index nahi (agar list reorder ho sakti hai).

**Try karo:** Users ki list render karo, har user ke id ko key banao!`
  },

  // ══════════════════════════════════════════════════════════
  // SQL
  // ══════════════════════════════════════════════════════════

  sqlJoins: {
    keys: ['sql join','inner join','left join','right join','join tables'],
    en: `**SQL Joins** 🔗

Combine rows from two or more tables based on a related column.

\`\`\`sql
-- INNER JOIN: only matching rows in both tables
SELECT users.name, orders.amount
FROM users
INNER JOIN orders ON users.id = orders.user_id;

-- LEFT JOIN: all rows from left table, matched or NULL
SELECT users.name, orders.amount
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
\`\`\`

**Quick guide:**
- \`INNER JOIN\` — only rows that match in both tables
- \`LEFT JOIN\` — all rows from the left table, even without a match
- \`RIGHT JOIN\` — all rows from the right table
- \`FULL JOIN\` — everything from both tables

**Try karo:** Write a query joining a "students" and "grades" table!`,
    hi: `**SQL Joins** 🔗

Do ya zyada tables ke rows ko related column ke basis pe combine karna.

\`\`\`sql
-- INNER JOIN: dono tables mein match hone wale rows
SELECT users.name, orders.amount
FROM users
INNER JOIN orders ON users.id = orders.user_id;

-- LEFT JOIN: left table ke saare rows
SELECT users.name, orders.amount
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
\`\`\`

**Try karo:** "students" aur "grades" table ko join karke query likho!`
  },

  sqlAggregates: {
    keys: ['sql group by','aggregate functions','sql count','sql sum','sql avg','having clause'],
    en: `**SQL Aggregate Functions & GROUP BY** 📊

\`\`\`sql
SELECT category, COUNT(*) as total, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING COUNT(*) > 5
ORDER BY total DESC;
\`\`\`

**Common aggregate functions:** \`COUNT()\`, \`SUM()\`, \`AVG()\`, \`MIN()\`, \`MAX()\`

**WHERE vs HAVING:**
- \`WHERE\` filters rows BEFORE grouping
- \`HAVING\` filters groups AFTER grouping (used with aggregate functions)

\`\`\`sql
SELECT user_id, SUM(amount) as total_spent
FROM orders
WHERE status = 'completed'
GROUP BY user_id
HAVING SUM(amount) > 1000;
\`\`\`

**Try karo:** Write a query to find the total sales per month!`,
    hi: `**SQL Aggregate Functions & GROUP BY** 📊

\`\`\`sql
SELECT category, COUNT(*) as total, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING COUNT(*) > 5;
\`\`\`

**Aggregate functions:** \`COUNT()\`, \`SUM()\`, \`AVG()\`, \`MIN()\`, \`MAX()\`

**WHERE vs HAVING:**
- \`WHERE\` — grouping se pehle rows filter karta hai
- \`HAVING\` — grouping ke baad groups filter karta hai

**Try karo:** Har month ki total sales nikaalne wali query likho!`
  },

  sqlIndexesTransactions: {
    keys: ['sql index','database index','sql transaction','primary key vs index','sql performance'],
    en: `**SQL Indexes & Transactions** ⚡

**Index** — speeds up lookups on a column (like a book's index):
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`
Trade-off: faster reads, slightly slower writes (index must update too).

**Transactions** — group multiple queries so they all succeed or all fail together:
\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- or ROLLBACK; if something went wrong
\`\`\`

This is critical for things like money transfers — you never want money to leave one account without arriving in the other.

**Try karo:** Think of another real-world scenario where you'd need a transaction!`,
    hi: `**SQL Indexes & Transactions** ⚡

**Index** — column pe lookup fast karta hai (book ke index jaisa):
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`

**Transactions** — multiple queries ko group karta hai, ya sab succeed ya sab fail:
\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
\`\`\`

**Try karo:** Ek aur real-world scenario socho jahan transaction chahiye!`
  },

  // ══════════════════════════════════════════════════════════
  // GIT
  // ══════════════════════════════════════════════════════════

  gitBranching: {
    keys: ['git branch','git checkout','create branch','git switch','feature branch'],
    en: `**Git Branching** 🌿

\`\`\`bash
git branch feature-login          # create a branch
git checkout feature-login        # switch to it
git checkout -b feature-signup    # create + switch in one step

git branch                        # list all branches
git branch -d feature-login       # delete a branch (after merging)
\`\`\`

**Typical workflow:**
\`\`\`bash
git checkout main
git pull
git checkout -b feature-new-thing
# ... make changes, commit ...
git push -u origin feature-new-thing
# open a Pull Request
\`\`\`

**Try karo:** Create a new branch called "practice" and switch to it!`,
    hi: `**Git Branching** 🌿

\`\`\`bash
git branch feature-login
git checkout feature-login
git checkout -b feature-signup    # create + switch ek sath

git branch                        # sab branches list
git branch -d feature-login       # branch delete
\`\`\`

**Typical workflow:**
\`\`\`bash
git checkout main
git pull
git checkout -b feature-new-thing
# changes karo, commit karo
git push -u origin feature-new-thing
\`\`\`

**Try karo:** "practice" naam ki branch banao aur switch karo!`
  },

  gitMergeRebase: {
    keys: ['git merge','git rebase','merge vs rebase','git conflict','merge conflict'],
    en: `**Git Merge vs Rebase** 🔀

**Merge** — combines branches, keeps full history (creates a merge commit):
\`\`\`bash
git checkout main
git merge feature-branch
\`\`\`

**Rebase** — replays your commits on top of another branch (linear history):
\`\`\`bash
git checkout feature-branch
git rebase main
\`\`\`

**Rule of thumb:** merge for shared/public branches, rebase for cleaning up your own local branch before pushing. Never rebase commits others have already pulled.

**Resolving a merge conflict:**
\`\`\`bash
# after conflict markers appear in files
# edit files to fix, then:
git add .
git commit
\`\`\`

**Try karo:** Practice creating a merge conflict on purpose and resolving it!`,
    hi: `**Git Merge vs Rebase** 🔀

**Merge** — branches combine karta hai, full history rakhta hai:
\`\`\`bash
git checkout main
git merge feature-branch
\`\`\`

**Rebase** — commits ko dusri branch ke upar replay karta hai (linear history):
\`\`\`bash
git checkout feature-branch
git rebase main
\`\`\`

**Rule:** shared branches ke liye merge, apni local branch clean karne ke liye rebase.

**Try karo:** Jaan-boojh kar merge conflict banao aur resolve karo!`
  },

  gitResetRevert: {
    keys: ['git reset','git revert','reset vs revert','git undo','git cherry-pick','gitignore'],
    en: `**Git: reset, revert, cherry-pick & .gitignore** ↩️

**reset** — moves branch pointer, can discard commits (dangerous on shared branches):
\`\`\`bash
git reset --soft HEAD~1   # undo last commit, keep changes staged
git reset --hard HEAD~1   # undo last commit, DISCARD changes
\`\`\`

**revert** — creates a NEW commit that undoes a previous one (safe for shared history):
\`\`\`bash
git revert <commit-hash>
\`\`\`

**cherry-pick** — apply one specific commit from another branch:
\`\`\`bash
git cherry-pick <commit-hash>
\`\`\`

**.gitignore** — tells git which files to never track:
\`\`\`
node_modules/
.env
dist/
\`\`\`

**Try karo:** Practice reverting a commit safely on a test branch!`,
    hi: `**Git: reset, revert, cherry-pick & .gitignore** ↩️

**reset** — branch pointer move karta hai, commits discard kar sakta hai (shared branch pe risky):
\`\`\`bash
git reset --soft HEAD~1
git reset --hard HEAD~1
\`\`\`

**revert** — ek NAYA commit banata hai jo previous ko undo kare (safe hai):
\`\`\`bash
git revert <commit-hash>
\`\`\`

**.gitignore:**
\`\`\`
node_modules/
.env
\`\`\`

**Try karo:** Test branch pe safely ek commit revert karo!`
  },

  // ══════════════════════════════════════════════════════════
  // TYPESCRIPT
  // ══════════════════════════════════════════════════════════

  tsInterfaces: {
    keys: ['typescript interface','ts interface','type vs interface','typescript types'],
    en: `**TypeScript Interfaces & Types** 📘

\`\`\`typescript
interface User {
  name: string;
  age: number;
  email?: string; // optional property
}

const user: User = { name: 'Aaryan', age: 20 };
\`\`\`

**type vs interface:**
\`\`\`typescript
type Point = { x: number; y: number };   // type alias
interface Point2 { x: number; y: number; } // interface
\`\`\`
Interfaces can be extended/merged; types are more flexible (can represent unions, primitives). For object shapes, either works — most teams prefer \`interface\` for objects, \`type\` for everything else.

**Try karo:** Write an interface for a Product with name, price, and inStock!`,
    hi: `**TypeScript Interfaces & Types** 📘

\`\`\`typescript
interface User {
  name: string;
  age: number;
  email?: string; // optional
}

const user: User = { name: 'Aaryan', age: 20 };
\`\`\`

**type vs interface:** Interface extend/merge ho sakta hai; type zyada flexible hai (unions ke liye). Objects ke liye dono chalega.

**Try karo:** Product ke liye interface likho — name, price, inStock!`
  },

  tsGenerics: {
    keys: ['typescript generics','generic type','ts generics','union types','typescript enum'],
    en: `**TypeScript Generics, Unions & Enums** 🧬

**Generics** — reusable types that work with any type:
\`\`\`typescript
function identity<T>(value: T): T {
  return value;
}
identity<string>("hello");
identity<number>(42);

interface Box<T> { content: T; }
const box: Box<string> = { content: "gift" };
\`\`\`

**Union types** — a value can be one of several types:
\`\`\`typescript
function printId(id: string | number) {
  console.log(id);
}
\`\`\`

**Enums** — named constants:
\`\`\`typescript
enum Status { Pending, Active, Completed }
const s: Status = Status.Active;
\`\`\`

**Try karo:** Write a generic function that returns the first item of any array!`,
    hi: `**TypeScript Generics, Unions & Enums** 🧬

**Generics:**
\`\`\`typescript
function identity<T>(value: T): T {
  return value;
}
\`\`\`

**Union types:**
\`\`\`typescript
function printId(id: string | number) {
  console.log(id);
}
\`\`\`

**Enums:**
\`\`\`typescript
enum Status { Pending, Active, Completed }
\`\`\`

**Try karo:** Ek generic function likho jo kisi bhi array ka first item return kare!`
  },

  // ══════════════════════════════════════════════════════════
  // DATA STRUCTURES & ALGORITHMS
  // ══════════════════════════════════════════════════════════

  bigO: {
    keys: ['big o','time complexity','space complexity','big o notation','algorithm complexity'],
    en: `**Big O Notation** ⏱️

Describes how an algorithm's runtime grows as input size grows.

**Common complexities (best to worst):**
- \`O(1)\` — constant: array index access
- \`O(log n)\` — logarithmic: binary search
- \`O(n)\` — linear: single loop through array
- \`O(n log n)\` — linearithmic: efficient sorting (merge sort)
- \`O(n²)\` — quadratic: nested loops
- \`O(2ⁿ)\` — exponential: naive recursive fibonacci

\`\`\`javascript
// O(n) - one loop
function findMax(arr) {
  let max = arr[0];
  for (const n of arr) if (n > max) max = n;
  return max;
}

// O(n²) - nested loop
function hasDuplicate(arr) {
  for (let i = 0; i < arr.length; i++)
    for (let j = i+1; j < arr.length; j++)
      if (arr[i] === arr[j]) return true;
  return false;
}
\`\`\`

**Try karo:** What's the time complexity of searching an unsorted array for a value?`,
    hi: `**Big O Notation** ⏱️

Batata hai ki algorithm ka runtime input size badhne pe kaise badhta hai.

**Common complexities:**
- \`O(1)\` — constant
- \`O(log n)\` — binary search
- \`O(n)\` — single loop
- \`O(n²)\` — nested loops

\`\`\`javascript
// O(n)
function findMax(arr) {
  let max = arr[0];
  for (const n of arr) if (n > max) max = n;
  return max;
}
\`\`\`

**Try karo:** Unsorted array mein value search karne ki time complexity kya hai?`
  },

  linkedListStackQueue: {
    keys: ['linked list','stack data structure','queue data structure','push pop','enqueue dequeue'],
    en: `**Linked List, Stack & Queue** 🔗

**Stack** (LIFO - Last In First Out):
\`\`\`javascript
const stack = [];
stack.push(1); stack.push(2);
stack.pop(); // removes 2 (last in)
\`\`\`
Used for: undo history, function call stack, browser back button.

**Queue** (FIFO - First In First Out):
\`\`\`javascript
const queue = [];
queue.push(1); queue.push(2);
queue.shift(); // removes 1 (first in)
\`\`\`
Used for: task scheduling, printer jobs, BFS traversal.

**Linked List** — nodes connected by pointers instead of indexes:
\`\`\`javascript
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}
const head = new Node(1);
head.next = new Node(2);
\`\`\`

**Try karo:** Implement a stack using push/pop and use it to reverse a string!`,
    hi: `**Linked List, Stack & Queue** 🔗

**Stack** (LIFO):
\`\`\`javascript
const stack = [];
stack.push(1); stack.push(2);
stack.pop(); // 2 remove hota hai
\`\`\`

**Queue** (FIFO):
\`\`\`javascript
const queue = [];
queue.push(1); queue.push(2);
queue.shift(); // 1 remove hota hai
\`\`\`

**Linked List:**
\`\`\`javascript
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}
\`\`\`

**Try karo:** Stack use karke ek string reverse karo!`
  },

  treesGraphs: {
    keys: ['binary tree','tree data structure','graph data structure','bfs dfs','tree traversal'],
    en: `**Trees & Graphs** 🌳

**Binary Tree node:**
\`\`\`javascript
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}
\`\`\`

**Traversal (DFS):**
\`\`\`javascript
function inorder(node) {
  if (!node) return;
  inorder(node.left);
  console.log(node.value);
  inorder(node.right);
}
\`\`\`

**BFS (level by level, uses a queue):**
\`\`\`javascript
function bfs(root) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    console.log(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}
\`\`\`

**Graph** — nodes + edges, can represent networks, maps, social connections.

**Try karo:** Write a function to find the height (max depth) of a binary tree!`,
    hi: `**Trees & Graphs** 🌳

**Binary Tree node:**
\`\`\`javascript
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}
\`\`\`

**DFS Traversal:**
\`\`\`javascript
function inorder(node) {
  if (!node) return;
  inorder(node.left);
  console.log(node.value);
  inorder(node.right);
}
\`\`\`

**BFS (queue use karke):**
\`\`\`javascript
function bfs(root) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    console.log(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}
\`\`\`

**Try karo:** Binary tree ki height nikaalne wala function likho!`
  },

  sortingSearching: {
    keys: ['sorting algorithm','bubble sort','merge sort','quick sort','binary search','searching algorithm'],
    en: `**Sorting & Searching Algorithms** 🔍

**Binary Search** — O(log n), needs sorted array:
\`\`\`javascript
function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
\`\`\`

**Bubble Sort** — O(n²), simple but slow:
\`\`\`javascript
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length - i - 1; j++)
      if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
  return arr;
}
\`\`\`

**In real code:** just use \`arr.sort()\` — but understanding how sorting works helps in interviews.

**Try karo:** Trace through binary search by hand on [1,3,5,7,9,11] looking for 7!`,
    hi: `**Sorting & Searching Algorithms** 🔍

**Binary Search** — O(log n), sorted array chahiye:
\`\`\`javascript
function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
\`\`\`

**Bubble Sort** — O(n²):
\`\`\`javascript
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length - i - 1; j++)
      if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
  return arr;
}
\`\`\`

**Try karo:** [1,3,5,7,9,11] mein 7 dhundo binary search se, haath se trace karo!`
  },

  recursion: {
    keys: ['recursion','recursive function','base case','recursive'],
    en: `**Recursion** 🔁

A function that calls itself, with a **base case** to stop infinite calls.

\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;       // base case
  return n * factorial(n - 1); // recursive case
}
factorial(5); // 120
\`\`\`

**Every recursive function needs:**
1. A base case (when to stop)
2. A way to move toward the base case

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

**Try karo:** Write a recursive function to reverse a string!`,
    hi: `**Recursion** 🔁

Function jo khud ko call karta hai, ek **base case** ke saath (rukne ke liye).

\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
factorial(5); // 120
\`\`\`

**Har recursive function ko chahiye:**
1. Base case
2. Base case ki taraf badhna

**Try karo:** Ek recursive function likho jo string reverse kare!`
  },

  hashTables: {
    keys: ['hash table','hash map','hashmap','object as hashmap'],
    en: `**Hash Tables (Maps)** 🗺️

Store key-value pairs with O(1) average lookup — super fast!

\`\`\`javascript
const map = new Map();
map.set('name', 'Aaryan');
map.get('name'); // 'Aaryan'
map.has('name'); // true

// Plain object also works as a hash map
const scores = {};
scores['aaryan'] = 95;
scores['riya'] = 88;
\`\`\`

**Classic use case — counting frequency:**
\`\`\`javascript
function countChars(str) {
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}
\`\`\`

**Try karo:** Use a hash map to find the first non-repeating character in a string!`,
    hi: `**Hash Tables (Maps)** 🗺️

Key-value pairs store karta hai, O(1) average lookup — super fast!

\`\`\`javascript
const map = new Map();
map.set('name', 'Aaryan');
map.get('name'); // 'Aaryan'
\`\`\`

**Frequency count karna:**
\`\`\`javascript
function countChars(str) {
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}
\`\`\`

**Try karo:** Hash map se string mein first non-repeating character dhundo!`
  },

  // ══════════════════════════════════════════════════════════
  // CAREER
  // ══════════════════════════════════════════════════════════

  resumeTips: {
    keys: ['resume','cv','resume tips','ats resume','how to write resume'],
    en: `**Resume Tips for Developers** 📄

**Structure:**
1. Name + contact + GitHub/portfolio link
2. Short summary (2 lines max)
3. **Projects** (most important for freshers!) — with live links
4. Skills (grouped: Languages, Frameworks, Tools)
5. Education
6. Experience (if any) — use action verbs + numbers ("Improved load time by 40%")

**ATS-friendly tips:**
- Use standard section headers (Experience, Skills, Projects)
- Avoid tables/columns/graphics — many ATS systems can't parse them
- Match keywords from the job description
- Save as PDF, keep it to 1 page for freshers

**Try karo:** Rewrite one bullet point using the format: Action verb + what you did + measurable result!`,
    hi: `**Developer Resume Tips** 📄

**Structure:**
1. Name + contact + GitHub link
2. Short summary
3. **Projects** (freshers ke liye sabse important!) — live links ke saath
4. Skills
5. Education
6. Experience (agar ho) — numbers use karo ("Load time 40% improve kiya")

**ATS-friendly tips:**
- Standard headers use karo
- Tables/graphics avoid karo
- Job description ke keywords match karo
- PDF mein save karo, 1 page rakho

**Try karo:** Ek bullet point rewrite karo — Action verb + kya kiya + result!`
  },

  portfolioTips: {
    keys: ['portfolio','portfolio website','github profile','showcase projects'],
    en: `**Building a Strong Developer Portfolio** 🎨

**What to include:**
- 3-5 best projects (quality over quantity), each with a live demo link + GitHub repo
- A short "About" section — who you are, what you build
- Clear tech stack tags on each project
- Contact info / links to LinkedIn, GitHub

**Project descriptions should answer:**
- What problem does it solve?
- What did YOU specifically build?
- What was technically challenging about it?

**GitHub profile tips:**
- Pin your best 4-6 repos
- Write a good README for each (with screenshots!)
- Keep commit history clean and meaningful

**Try karo:** Write a 2-line description for your best project, focusing on the problem it solves!`,
    hi: `**Developer Portfolio Banana** 🎨

**Kya include karo:**
- 3-5 best projects, har ek ka live demo + GitHub link
- Short "About" section
- Har project pe tech stack tags
- Contact / LinkedIn / GitHub links

**Project description mein batao:**
- Kya problem solve karta hai?
- Aapne specifically kya banaya?
- Technically kya challenging tha?

**Try karo:** Apne best project ka 2-line description likho, problem pe focus karke!`
  },

  interviewPrepTips: {
    keys: ['interview preparation','how to prepare for interview','coding interview tips','technical interview'],
    en: `**Technical Interview Preparation** 🎤

**Before the interview:**
- Practice DSA daily — arrays, strings, trees, DP (this app's Arena is great for this!)
- Prepare 2-3 project stories using the STAR method (Situation, Task, Action, Result)
- Research the company and role

**During coding rounds:**
1. Clarify the problem — ask about edge cases, constraints
2. Think out loud — explain your approach before coding
3. Start with brute force, then optimize
4. Test your solution with an example before saying "done"

**Common behavioral questions to prepare for:**
- "Tell me about a challenging bug you fixed"
- "Describe a project you're proud of"
- "How do you handle disagreements in a team?"

**Try karo:** Practice a mock interview right here in the Interview section of this app!`,
    hi: `**Technical Interview Preparation** 🎤

**Interview se pehle:**
- DSA daily practice karo (arrays, strings, trees, DP — Arena isme help karega!)
- 2-3 project stories STAR method se prepare karo
- Company aur role research karo

**Coding round mein:**
1. Problem clarify karo — edge cases puch lo
2. Zor se socho — approach explain karo code se pehle
3. Brute force se start karo, phir optimize karo
4. Example se test karo "done" bolne se pehle

**Try karo:** Is app ke Interview section mein practice karo!`
  },

};



// ── MATCH ENGINE ─────────────────────────────────────────────
function findBestMatch(query: string): { topic: string; score: number } | null {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9\s.]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  let best: { topic: string; score: number } | null = null;

  for (const [topic, data] of Object.entries(KB)) {
    let score = 0;
    for (const key of data.keys) {
      const k = ` ${key.toLowerCase()} `;
      if (q.includes(k)) {
        // Whole-word/phrase match — multi-word keys score higher (more specific)
        score += key.split(' ').length * 3;
      } else if (key.length > 3 && q.includes(key.toLowerCase())) {
        // Partial substring match (e.g. "reactjs" containing "react") — weaker signal
        score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { topic, score };
    }
  }

  return best;
}

// Finds a couple of loosely-related topics to suggest when there's no strong match
function findRelatedTopics(query: string, limit = 3): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored: { topic: string; score: number }[] = [];
  for (const [topic, data] of Object.entries(KB)) {
    let score = 0;
    for (const key of data.keys) {
      for (const w of words) {
        if (key.toLowerCase().includes(w)) score += 1;
      }
    }
    if (score > 0) scored.push({ topic, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.topic);
}

// ── FALLBACK RESPONSES ────────────────────────────────────────
const FALLBACKS = {
  en: [
    `I'm still learning to answer that one! 🙏 But here's what I can help with:\n\n**App topics:** XP, coins, energy, streaks, badges, arena, games, courses, leaderboard\n\n**Coding topics:** JavaScript, HTML, CSS, Python, React, SQL, Git, TypeScript, Data Structures, Closures, Arrays, Objects, Promises, Hooks\n\nTry asking about one of these!`,
    `Hmm, that one's a bit tricky for me right now! Try asking about specific coding concepts like "explain closures" or "what is useEffect" — or app features like "how does XP work"! 🚀`,
  ],
  hi: [
    `Yeh wala main abhi nahi jaanta bhai! 🙏 Lekin yeh sab puch sakte ho:\n\n**App ke baare mein:** XP, coins, energy, streaks, badges, arena, games, courses, leaderboard\n\n**Coding:** JavaScript, HTML, CSS, Python, React, SQL, Git, TypeScript, Data Structures, Closures, Arrays, Promises, Hooks\n\nKisi ek topic pe puch!`,
    `Yeh thoda mushkil hua bhai! Kisi specific topic pe puch — jaise "closures explain karo" ya "XP kaise milta hai" 🚀`,
  ]
};

// Human-friendly label for a topic key, e.g. "asyncAwait" → "Async/Await"
function topicLabel(topic: string): string {
  const spaced = topic.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ── CHATGPT-STYLE CONVERSATIONAL WRAPPING ──────────────────────
// Small pools of natural openers/closers, picked pseudo-randomly (seeded by
// the query so the SAME question gives a stable answer, but different
// questions feel varied instead of robotic/templated) so replies feel more
// like a natural conversation instead of a flat FAQ lookup.
const OPENERS_EN = [
  'Great question — here\'s the breakdown:',
  'Sure, let\'s dig into this:',
  'Good one. Here\'s how it works:',
  'Happy to explain — here goes:',
  'Let\'s break this down step by step:',
];
const OPENERS_HI = [
  'Badhiya sawaal — chalo samajhte hain:',
  'Bilkul, yeh dekho:',
  'Achha topic hai, step by step samjhata hun:',
  'Chalo isko breakdown karte hain:',
];
const CLOSERS_EN = [
  '\n\nWant me to go deeper on any part of this, or show a related topic?',
  '\n\nLet me know if you want a real example to practice with!',
  '\n\nFeel free to ask a follow-up if anything is unclear.',
  '',
  '',
];
const CLOSERS_HI = [
  '\n\nKisi part ko aur detail mein samajhna hai, ya related topic dekhna hai?',
  '\n\nPractice ke liye example chahiye toh bata dena!',
  '\n\nKuch unclear ho toh follow-up puch sakte ho.',
  '',
  '',
];

function seededPick<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[hash % arr.length];
}

// ── MAIN FUNCTION ─────────────────────────────────────────────
export function getSubAIResponse(query: string): SubAIResponse {
  const lang = detectLang(query);
  const worldLang = detectWorldLang(query);
  const langIntro = LANG_INTROS[worldLang];
  const match = findBestMatch(query);

  const opener = lang === 'hinglish' ? seededPick(OPENERS_HI, query) : seededPick(OPENERS_EN, query);
  const closer = lang === 'hinglish' ? seededPick(CLOSERS_HI, query) : seededPick(CLOSERS_EN, query);

  if (match && match.score >= 1) {
    const data = KB[match.topic];
    // Greeting / thanks / about already read naturally on their own — don't
    // bolt an opener/closer onto small talk, only onto real explanations.
    const isSmallTalk = ['greeting', 'thanks', 'about', 'support'].includes(match.topic);
    let text = lang === 'hinglish' ? data.hi : data.en;
    if (!isSmallTalk) text = `${opener}\n\n${text}${closer}`;
    if (langIntro) text = `${langIntro}\n\n${text}`;
    return { text, confidence: match.score };
  }

  // No confident match — try to suggest a couple of related topics instead
  // of a fully generic fallback, so the brain still feels useful.
  const related = findRelatedTopics(query);
  if (related.length > 0) {
    const labels = related.map(topicLabel).join(', ');
    let text = lang === 'hinglish'
      ? `Iska exact answer mere paas nahi hai, lekin shayad yeh topics kaam aayein: **${labels}**. In mein se kisi ek pe puch ke dekho! 🙌`
      : `I don't have an exact answer for that, but these related topics might help: **${labels}**. Try asking about one of them! 🙌`;
    if (langIntro) text = `${langIntro}\n\n${text}`;
    return { text, confidence: 0 };
  }

  const fallbacks = lang === 'hinglish' ? FALLBACKS.hi : FALLBACKS.en;
  let text = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  if (langIntro) text = `${langIntro}\n\n${text}`;
  return {
    text,
    confidence: 0,
  };
}
// ── EXTENDED KB ENTRIES (added by upgrade) ────────────────────

// Already defined above; append new topics below if needed.
// The KB now covers 65+ topics across: app features (XP, energy,
// streak, coins, badges, courses, arena, games, leaderboard),
// JavaScript (variables, functions, closures, loops, async/await,
// spread/rest, destructuring, array methods, hoisting/scope, DOM,
// JSON/modules, error handling), CSS (flexbox, grid, box model,
// responsive design, animations), HTML (forms, semantic tags),
// Python (loops/functions, lists/dicts, OOP, files/errors), React
// (hooks, props, context, keys), SQL (joins, aggregates, indexes/
// transactions), Git (branching, merge/rebase, reset/revert),
// TypeScript (interfaces, generics), Data Structures & Algorithms
// (Big O, linked list/stack/queue, trees/graphs, sorting/searching,
// recursion, hash tables), and career advice (resume, portfolio,
// interview prep).

// Export KB size for debug
export const KB_SIZE = Object.keys(KB).length;