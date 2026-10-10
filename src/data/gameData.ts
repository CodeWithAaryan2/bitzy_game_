import type { QuizQuestion } from '@/components/games/QuizGame';

export const htmlQuizQuestions: QuizQuestion[] = [
  {
    id: 'hq1',
    question: 'What does HTML stand for?',
    options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Mark Language', 'Home Tool Markup Language'],
    correctIndex: 0,
    explanation: 'HTML = HyperText Markup Language. It describes the structure of web pages.',
    difficulty: 'easy',
  },
  {
    id: 'hq2',
    question: 'Which tag is used for the largest heading?',
    options: ['<head>', '<h6>', '<h1>', '<heading>'],
    correctIndex: 2,
    explanation: '<h1> is the largest heading. Headings go from <h1> (biggest) to <h6> (smallest).',
    difficulty: 'easy',
  },
  {
    id: 'hq3',
    question: 'What is the correct HTML element for inserting a line break?',
    options: ['<break>', '<lb>', '<br>', '<newline>'],
    correctIndex: 2,
    explanation: '<br> creates a line break. It is a self-closing tag.',
    difficulty: 'easy',
  },
  {
    id: 'hq4',
    question: 'Which attribute specifies an alternate text for an image?',
    options: ['title', 'alt', 'src', 'desc'],
    correctIndex: 1,
    explanation: 'The alt attribute provides alternative text for accessibility and when images fail to load.',
    difficulty: 'medium',
  },
  {
    id: 'hq5',
    question: 'What is the purpose of the <meta charset="UTF-8"> tag?',
    options: ['Set page title', 'Link CSS file', 'Define character encoding', 'Add keywords'],
    correctIndex: 2,
    explanation: 'charset="UTF-8" tells the browser to use UTF-8 character encoding for proper text display.',
    difficulty: 'medium',
  },
];

export const cssQuizQuestions: QuizQuestion[] = [
  {
    id: 'cq1',
    question: 'What does CSS stand for?',
    options: ['Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets'],
    correctIndex: 2,
    explanation: 'CSS = Cascading Style Sheets. It controls the visual presentation of HTML.',
    difficulty: 'easy',
  },
  {
    id: 'cq2',
    question: 'Which property changes the text color?',
    options: ['text-color', 'font-color', 'color', 'text-style'],
    correctIndex: 2,
    explanation: 'The color property sets text color. Example: color: red;',
    difficulty: 'easy',
  },
  {
    id: 'cq3',
    question: 'What is the default value of position property?',
    options: ['relative', 'absolute', 'fixed', 'static'],
    correctIndex: 3,
    explanation: 'position: static is the default. Elements flow in normal document order.',
    difficulty: 'medium',
  },
  {
    id: 'cq4',
    question: 'Which selector has the highest specificity?',
    options: ['.class', '#id', 'element', '*'],
    correctIndex: 1,
    explanation: 'ID selectors (#id) have the highest specificity among these options.',
    difficulty: 'medium',
  },
  {
    id: 'cq5',
    question: 'What does display: flex do?',
    options: ['Hides the element', 'Creates a flex container', 'Makes element inline', 'Floats the element'],
    correctIndex: 1,
    explanation: 'display: flex turns an element into a flex container for one-dimensional layout.',
    difficulty: 'easy',
  },
];

export const jsQuizQuestions: QuizQuestion[] = [
  {
    id: 'jq1',
    question: 'What is the output of typeof []?',
    options: ['array', 'object', 'undefined', 'list'],
    correctIndex: 1,
    explanation: 'In JavaScript, arrays are technically objects. Use Array.isArray() to check.',
    difficulty: 'medium',
  },
  {
    id: 'jq2',
    question: 'Which keyword declares a constant?',
    options: ['var', 'let', 'const', 'final'],
    correctIndex: 2,
    explanation: 'const declares a constant that cannot be reassigned (though objects can be mutated).',
    difficulty: 'easy',
  },
  {
    id: 'jq3',
    question: 'What does [1, 2, 3].map(x => x * 2) return?',
    options: ['[1, 4, 9]', '[2, 4, 6]', '[1, 2, 3]', 'undefined'],
    correctIndex: 1,
    explanation: 'map transforms each element: 1*2=2, 2*2=4, 3*2=6, so [2, 4, 6].',
    difficulty: 'easy',
  },
  {
    id: 'jq4',
    question: 'What is the result of "5" + 3?',
    options: ['8', '"53"', 'NaN', 'Error'],
    correctIndex: 1,
    explanation: 'The + operator with a string causes concatenation: "5" + 3 = "53".',
    difficulty: 'medium',
  },
  {
    id: 'jq5',
    question: 'What is a closure?',
    options: ['A function bundled with its lexical scope', 'A way to close the browser', 'An error handler', 'A type of loop'],
    correctIndex: 0,
    explanation: 'A closure is a function that remembers and accesses its outer scope even after the outer function returns.',
    difficulty: 'hard',
  },
];

// Code battle challenges
export const battleChallenges = [
  {
    id: 'bc1',
    title: 'Sum Two Numbers',
    description: 'Write a function that takes two numbers and returns their sum.',
    starterCode: 'function sum(a, b) {\n  // Your code here\n  \n}',
    testCases: [
      { input: 'sum(2, 3)', expected: '5' },
      { input: 'sum(-1, 1)', expected: '0' },
    ],
    hints: ['Use the + operator', 'Return the result of a + b'],
  },
  {
    id: 'bc2',
    title: 'Find Maximum',
    description: 'Write a function that returns the larger of two numbers.',
    starterCode: 'function max(a, b) {\n  // Your code here\n  \n}',
    testCases: [
      { input: 'max(5, 3)', expected: '5' },
      { input: 'max(-1, -5)', expected: '-1' },
    ],
    hints: ['Use an if statement or Math.max()', 'Compare a and b'],
  },
  {
    id: 'bc3',
    title: 'Reverse String',
    description: 'Write a function that reverses a string.',
    starterCode: 'function reverse(str) {\n  // Your code here\n  \n}',
    testCases: [
      { input: 'reverse("hello")', expected: '"olleh"' },
      { input: 'reverse("abc")', expected: '"cba"' },
    ],
    hints: ['Split the string into array', 'Use .reverse() and .join()'],
  },
];

// Speed typing snippets
export const typingSnippets = [
  {
    code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}',
    language: 'javascript',
    description: 'Greeting function with template literal',
  },
  {
    code: 'const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);',
    language: 'javascript',
    description: 'Array map to double values',
  },
  {
    code: '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}',
    language: 'css',
    description: 'Flexbox centering pattern',
  },
  {
    code: '<div class="card">\n  <h2>Title</h2>\n  <p>Description here</p>\n</div>',
    language: 'html',
    description: 'Simple card component',
  },
  {
    code: 'for (let i = 0; i < arr.length; i++) {\n  console.log(arr[i]);\n}',
    language: 'javascript',
    description: 'Loop through array with for',
  },
];

// Bug hunt snippets
export const bugSnippets = [
  {
    id: 'bh1',
    buggyCode: 'function sum(a, b) {\n  return a + b\n}\n\nconsole.log(sum(2, 3))',
    fixedCode: 'function sum(a, b) {\n  return a + b;\n}\n\nconsole.log(sum(2, 3));',
    language: 'javascript',
    description: 'Find the missing semicolons!',
    bugs: [
      { line: 2, hint: 'Statements need to end properly', explanation: 'Missing semicolon at end of return statement' },
      { line: 5, hint: 'Last line too', explanation: 'Missing semicolon after console.log' },
    ],
    points: 50,
  },
  {
    id: 'bh2',
    buggyCode: 'if (x = 5) {\n  console.log("x is 5")\n}',
    fixedCode: 'if (x === 5) {\n  console.log("x is 5");\n}',
    language: 'javascript',
    description: 'There is a common comparison bug here!',
    bugs: [
      { line: 1, hint: 'Assignment vs comparison', explanation: 'Using = (assignment) instead of === (strict equality). This always assigns 5 to x and evaluates to true.' },
      { line: 2, hint: 'End of statement', explanation: 'Missing semicolon after console.log' },
    ],
    points: 75,
  },
  {
    id: 'bh3',
    buggyCode: 'const numbers = [1, 2, 3]\nnumbers.push(4)\nconsole.log(numbers.length)',
    fixedCode: 'const numbers = [1, 2, 3];\nnumbers.push(4);\nconsole.log(numbers.length);',
    language: 'javascript',
    description: 'Something is missing on every line!',
    bugs: [
      { line: 1, hint: 'End the declaration', explanation: 'Missing semicolon after array declaration' },
      { line: 2, hint: 'End the statement', explanation: 'Missing semicolon after push()' },
      { line: 3, hint: 'End the log', explanation: 'Missing semicolon after console.log' },
    ],
    points: 100,
  },
  {
    id: 'bh4',
    buggyCode: '<div class="card">\n  <h1>Title<h1>\n  <p>Text</p>\n</div>',
    fixedCode: '<div class="card">\n  <h1>Title</h1>\n  <p>Text</p>\n</div>',
    language: 'html',
    description: 'A tag is not closed correctly!',
    bugs: [
      { line: 2, hint: 'Closing tags need a slash', explanation: 'The <h1> should be closed with </h1>, not another <h1>' },
    ],
    points: 50,
  },
  {
    id: 'bh5',
    buggyCode: '.card {\n  color: red\n  font-size: 16px;\n}',
    fixedCode: '.card {\n  color: red;\n  font-size: 16px;\n}',
    language: 'css',
    description: 'A CSS declaration is missing something!',
    bugs: [
      { line: 2, hint: 'Every declaration needs this', explanation: 'Missing semicolon after color: red, which breaks the next declaration' },
    ],
    points: 50,
  },
  {
    id: 'bh6',
    buggyCode: 'def greet(name)\n    return "Hello " + name\n\nprint(greet("Bitzy"))',
    fixedCode: 'def greet(name):\n    return "Hello " + name\n\nprint(greet("Bitzy"))',
    language: 'python',
    description: 'A function definition is missing something!',
    bugs: [
      { line: 1, hint: 'Function headers need this', explanation: 'Missing colon (:) at the end of the def line' },
    ],
    points: 50,
  },
  {
    id: 'bh7',
    buggyCode: 'function Welcome() {\n  return (\n    <h1>Hello</h1>\n    <p>Welcome to Bitzy</p>\n  )\n}',
    fixedCode: 'function Welcome() {\n  return (\n    <>\n      <h1>Hello</h1>\n      <p>Welcome to Bitzy</p>\n    </>\n  )\n}',
    language: 'jsx',
    description: 'React components can only return one element!',
    bugs: [
      { line: 3, hint: 'Multiple elements need a wrapper', explanation: 'JSX must return a single root element - wrap the two elements in a fragment <>...</>' },
    ],
    points: 75,
  },
  {
    id: 'bh8',
    buggyCode: '#include <iostream>\nusing namespace std\nint main() {\n  cout << "Hi";\n}',
    fixedCode: '#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hi";\n}',
    language: 'cpp',
    description: 'A using directive is missing something!',
    bugs: [
      { line: 2, hint: 'C++ statements need this', explanation: 'Missing semicolon after using namespace std' },
    ],
    points: 50,
  },
];

// Get bug hunt snippets filtered by topic
export function getBugSnippets(topic: string) {
  if (topic === 'mixed') return bugSnippets.slice(0, 6);
  const langMap: Record<string, string[]> = {
    html: ['html'],
    css: ['css'],
    javascript: ['javascript'],
    python: ['python'],
    react: ['jsx'],
    cpp: ['cpp'],
  };
  const langs = langMap[topic] || ['javascript'];
  const matched = bugSnippets.filter(s => langs.includes(s.language));
  return matched.length > 0 ? matched : bugSnippets.slice(0, 6);
}
export function getQuizQuestions(topic: string): QuizQuestion[] {
  switch (topic) {
    case 'html': return htmlQuizQuestions;
    case 'css': return cssQuizQuestions;
    case 'javascript': return jsQuizQuestions;
    default: return [...htmlQuizQuestions, ...cssQuizQuestions].slice(0, 5);
  }
}
