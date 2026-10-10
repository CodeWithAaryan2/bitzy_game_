// Code Order Game - arrange shuffled code lines into correct order
export interface CodeOrderPuzzle {
  id: string;
  title: string;
  language: string;
  lines: string[]; // correct order
  explanation: string;
}

export const codeOrderPuzzles: CodeOrderPuzzle[] = [
  // JavaScript
  {
    id: 'co1', title: 'Sum two numbers', language: 'javascript',
    lines: [
      'function add(a, b) {',
      '  return a + b;',
      '}',
      'console.log(add(2, 3));',
    ],
    explanation: 'Define the function, return the sum, close the body, then call it.',
  },
  {
    id: 'co2', title: 'Loop through an array', language: 'javascript',
    lines: [
      'const fruits = ["apple", "banana"];',
      'for (let i = 0; i < fruits.length; i++) {',
      '  console.log(fruits[i]);',
      '}',
    ],
    explanation: 'Declare the array, start the loop, log each item, then close the loop.',
  },
  {
    id: 'co3', title: 'Fetch and use data', language: 'javascript',
    lines: [
      'fetch(url)',
      '  .then(res => res.json())',
      '  .then(data => console.log(data))',
      '  .catch(err => console.error(err));',
    ],
    explanation: 'Fetch the URL, parse JSON, use the data, then handle errors.',
  },
  {
    id: 'co4', title: 'Array map transform', language: 'javascript',
    lines: [
      'const nums = [1, 2, 3];',
      'const doubled = nums.map(n => n * 2);',
      'console.log(doubled);',
    ],
    explanation: 'Create the array, map it to a new transformed array, then log it.',
  },

  // Python
  {
    id: 'co5', title: 'Check even or odd', language: 'python',
    lines: [
      'def check(n):',
      '    if n % 2 == 0:',
      '        return "even"',
      '    return "odd"',
      'print(check(7))',
    ],
    explanation: 'Define the function, check divisibility, return the result, then call it.',
  },
  {
    id: 'co6', title: 'Loop with range', language: 'python',
    lines: [
      'total = 0',
      'for i in range(5):',
      '    total += i',
      'print(total)',
    ],
    explanation: 'Initialize total, loop through range(5), accumulate, then print.',
  },
  {
    id: 'co7', title: 'List comprehension', language: 'python',
    lines: [
      'numbers = [1, 2, 3, 4]',
      'squares = [n ** 2 for n in numbers]',
      'print(squares)',
    ],
    explanation: 'Create the list, build squares with a comprehension, then print.',
  },

  // HTML
  {
    id: 'co8', title: 'Simple HTML page', language: 'html',
    lines: [
      '<!DOCTYPE html>',
      '<html>',
      '  <head><title>Bitzy</title></head>',
      '  <body><h1>Hello!</h1></body>',
      '</html>',
    ],
    explanation: 'Declare doctype, open html, add head, add body, then close html.',
  },
  {
    id: 'co9', title: 'Form with input', language: 'html',
    lines: [
      '<form>',
      '  <label for="name">Name:</label>',
      '  <input type="text" id="name">',
      '  <button type="submit">Submit</button>',
      '</form>',
    ],
    explanation: 'Open the form, add a label, then an input, then a submit button, then close the form.',
  },

  // CSS
  {
    id: 'co10', title: 'Flexbox centering', language: 'css',
    lines: [
      '.container {',
      '  display: flex;',
      '  justify-content: center;',
      '  align-items: center;',
      '}',
    ],
    explanation: 'Open the rule, set display to flex, center horizontally, then vertically, then close.',
  },
  {
    id: 'co11', title: 'Hover effect', language: 'css',
    lines: [
      '.button {',
      '  background: blue;',
      '}',
      '.button:hover {',
      '  background: darkblue;',
      '}',
    ],
    explanation: 'Set the default background, close the rule, then define the hover state with a darker color.',
  },

  // React
  {
    id: 'co12', title: 'useState counter', language: 'jsx',
    lines: [
      'function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  return (',
      '    <button onClick={() => setCount(count + 1)}>{count}</button>',
      '  );',
      '}',
    ],
    explanation: 'Define the component, set up state, return JSX, render a button that updates state, close everything.',
  },
  {
    id: 'co13', title: 'useEffect fetch', language: 'jsx',
    lines: [
      'function Profile() {',
      '  const [data, setData] = useState(null);',
      '  useEffect(() => {',
      '    fetch("/api/user").then(r => r.json()).then(setData);',
      '  }, []);',
      '  return <div>{data?.name}</div>;',
      '}',
    ],
    explanation: 'Define the component, set up state, run an effect once on mount to fetch data, then render it.',
  },

  // C++
  {
    id: 'co14', title: 'Print Hello World', language: 'cpp',
    lines: [
      '#include <iostream>',
      'using namespace std;',
      'int main() {',
      '    cout << "Hello, World!";',
      '    return 0;',
      '}',
    ],
    explanation: 'Include iostream, use the std namespace, define main, print, return success.',
  },
  {
    id: 'co15', title: 'Loop and sum', language: 'cpp',
    lines: [
      'int total = 0;',
      'for (int i = 0; i < 5; i++) {',
      '    total += i;',
      '}',
      'cout << total;',
    ],
    explanation: 'Initialize total, loop 5 times accumulating, close the loop, then print the total.',
  },
];

export function getCodeOrderPuzzles(topic: string): CodeOrderPuzzle[] {
  if (topic === 'mixed') return codeOrderPuzzles.slice(0, 6);
  const langMap: Record<string, string[]> = {
    html: ['html'],
    css: ['css'],
    javascript: ['javascript'],
    python: ['python'],
    react: ['jsx'],
    cpp: ['cpp'],
  };
  const langs = langMap[topic] || ['javascript'];
  const matched = codeOrderPuzzles.filter(p => langs.includes(p.language));
  return matched.length > 0 ? matched : codeOrderPuzzles.slice(0, 6);
}
