import type { QuizQuestion } from '@/components/games/QuizGame';

// Memory Match cards - programming concepts
export const memoryCards = [
  { id: 'mm1', term: 'Variable', definition: 'A named container for storing data values', topic: 'javascript' },
  { id: 'mm2', term: 'Function', definition: 'A reusable block of code that performs a task', topic: 'javascript' },
  { id: 'mm3', term: 'Array', definition: 'An ordered collection of items stored together', topic: 'javascript' },
  { id: 'mm4', term: 'Loop', definition: 'Code that repeats until a condition is met', topic: 'javascript' },
  { id: 'mm5', term: 'Boolean', definition: 'A data type with only true or false values', topic: 'javascript' },
  { id: 'mm6', term: 'String', definition: 'A sequence of characters representing text', topic: 'javascript' },
  { id: 'mm7', term: 'API', definition: 'Interface that allows different software to communicate', topic: 'javascript' },
  { id: 'mm8', term: 'DOM', definition: 'Document Object Model - tree structure of HTML', topic: 'html' },
  { id: 'mm9', term: 'Git', definition: 'Version control system for tracking code changes', topic: 'javascript' },
  { id: 'mm10', term: 'SQL', definition: 'Language for managing and querying databases', topic: 'javascript' },
  { id: 'mm11', term: 'CSS', definition: 'Language for styling and laying out web pages', topic: 'css' },
  { id: 'mm12', term: 'HTTP', definition: 'Protocol for transferring data over the web', topic: 'javascript' },

  // HTML
  { id: 'mm13', term: '<div>', definition: 'Generic block-level container element', topic: 'html' },
  { id: 'mm14', term: '<a>', definition: 'Anchor tag used to create hyperlinks', topic: 'html' },
  { id: 'mm15', term: '<img>', definition: 'Embeds an image into the page', topic: 'html' },
  { id: 'mm16', term: 'Semantic HTML', definition: 'Tags that clearly describe their meaning, like <header> and <footer>', topic: 'html' },
  { id: 'mm17', term: 'Attribute', definition: 'Extra information added to an HTML tag, like href or src', topic: 'html' },
  { id: 'mm18', term: '<form>', definition: 'Container for collecting user input', topic: 'html' },
  { id: 'mm19', term: 'Viewport', definition: 'Meta tag that controls layout on mobile browsers', topic: 'html' },
  { id: 'mm20', term: '<table>', definition: 'Element used to display tabular data', topic: 'html' },

  // CSS
  { id: 'mm21', term: 'Flexbox', definition: 'A CSS layout model for arranging items in a row or column', topic: 'css' },
  { id: 'mm22', term: 'Grid', definition: 'A CSS layout system for two-dimensional layouts', topic: 'css' },
  { id: 'mm23', term: 'Selector', definition: 'A pattern used to target HTML elements for styling', topic: 'css' },
  { id: 'mm24', term: 'Box Model', definition: 'Describes content, padding, border, and margin of an element', topic: 'css' },
  { id: 'mm25', term: 'Media Query', definition: 'CSS rule that applies styles based on screen size', topic: 'css' },
  { id: 'mm26', term: 'z-index', definition: 'Controls the stacking order of overlapping elements', topic: 'css' },
  { id: 'mm27', term: 'Pseudo-class', definition: 'Special state of an element, like :hover or :focus', topic: 'css' },
  { id: 'mm28', term: 'Specificity', definition: 'Rules that determine which CSS style wins when several conflict', topic: 'css' },

  // Python
  { id: 'mm29', term: 'List', definition: 'A mutable, ordered collection of items in Python', topic: 'python' },
  { id: 'mm30', term: 'Dictionary', definition: 'A collection of key-value pairs in Python', topic: 'python' },
  { id: 'mm31', term: 'Indentation', definition: 'Whitespace used in Python to define code blocks', topic: 'python' },
  { id: 'mm32', term: 'Lambda', definition: 'A small anonymous function in Python', topic: 'python' },
  { id: 'mm33', term: 'Tuple', definition: 'An ordered, immutable collection of items in Python', topic: 'python' },
  { id: 'mm34', term: 'self', definition: 'Refers to the current instance of a class in Python', topic: 'python' },
  { id: 'mm35', term: 'Module', definition: 'A file containing Python code that can be imported', topic: 'python' },
  { id: 'mm36', term: 'Decorator', definition: 'A function that modifies the behavior of another function', topic: 'python' },

  // React
  { id: 'mm37', term: 'useState', definition: 'React hook for adding state to a function component', topic: 'react' },
  { id: 'mm38', term: 'useEffect', definition: 'React hook for running side effects like data fetching', topic: 'react' },
  { id: 'mm39', term: 'Props', definition: 'Read-only data passed from a parent component to a child', topic: 'react' },
  { id: 'mm40', term: 'JSX', definition: 'A syntax extension that lets you write HTML-like code in JavaScript', topic: 'react' },
  { id: 'mm41', term: 'Virtual DOM', definition: 'A lightweight copy of the DOM React uses to optimize updates', topic: 'react' },
  { id: 'mm42', term: 'Component', definition: 'A reusable, self-contained piece of UI in React', topic: 'react' },
  { id: 'mm43', term: 'Key Prop', definition: 'A special attribute that helps React identify items in a list', topic: 'react' },
  { id: 'mm44', term: 'State', definition: 'Data that a component manages and that can change over time', topic: 'react' },

  // C++
  { id: 'mm45', term: 'Pointer', definition: 'A variable that stores the memory address of another variable', topic: 'cpp' },
  { id: 'mm46', term: 'Class', definition: 'A blueprint for creating objects with properties and methods', topic: 'cpp' },
  { id: 'mm47', term: 'STL', definition: 'Standard Template Library - containers, algorithms, and iterators', topic: 'cpp' },
  { id: 'mm48', term: 'Reference', definition: 'An alias for an existing variable in C++', topic: 'cpp' },
  { id: 'mm49', term: 'Constructor', definition: 'A special method called automatically when an object is created', topic: 'cpp' },
  { id: 'mm50', term: 'Header File', definition: 'A file containing declarations shared across source files', topic: 'cpp' },
  { id: 'mm51', term: 'Inheritance', definition: 'Mechanism where one class derives properties from another', topic: 'cpp' },
  { id: 'mm52', term: 'Pass by Reference', definition: 'Passing a variable so the function can modify the original', topic: 'cpp' },
];

// Get memory cards filtered by topic (falls back to a mixed set if too few)
export function getMemoryCards(topic: string) {
  if (topic === 'mixed') {
    // A balanced mix across all topics
    const topics = ['html', 'css', 'javascript', 'python', 'react', 'cpp'];
    const mixed = topics.flatMap(t => memoryCards.filter(c => c.topic === t).slice(0, 2));
    return mixed.slice(0, 8);
  }
  const matched = memoryCards.filter(c => c.topic === topic);
  return matched.length >= 6 ? matched.slice(0, 8) : memoryCards.slice(0, 8);
}

// Code Prediction questions
export const predictionQuestions = [
  {
    id: 'cp1', code: 'let x = 5;\nlet y = "5";\nconsole.log(x + y);', language: 'javascript',
    options: ['10', '"55"', '55', 'NaN'], correctIndex: 1,
    explanation: 'When adding a number and string, JS converts the number to string: "5" + "5" = "55"',
  },
  {
    id: 'cp2', code: 'const arr = [1, 2, 3];\nconst result = arr.map(x => x * 2);\nconsole.log(result);', language: 'javascript',
    options: ['[1, 2, 3]', '[2, 4, 6]', '[1, 4, 9]', 'undefined'], correctIndex: 1,
    explanation: 'map() creates a new array by applying a function to each element: [1*2, 2*2, 3*2] = [2, 4, 6]',
  },
  {
    id: 'cp3', code: 'let count = 0;\nfor (let i = 0; i < 5; i++) {\n  count += i;\n}\nconsole.log(count);', language: 'javascript',
    options: ['5', '10', '15', '0'], correctIndex: 1,
    explanation: '0+1+2+3+4 = 10 - the loop adds each value of i to count',
  },
  {
    id: 'cp4', code: 'const obj = { a: 1, b: 2 };\nconst { a, b } = obj;\nconsole.log(a + b);', language: 'javascript',
    options: ['12', '3', 'undefined', '{a:1, b:2}'], correctIndex: 1,
    explanation: 'Destructuring extracts a=1 and b=2, so 1+2 = 3',
  },
  {
    id: 'cp5', code: 'console.log(typeof []);', language: 'javascript',
    options: ['"array"', '"object"', '"list"', '"undefined"'], correctIndex: 1,
    explanation: 'In JavaScript, arrays are technically objects. Use Array.isArray() to check for arrays.',
  },
  {
    id: 'cp6', code: 'def f(n):\n    if n <= 1:\n        return n\n    return f(n-1) + f(n-2)\nprint(f(6))', language: 'python',
    options: ['6', '8', '13', '21'], correctIndex: 1,
    explanation: 'Fibonacci sequence: 0,1,1,2,3,5,8 - f(6) returns 8',
  },
  {
    id: 'cp7', code: 'x = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))', language: 'python',
    options: ['3', '4', 'Error', 'None'], correctIndex: 1,
    explanation: 'y is a reference to the same list as x, so appending to y also changes x. len([1,2,3,4]) = 4',
  },
  {
    id: 'cp8', code: 'nums = [1, 2, 3, 4, 5]\nprint(nums[1:4])', language: 'python',
    options: ['[1, 2, 3]', '[2, 3, 4]', '[2, 3, 4, 5]', '[1, 2, 3, 4]'], correctIndex: 1,
    explanation: 'Slice [1:4] includes indices 1, 2, 3 (not 4), giving [2, 3, 4]',
  },

  // HTML
  {
    id: 'cp10', code: '<input type="text" required>\n<!-- form submitted empty -->', language: 'html',
    options: ['Form submits normally', 'Browser shows a validation error', 'Input is hidden', 'Nothing happens ever'], correctIndex: 1,
    explanation: 'The required attribute tells the browser to block submission and show a validation message if the field is empty.',
  },
  {
    id: 'cp11', code: '<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>', language: 'html',
    options: ['Numbered list', 'Bulleted list', 'Table rows', 'Nothing renders'], correctIndex: 1,
    explanation: '<ul> creates an unordered (bulleted) list; <ol> would create a numbered list.',
  },

  // CSS
  {
    id: 'cp12', code: '.box {\n  display: flex;\n  justify-content: center;\n}', language: 'css',
    options: ['Items align left', 'Items center horizontally', 'Items stack vertically by default', 'Nothing changes'], correctIndex: 1,
    explanation: 'justify-content: center centers flex items along the main axis (horizontal by default).',
  },
  {
    id: 'cp13', code: 'p {\n  color: red;\n}\np.special {\n  color: blue;\n}', language: 'css',
    options: ['All <p> are red', 'p.special is red', 'p.special is blue', 'Error'], correctIndex: 2,
    explanation: 'A class selector (.special) is more specific than a type selector (p), so it wins - text is blue.',
  },

  // React
  {
    id: 'cp14', code: 'const [count, setCount] = useState(0);\nsetCount(count + 1);\nsetCount(count + 1);\nconsole.log(count);', language: 'jsx',
    options: ['2', '0', '1', 'undefined'], correctIndex: 1,
    explanation: 'State updates do not happen immediately - `count` still holds its old value (0) in this render.',
  },
  {
    id: 'cp15', code: 'function Greet({ name }) {\n  return <h1>Hello {name}</h1>;\n}\n<Greet name="Bitzy" />', language: 'jsx',
    options: ['Hello {name}', 'Hello Bitzy', 'Error', 'Hello undefined'], correctIndex: 1,
    explanation: 'JSX curly braces interpolate the prop value, so it renders "Hello Bitzy".',
  },

  // C++
  {
    id: 'cp16', code: 'int x = 5;\nint* p = &x;\n*p = 10;\ncout << x;', language: 'cpp',
    options: ['5', '10', 'Address of x', 'Error'], correctIndex: 1,
    explanation: 'p points to x, so *p = 10 changes the value stored at that address - x becomes 10.',
  },
  {
    id: 'cp17', code: 'for (int i = 0; i < 3; i++) {\n  cout << i << " ";\n}', language: 'cpp',
    options: ['0 1 2', '1 2 3', '0 1 2 3', '3 2 1'], correctIndex: 0,
    explanation: 'The loop runs while i < 3, printing 0, 1, 2.',
  },
];

// Get prediction questions filtered by topic
export function getPredictionQuestions(topic: string) {
  if (topic === 'mixed') return predictionQuestions.slice(0, 6);
  const langMap: Record<string, string[]> = {
    html: ['html'],
    css: ['css'],
    javascript: ['javascript'],
    python: ['python'],
    react: ['jsx'],
    cpp: ['cpp'],
  };
  const langs = langMap[topic] || ['javascript'];
  const matched = predictionQuestions.filter(q => langs.includes(q.language));
  return matched.length > 0 ? matched : predictionQuestions.slice(0, 6);
}

// Fill in the Blank questions
export const fillBlankQuestions = [
  {
    id: 'fb1', code: 'function greet(name) {\n  return `Hello, ______!`;\n}\ngreet("World");', language: 'javascript',
    blanks: [{ position: 37, answer: '${name}', hint: 'template literal' }], points: 100,
  },
  {
    id: 'fb2', code: 'const doubled = numbers.______(x => x * 2);', language: 'javascript',
    blanks: [{ position: 22, answer: 'map', hint: 'array method' }], points: 100,
  },
  {
    id: 'fb3', code: 'for (let i = 0; i < arr.length; ______) {\n  console.log(arr[i]);\n}', language: 'javascript',
    blanks: [{ position: 33, answer: 'i++', hint: 'increment' }], points: 100,
  },
  {
    id: 'fb4', code: 'import { useState } from "______";', language: 'javascript',
    blanks: [{ position: 26, answer: 'react', hint: 'library name' }], points: 100,
  },
  {
    id: 'fb5', code: 'const [count, ______] = useState(0);', language: 'javascript',
    blanks: [{ position: 15, answer: 'setCount', hint: 'setter function' }], points: 100,
  },
  {
    id: 'fb6', code: 'def factorial(n):\n    if n <= 1:\n        return ______\n    return n * factorial(n - 1)', language: 'python',
    blanks: [{ position: 46, answer: '1', hint: 'base case' }], points: 100,
  },
  {
    id: 'fb7', code: 'squares = [x**2 for x in range(______)]', language: 'python',
    blanks: [{ position: 35, answer: '5', hint: ' generates 0-4' }], points: 100,
  },
  {
    id: 'fb8', code: '.container {\n  display: ______;\n  justify-content: center;\n}', language: 'css',
    blanks: [{ position: 18, answer: 'flex', hint: 'layout mode' }], points: 100,
  },
  {
    id: 'fb9', code: '<button on______={handleClick}>Click</button>', language: 'jsx',
    blanks: [{ position: 13, answer: 'Click', hint: 'event handler' }], points: 100,
  },
  {
    id: 'fb10', code: 'fetch(url)\n  .then(res => res.______())\n  .then(data => console.log(data));', language: 'javascript',
    blanks: [{ position: 33, answer: 'json', hint: 'parse method' }], points: 100,
  },

  // HTML
  {
    id: 'fb11', code: '<______ src="logo.png" alt="Logo">', language: 'html',
    blanks: [{ position: 1, answer: 'img', hint: 'image tag' }], points: 100,
  },
  {
    id: 'fb12', code: '<a ______="https://bitzy.app">Visit Bitzy</a>', language: 'html',
    blanks: [{ position: 3, answer: 'href', hint: 'link destination attribute' }], points: 100,
  },

  // CSS
  {
    id: 'fb13', code: '.card {\n  ______: 16px;\n  border-radius: 8px;\n}', language: 'css',
    blanks: [{ position: 9, answer: 'padding', hint: 'inner spacing' }], points: 100,
  },

  // React
  {
    id: 'fb14', code: 'useEffect(() => {\n  console.log("mounted");\n}, [______]);', language: 'jsx',
    blanks: [{ position: 49, answer: '', hint: 'empty array runs once on mount' }], points: 100,
  },
  {
    id: 'fb15', code: 'function Welcome(______) {\n  return <h1>Hi {props.name}</h1>;\n}', language: 'jsx',
    blanks: [{ position: 18, answer: 'props', hint: 'parameter name' }], points: 100,
  },

  // Python
  {
    id: 'fb16', code: 'numbers = [1, 2, 3]\ntotal = ______(numbers)', language: 'python',
    blanks: [{ position: 30, answer: 'sum', hint: 'built-in totaling function' }], points: 100,
  },

  // C++
  {
    id: 'fb17', code: '#include <iostream>\nusing namespace ______;\nint main() {\n  cout << "Hi";\n}', language: 'cpp',
    blanks: [{ position: 36, answer: 'std', hint: 'standard namespace' }], points: 100,
  },
  {
    id: 'fb18', code: 'int arr[5];\nfor (int i = 0; i < 5; i______) {\n  arr[i] = i;\n}', language: 'cpp',
    blanks: [{ position: 44, answer: '++', hint: 'increment operator' }], points: 100,
  },
];

// Get fill-the-blank questions filtered by topic
export function getFillBlankQuestions(topic: string) {
  if (topic === 'mixed') return fillBlankQuestions.slice(0, 6);
  const langMap: Record<string, string[]> = {
    html: ['html'],
    css: ['css'],
    javascript: ['javascript'],
    python: ['python'],
    react: ['jsx'],
    cpp: ['cpp'],
  };
  const langs = langMap[topic] || ['javascript'];
  const matched = fillBlankQuestions.filter(q => langs.includes(q.language));
  return matched.length > 0 ? matched : fillBlankQuestions.slice(0, 6);
}

// Extended quiz questions
export const pythonQuizQuestions: QuizQuestion[] = [
  {
    id: 'pyq1', question: 'What is the output of len([1, 2, 3])?', options: ['2', '3', '4', 'Error'],
    correctIndex: 1, explanation: 'len() returns the number of items: [1,2,3] has 3 items.', difficulty: 'easy',
  },
  {
    id: 'pyq2', question: 'Which keyword defines a function in Python?', options: ['func', 'def', 'function', 'define'],
    correctIndex: 1, explanation: 'def is used to define functions in Python.', difficulty: 'easy',
  },
  {
    id: 'pyq3', question: 'What does list comprehension [x for x in range(5)] create?', options: ['[1,2,3,4,5]', '[0,1,2,3,4]', '[0,1,2,3,4,5]', '[1,2,3,4]'],
    correctIndex: 1, explanation: 'range(5) generates 0,1,2,3,4. List comprehension collects them into a list.', difficulty: 'easy',
  },
  {
    id: 'pyq4', question: 'What is __init__ in a Python class?', options: ['A destructor', 'A constructor', 'A module', 'A decorator'],
    correctIndex: 1, explanation: '__init__ is the constructor method called when creating a new object.', difficulty: 'medium',
  },
  {
    id: 'pyq5', question: 'What is the difference between tuple and list?', options: ['Tuples are mutable', 'Lists are ordered', 'Tuples are immutable', 'Lists are faster'],
    correctIndex: 2, explanation: 'Tuples cannot be changed after creation (immutable), while lists can (mutable).', difficulty: 'medium',
  },
];

export const reactQuizQuestions: QuizQuestion[] = [
  {
    id: 'rq1', question: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'],
    correctIndex: 0, explanation: 'JSX = JavaScript XML. It is a syntax extension for JavaScript.', difficulty: 'easy',
  },
  {
    id: 'rq2', question: 'Which hook manages state in functional components?', options: ['useEffect', 'useState', 'useContext', 'useReducer'],
    correctIndex: 1, explanation: 'useState is the primary hook for adding state to function components.', difficulty: 'easy',
  },
  {
    id: 'rq3', question: 'What is the purpose of useEffect?', options: ['State management', 'Side effects', 'Routing', 'Styling'],
    correctIndex: 1, explanation: 'useEffect handles side effects like data fetching, subscriptions, DOM updates.', difficulty: 'easy',
  },
  {
    id: 'rq4', question: 'What are props in React?', options: ['Internal state', 'Passed-down data', 'Style rules', 'Event handlers'],
    correctIndex: 1, explanation: 'Props are data passed from parent to child components. They are read-only.', difficulty: 'easy',
  },
  {
    id: 'rq5', question: 'What is the Virtual DOM?', options: ['A real DOM copy', 'A lightweight DOM representation', 'A browser feature', 'A CSS framework'],
    correctIndex: 1, explanation: 'Virtual DOM is a lightweight in-memory representation that React uses to optimize updates.', difficulty: 'medium',
  },
];

export const cppQuizQuestions: QuizQuestion[] = [
  {
    id: 'cppq1', question: 'What does cout << do in C++?', options: ['Input', 'Output', 'Error', 'Nothing'],
    correctIndex: 1, explanation: 'cout << is used for output to the console in C++.', difficulty: 'easy',
  },
  {
    id: 'cppq2', question: 'Which symbol declares a pointer?', options: ['&', '*', '#', '@'],
    correctIndex: 1, explanation: 'The asterisk * declares a pointer variable in C++.', difficulty: 'easy',
  },
  {
    id: 'cppq3', question: 'What is a constructor?', options: ['A destructor', 'An object creator', 'A function call', 'A loop'],
    correctIndex: 1, explanation: 'A constructor is a special method called when an object is created.', difficulty: 'medium',
  },
  {
    id: 'cppq4', question: 'What is the STL?', options: ['Standard Template Library', 'Simple Type List', 'Static Type Loader', 'System Template Loader'],
    correctIndex: 0, explanation: 'STL = Standard Template Library. It provides containers, algorithms, and iterators.', difficulty: 'medium',
  },
  {
    id: 'cppq5', question: 'What does the new keyword do?', options: ['Deletes memory', 'Allocates heap memory', 'Creates a variable', 'Returns a value'],
    correctIndex: 1, explanation: 'new allocates memory on the heap and returns a pointer to it.', difficulty: 'medium',
  },
];
