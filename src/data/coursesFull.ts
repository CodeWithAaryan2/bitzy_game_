import type { Course } from '@/types';

// Helper to create a lesson
function lesson(id: string, title: string, slug: string, description: string, type: 'reading' | 'interactive' | 'coding', duration: string, content: string, codeExamples?: { language: string; code: string; explanation: string }[]): any {
  return { id, title, slug, description, type, duration, xpReward: 25, isCompleted: false, content, codeExamples: codeExamples || [] };
}

export const reactCourse: Course = {
  id: 'react', slug: 'react-js', title: 'React JS Masterclass', description: 'Build modern UIs with components, hooks, and state management.', longDescription: 'Complete React course from JSX and components to advanced patterns like custom hooks, context API, performance optimization, and building real-world apps.',
  color: '#61DAFB', difficulty: 'Medium', category: 'Frontend', tags: ['react', 'frontend', 'javascript', 'ui'],
  totalLessons: 20, totalQuizzes: 4, totalChallenges: 6, estimatedHours: 25, xpReward: 1200, coinReward: 600,
  modules: [
    { id: 'r1', title: 'React Fundamentals', description: 'Core concepts every React developer needs.', order: 1, lessons: [
      lesson('r1-1', 'What is React?', 'what-is-react', 'Understanding the React library and its benefits.', 'reading', '12 min',
        `## What is React?\n\nReact is a **JavaScript library** for building user interfaces, created by Facebook.\n\n### Why React?\n- **Component-based**: Build encapsulated components that manage their own state\n- **Declarative**: Describe what the UI should look like for any given state\n- **Learn Once, Write Anywhere**: React can render on the web, mobile (React Native), and even VR\n- **Huge ecosystem**: Thousands of libraries and tools available\n\n### How React Works\nReact uses a **Virtual DOM** - a lightweight copy of the actual DOM. When state changes, React:\n1. Creates a new Virtual DOM tree\n2. Compares it with the previous one (diffing)\n3. Updates only the changed parts in the real DOM\n\nThis makes React extremely fast and efficient.`,
        [{ language: 'jsx', code: '// React is all about components\nfunction Welcome() {\n  return <h1>Hello, World!</h1>;\n}', explanation: 'A simple React component that returns JSX' }]),

      lesson('r1-2', 'JSX Deep Dive', 'jsx-deep-dive', 'Learn the syntax extension that makes React powerful.', 'interactive', '15 min',
        `## JSX in Detail\n\nJSX stands for **JavaScript XML**. It looks like HTML but lives in JavaScript.\n\n### Key Rules\n- JSX must return a **single parent element**\n- Use **className** instead of class\n- Use **camelCase** for attributes (onClick, not onclick)\n- Expressions go in **curly braces** {}\n\n### Embedding Expressions\nYou can put any valid JavaScript expression inside curly braces:\n- Variables\n- Function calls\n- Ternary operators\n- Math operations`,
        [{ language: 'jsx', code: 'function Greeting({ name, age }) {\n  return (\n    <div className="greeting">\n      <h1>Hello, {name}!</h1>\n      <p>You are {age} years old.</p>\n      <p>Next year: {age + 1}</p>\n      <p>{age >= 18 ? "Adult" : "Minor"}</p>\n    </div>\n  );\n}', explanation: 'JSX allows JavaScript expressions inside curly braces' }]),

      lesson('r1-3', 'Components & Props', 'components-props', 'Build reusable UI pieces with properties.', 'interactive', '15 min',
        `## Components & Props\n\nComponents are the building blocks of React. They let you split the UI into independent, reusable pieces.\n\n### Types of Components\n1. **Function Components** - Modern approach using functions\n2. **Class Components** - Older approach using ES6 classes\n\n### Props\nProps (properties) are how data flows from parent to child components.\n- Props are **read-only**\n- They make components reusable\n- Destructuring props makes code cleaner`,
        [{ language: 'jsx', code: '// Parent component\nfunction App() {\n  return (\n    <div>\n      <UserCard name="Alice" role="Developer" />\n      <UserCard name="Bob" role="Designer" />\n    </div>\n  );\n}\n\n// Child component receiving props\nfunction UserCard({ name, role }) {\n  return (\n    <div className="card">\n      <h3>{name}</h3>\n      <p>{role}</p>\n    </div>\n  );\n}', explanation: 'Passing data from parent to child via props' }]),

      lesson('r1-4', 'Children Prop', 'children-prop', 'Compose components with the special children prop.', 'reading', '10 min',
        `## The Children Prop\n\nEvery React component can receive **children** - content between opening and closing tags.\n\n### Use Cases\n- Layout wrappers (Card, Modal, Container)\n- Content sections\n- Reusable UI patterns\n\n### How It Works\nThe children prop contains whatever you put between the component tags. This enables powerful composition patterns.`),
    ]},

    { id: 'r2', title: 'State & Hooks', description: 'Manage dynamic data with hooks.', order: 2, lessons: [
      lesson('r2-1', 'useState Hook', 'usestate-hook', 'Add state to function components.', 'interactive', '15 min',
        `## useState Hook\n\nThe useState hook lets you add state to function components.\n\n### Syntax\n\`\`\`jsx\nconst [count, setCount] = useState(0);\n\`\`\`\n\n- **count**: current state value\n- **setCount**: function to update the state\n- **0**: initial value\n\n### Rules of Hooks\n1. Only call hooks at the top level\n2. Only call hooks from React functions\n3. Hooks start with "use"`,
        [{ language: 'jsx', code: 'import { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>\n        Increment\n      </button>\n      <button onClick={() => setCount(0)}>\n        Reset\n      </button>\n    </div>\n  );\n}', explanation: 'useState adds state to function components' }]),

      lesson('r2-2', 'useEffect Hook', 'useeffect-hook', 'Handle side effects in components.', 'interactive', '15 min',
        `## useEffect Hook\n\nuseEffect handles side effects: data fetching, subscriptions, manual DOM changes.\n\n### The Dependency Array\n- **No array**: Runs after every render\n- **Empty []**: Runs once on mount\n- **[dep]**: Runs when dep changes\n\n### Cleanup\nReturn a cleanup function to prevent memory leaks.`,
        [{ language: 'jsx', code: 'import { useState, useEffect } from "react";\n\nfunction Timer() {\n  const [seconds, setSeconds] = useState(0);\n\n  useEffect(() => {\n    const interval = setInterval(() => {\n      setSeconds(s => s + 1);\n    }, 1000);\n\n    // Cleanup on unmount\n    return () => clearInterval(interval);\n  }, []);\n\n  return <p>Elapsed: {seconds}s</p>;\n}', explanation: 'useEffect with cleanup - runs once on mount, cleans up on unmount' }]),

      lesson('r2-3', 'useRef Hook', 'useref-hook', 'Access DOM elements and persist values.', 'reading', '12 min',
        `## useRef Hook\n\nuseRef returns a mutable ref object that persists across renders.\n\n### Two Main Uses\n1. **Accessing DOM elements** - Like document.getElementById\n2. **Storing mutable values** - Values that dont trigger re-renders when changed\n\n### vs useState\n- useRef changes dont cause re-renders\n- useRef is perfect for timers, intervals, previous values`),

      lesson('r2-4', 'Custom Hooks', 'custom-hooks', 'Create your own reusable hooks.', 'interactive', '15 min',
        `## Custom Hooks\n\nCustom hooks let you extract component logic into reusable functions.\n\n### Naming Convention\nMust start with "use" (e.g., useLocalStorage, useFetch)\n\n### Benefits\n- Share logic between components\n- Keep components clean\n- Test logic in isolation`,
        [{ language: 'jsx', code: '// Custom hook: useLocalStorage\nfunction useLocalStorage(key, initial) {\n  const [value, setValue] = useState(\n    () => JSON.parse(localStorage.getItem(key)) || initial\n  );\n\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n\n  return [value, setValue];\n}\n\n// Usage\nfunction App() {\n  const [theme, setTheme] = useLocalStorage("theme", "light");\n  return <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>Toggle</button>;\n}', explanation: 'Custom hook that syncs state with localStorage' }]),
    ]},

    { id: 'r3', title: 'Advanced React', description: 'Context, performance, and patterns.', order: 3, lessons: [
      lesson('r3-1', 'Context API', 'context-api', 'Share state without prop drilling.', 'interactive', '15 min',
        `## Context API\n\nContext provides a way to pass data through the component tree without props at every level.\n\n### When to Use\n- Theme settings\n- User authentication\n- Language/locale preferences\n- Any globally shared state`,
        [{ language: 'jsx', code: 'const ThemeContext = createContext("light");\n\nfunction App() {\n  return (\n    <ThemeContext.Provider value="dark">\n      <Toolbar />\n    </ThemeContext.Provider>\n  );\n}\n\nfunction Toolbar() {\n  return <ThemedButton />; // No prop passing!\n}\n\nfunction ThemedButton() {\n  const theme = useContext(ThemeContext);\n  return <button className={theme}>Click</button>;\n}', explanation: 'Context eliminates prop drilling through intermediate components' }]),

      lesson('r3-2', 'useReducer', 'usereducer', 'Manage complex state logic.', 'reading', '12 min',
        `## useReducer\n\nuseReducer is an alternative to useState for complex state logic.\n\n### Pattern\n\`\`\`\nconst [state, dispatch] = useReducer(reducer, initialState);\n\`\`\`\n\n### When to Use\n- State has multiple sub-values\n- Next state depends on previous\n- Complex state transitions\n\nSimilar to how Redux works but built into React.`),

      lesson('r3-3', 'React Router', 'react-router', 'Add navigation to your React app.', 'interactive', '15 min',
        `## React Router\n\nReact Router enables client-side routing in React applications.\n\n### Key Components\n- **BrowserRouter**: Wraps your app\n- **Routes**: Container for Route components\n- **Route**: Defines a URL path and component\n- **Link**: Navigate without page reload\n- **useParams**: Access URL parameters\n- **useNavigate**: Programmatic navigation`,
        [{ language: 'jsx', code: 'import { BrowserRouter, Routes, Route, Link } from "react-router-dom";\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <nav>\n        <Link to="/">Home</Link>\n        <Link to="/about">About</Link>\n      </nav>\n      <Routes>\n        <Route path="/" element={<Home />} />\n        <Route path="/about" element={<About />} />\n      </Routes>\n    </BrowserRouter>\n  );\n}', explanation: 'Setting up routing with React Router v6' }]),

      lesson('r3-4', 'Performance Optimization', 'performance', 'Make your React apps blazing fast.', 'reading', '12 min',
        `## Performance Optimization\n\n### Techniques\n1. **React.memo** - Prevent unnecessary re-renders of components\n2. **useMemo** - Cache expensive computations\n3. **useCallback** - Cache function references\n4. **Lazy Loading** - Load components only when needed\n5. **Code Splitting** - Split bundles for faster initial load\n\n### Profiling\nUse React DevTools Profiler to identify performance bottlenecks.\n\n### Key Principle\nDont optimize prematurely. Profile first, then optimize the actual bottlenecks.`),
    ]},
  ],
};

export const nextjsCourse: Course = {
  id: 'nextjs', slug: 'next-js', title: 'Next.js Framework', description: 'The React framework for production with SSR, SSG, and API routes.', longDescription: 'Master Next.js - the industry-standard React framework. Learn Server-Side Rendering, Static Site Generation, API routes, file-based routing, and building production-ready fullstack applications.',
  color: '#000000', difficulty: 'Hard', category: 'Frontend', tags: ['nextjs', 'react', 'fullstack', 'ssr'],
  totalLessons: 16, totalQuizzes: 3, totalChallenges: 5, estimatedHours: 20, xpReward: 1000, coinReward: 500,
  modules: [
    { id: 'n1', title: 'Next.js Basics', description: 'Core concepts and file-based routing.', order: 1, lessons: [
      lesson('n1-1', 'Why Next.js?', 'why-nextjs', 'Understand what makes Next.js special.', 'reading', '12 min',
        `## Why Next.js?\n\nNext.js is a **React framework** that adds powerful features for production apps.\n\n### Key Features\n- **File-based routing**: Create pages by adding files to the pages directory\n- **Server-Side Rendering (SSR)**: Render pages on the server for better SEO\n- **Static Site Generation (SSG)**: Pre-render pages at build time for blazing speed\n- **API Routes**: Build backend APIs within your Next.js app\n- **Image Optimization**: Automatic image optimization with the Image component\n- **Zero Config**: Works out of the box with sensible defaults\n\n### SSR vs SSG vs CSR\n- **SSR**: Server renders on each request (good for dynamic data)\n- **SSG**: Pre-rendered at build time (fastest, good for blogs/marketing)\n- **CSR**: Client renders (traditional React, least SEO-friendly)`),

      lesson('n1-2', 'File-Based Routing', 'file-routing', 'Learn the pages directory routing system.', 'interactive', '15 min',
        `## File-Based Routing\n\nIn Next.js, files in the pages directory automatically become routes.\n\n### Rules\n- \`pages/index.js\` → \`/\`\n- \`pages/about.js\` → \`/about\`\n- \`pages/blog/[slug].js\` → \`/blog/:slug\` (dynamic route)\n- \`pages/blog/[...slug].js\` → catch-all route\n\n### Dynamic Routes\nUse \`useRouter\` to access dynamic route parameters.`,
        [{ language: 'jsx', code: '// pages/blog/[slug].js\nimport { useRouter } from "next/router";\n\nexport default function BlogPost() {\n  const router = useRouter();\n  const { slug } = router.query;\n\n  return <h1>Post: {slug}</h1>;\n}', explanation: 'Dynamic routes use brackets [param] in the filename' }]),

      lesson('n1-3', 'Layouts & _app', 'layouts-app', 'Create shared layouts for your app.', 'reading', '10 min',
        `## The _app.js File\n\nThe \`_app.js\` file wraps all pages. Use it for:\n- Global layouts\n- Shared state (providers)\n- Global CSS imports\n- Page transitions\n\n### Creating Layouts\nCreate a Layout component and wrap pages with it. You can have different layouts for different sections of your app.`),

      lesson('n1-4', 'Link & Navigation', 'link-navigation', 'Client-side navigation with the Link component.', 'interactive', '10 min',
        `## The Link Component\n\nNext.js provides a \`Link\` component for client-side navigation.\n\n### Benefits\n- No full page reload\n- Automatic code splitting\n- Prefetching on viewport entry\n\n### Usage\nAlways use \`Link\` instead of \`<a>\` for internal navigation. Use \`<a>\` only for external links.`,
        [{ language: 'jsx', code: 'import Link from "next/link";\n\nfunction Navbar() {\n  return (\n    <nav>\n      <Link href="/">Home</Link>\n      <Link href="/about">About</Link>\n      <Link href="/blog/hello-world">Blog Post</Link>\n    </nav>\n  );\n}', explanation: 'Link component enables fast client-side navigation' }]),
    ]},

    { id: 'n2', title: 'Data Fetching', description: 'SSR, SSG, and client-side data fetching.', order: 2, lessons: [
      lesson('n2-1', 'getStaticProps', 'getstaticprops', 'Pre-render pages with static data.', 'interactive', '15 min',
        `## getStaticProps\n\nUse getStaticProps to fetch data at build time for Static Site Generation.\n\n### How It Works\n1. Next.js calls getStaticProps at build time\n2. The returned props are passed to your page component\n3. The page is pre-rendered with this data\n\n### When to Use\n- Blog posts\n- Product listings\n- Marketing pages\n- Any content that doesnt change often`,
        [{ language: 'jsx', code: '// Fetched at BUILD TIME\nexport async function getStaticProps() {\n  const res = await fetch("https://api.example.com/posts");\n  const posts = await res.json();\n\n  return {\n    props: { posts }, // Passed to page\n    revalidate: 60, // ISR: regenerate every 60s\n  };\n}\n\nexport default function Blog({ posts }) {\n  return (\n    <ul>\n      {posts.map(p => <li key={p.id}>{p.title}</li>)}\n    </ul>\n  );\n}', explanation: 'getStaticProps runs at build time for SSG' }]),

      lesson('n2-2', 'getServerSideProps', 'getserversideprops', 'Render pages on each request.', 'reading', '12 min',
        `## getServerSideProps\n\nUse getServerSideProps to fetch data on every request for Server-Side Rendering.\n\n### How It Works\n1. User requests the page\n2. Server runs getServerSideProps\n3. Page is rendered with fresh data\n4. HTML is sent to the browser\n\n### When to Use\n- User-specific data (dashboards)\n- Content that changes frequently\n- Pages behind authentication`),

      lesson('n2-3', 'API Routes', 'api-routes', 'Build backend APIs in Next.js.', 'interactive', '15 min',
        `## API Routes\n\nCreate API endpoints by adding files to the \`pages/api\` directory.\n\n### Features\n- Serverless functions\n- Full Node.js access\n- Automatic routing\n- Can connect to databases\n\n### Use Cases\n- Form handling\n- Authentication\n- Database queries\n- Third-party API proxy`,
        [{ language: 'javascript', code: '// pages/api/hello.js\nexport default function handler(req, res) {\n  if (req.method === "GET") {\n    res.status(200).json({ message: "Hello!" });\n  } else if (req.method === "POST") {\n    const { name } = req.body;\n    res.status(200).json({ message: `Hello, ${name}!` });\n  }\n}', explanation: 'API routes are serverless functions that handle HTTP requests' }]),

      lesson('n2-4', 'ISR & Client Fetching', 'isr-client-fetch', 'Incremental Static Regeneration and SWR.', 'reading', '12 min',
        `## Incremental Static Regeneration (ISR)\n\nISR lets you update static content after building without rebuilding the entire site.\n\n### How It Works\nAdd \`revalidate\` to getStaticProps. Next.js will:\n1. Serve the cached page immediately\n2. Regenerate in the background\n3. Serve the updated page on next request\n\n### SWR for Client Fetching\nUse the SWR library for data fetching on the client:\n- Automatic caching\n- Real-time updates\n- Error retry\n- Pagination support`),
    ]},

    { id: 'n3', title: 'Advanced Next.js', description: 'Optimization, deployment, and fullstack patterns.', order: 3, lessons: [
      lesson('n3-1', 'Image Component', 'image-component', 'Optimize images automatically.', 'interactive', '12 min',
        `## The Image Component\n\nNext.js provides an optimized Image component.\n\n### Benefits\n- Automatic resizing and optimization\n- Lazy loading by default\n- Prevents layout shift\n- Serves WebP when supported`,
        [{ language: 'jsx', code: 'import Image from "next/image";\n\nfunction Hero() {\n  return (\n    <Image\n      src="/photo.jpg"\n      alt="Hero image"\n      width={800}\n      height={400}\n      priority // Load immediately\n    />\n  );\n}', explanation: 'Image component automatically optimizes images' }]),

      lesson('n3-2', 'Middleware', 'middleware', 'Run code before requests.', 'reading', '10 min',
        `## Middleware\n\nNext.js Middleware lets you run code before a request is completed.\n\n### Use Cases\n- Authentication checks\n- A/B testing\n- Redirects based on location\n- Bot detection\n\n### How It Works\nCreate a \`middleware.js\` file at the root. It runs on the Edge for maximum performance.`),

      lesson('n3-3', 'Deployment', 'deployment', 'Deploy your Next.js app.', 'reading', '10 min',
        `## Deploying Next.js\n\n### Vercel (Recommended)\n- Zero-config deployment\n- Automatic preview deployments\n- Edge functions support\n- Built by the creators of Next.js\n\n### Other Options\n- **Netlify**: Great for JAMstack apps\n- **AWS**: Full control with Amplify or EC2\n- **Docker**: Containerize for any platform\n\n### Environment Variables\nUse \`.env.local\` for local dev and Vercel dashboard for production.`),
    ]},
  ],
};

export const cCourse: Course = {
  id: 'c', slug: 'c-programming', title: 'C Programming', description: 'Learn the foundation of modern programming with C.', longDescription: 'Master C programming from basics to advanced. Understand memory management, pointers, data structures, and system-level programming. C is the language that powers operating systems, embedded systems, and more.',
  color: '#00599C', difficulty: 'Hard', category: 'Systems', tags: ['c', 'systems', 'programming', 'low-level'],
  totalLessons: 18, totalQuizzes: 4, totalChallenges: 6, estimatedHours: 25, xpReward: 1200, coinReward: 600,
  modules: [
    { id: 'c1', title: 'C Fundamentals', description: 'Syntax, variables, and control structures.', order: 1, lessons: [
      lesson('c1-1', 'Hello World in C', 'hello-world-c', 'Write your first C program.', 'interactive', '12 min',
        `## Your First C Program\n\nC is a procedural programming language developed by Dennis Ritchie in 1972.\n\n### Program Structure\nEvery C program has:\n1. **Preprocessor directives** (#include)\n2. **Main function** - Entry point\n3. **Statements** ending with semicolons\n4. **Return statement**\n\n### Compilation\nC is a compiled language:\n\`\`\`\nSource Code → Compiler → Machine Code → Execution\n\`\`\``, [{ language: 'c', code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}', explanation: 'The classic Hello World program in C' }]),

      lesson('c1-2', 'Variables & Data Types', 'variables-types', 'Understand C data types and declarations.', 'interactive', '15 min',
        `## Variables & Data Types\n\nC is statically typed - you must declare the type of every variable.\n\n### Basic Types\n- **int**: Whole numbers (4 bytes)\n- **float**: Decimal numbers (4 bytes)\n- **double**: Large decimals (8 bytes)\n- **char**: Single character (1 byte)\n- **void**: No value\n\n### Format Specifiers\n- \`%d\` - int\n- \`%f\` - float/double\n- \`%c\` - char\n- \`%s\` - string\n- \`%p\` - pointer`, [{ language: 'c', code: '#include <stdio.h>\n\nint main() {\n    int age = 25;\n    float pi = 3.14;\n    char grade = \'A\';\n    \n    printf("Age: %d\\n", age);\n    printf("Pi: %.2f\\n", pi);\n    printf("Grade: %c\\n", grade);\n    \n    return 0;\n}', explanation: 'Declaring and printing variables of different types' }]),

      lesson('c1-3', 'Control Flow', 'control-flow', 'if/else, loops, and switch statements.', 'interactive', '15 min',
        `## Control Flow\n\n### if/else if/else\nMake decisions in your code based on conditions.\n\n### Loops\n- **for**: Known number of iterations\n- **while**: Unknown iterations, check first\n- **do-while**: Unknown iterations, execute first\n\n### switch\nMulti-way branching based on a value.`, [{ language: 'c', code: '#include <stdio.h>\n\nint main() {\n    // if-else\n    int score = 85;\n    if (score >= 90) {\n        printf("Grade A\\n");\n    } else if (score >= 80) {\n        printf("Grade B\\n");\n    } else {\n        printf("Grade C\\n");\n    }\n\n    // for loop\n    for (int i = 1; i <= 5; i++) {\n        printf("%d ", i);\n    }\n    \n    return 0;\n}', explanation: 'Conditional statements and loops in C' }]),

      lesson('c1-4', 'Functions', 'functions-c', 'Create reusable blocks of code.', 'interactive', '12 min',
        `## Functions in C\n\nFunctions are reusable blocks of code that perform a specific task.\n\n### Parts of a Function\n- **Return type**: What the function returns\n- **Name**: Identifier for the function\n- **Parameters**: Input values\n- **Body**: Code to execute\n\n### Function Prototypes\nDeclare functions before main, define them after.`, [{ language: 'c', code: '#include <stdio.h>\n\n// Function prototype\nint add(int a, int b);\n\nint main() {\n    int result = add(5, 3);\n    printf("Sum: %d\\n", result);\n    return 0;\n}\n\n// Function definition\nint add(int a, int b) {\n    return a + b;\n}', explanation: 'Declaring, calling, and defining functions' }]),
    ]},

    { id: 'c2', title: 'Pointers & Memory', description: 'The heart of C programming.', order: 2, lessons: [
      lesson('c2-1', 'Pointers', 'pointers', 'Understand memory addresses and pointers.', 'interactive', '18 min',
        `## Pointers in C\n\nA pointer is a variable that stores a memory address.\n\n### Key Concepts\n- **&** (address-of operator): Gets the memory address\n- **\`*\`** (dereference operator): Gets the value at an address\n- **Pointer declaration**: \`int *ptr;\`\n\n### Why Pointers?\n- Direct memory access\n- Efficient array handling\n- Dynamic memory allocation\n- Function arguments by reference`, [{ language: 'c', code: '#include <stdio.h>\n\nint main() {\n    int num = 42;\n    int *ptr = &num; // ptr stores address of num\n    \n    printf("Value: %d\\n", num);\n    printf("Address: %p\\n", (void*)&num);\n    printf("Pointer value: %d\\n", *ptr);\n    \n    *ptr = 100; // Change value through pointer\n    printf("New value: %d\\n", num);\n    \n    return 0;\n}', explanation: 'Pointers store memory addresses and can modify values indirectly' }]),

      lesson('c2-2', 'Arrays & Strings', 'arrays-strings', 'Work with collections of data.', 'interactive', '15 min',
        `## Arrays in C\n\nArrays store multiple values of the same type in contiguous memory.\n\n### Key Points\n- Fixed size at declaration\n- Zero-indexed\n- Array name is a pointer to the first element\n- No bounds checking!\n\n### Strings\nStrings in C are arrays of characters ending with \\0 (null terminator).`, [{ language: 'c', code: '#include <stdio.h>\n\nint main() {\n    int nums[5] = {10, 20, 30, 40, 50};\n    char name[] = "Alice";\n    \n    for (int i = 0; i < 5; i++) {\n        printf("nums[%d] = %d\\n", i, nums[i]);\n    }\n    \n    printf("Name: %s\\n", name);\n    printf("Length: %zu\\n", sizeof(name) - 1);\n    \n    return 0;\n}', explanation: 'Arrays store multiple values; strings are char arrays' }]),

      lesson('c2-3', 'Dynamic Memory', 'dynamic-memory', 'Allocate memory at runtime with malloc.', 'reading', '15 min',
        `## Dynamic Memory Allocation\n\nC lets you allocate memory at runtime using the heap.\n\n### Functions\n- **malloc(size)**: Allocate memory block\n- **calloc(n, size)**: Allocate and zero-initialize\n- **realloc(ptr, size)**: Resize allocation\n- **free(ptr)**: Release memory\n\n### Memory Leaks\nAlways free dynamically allocated memory when done. A memory leak occurs when you lose the pointer to allocated memory without freeing it.\n\n### Stack vs Heap\n- **Stack**: Automatic, limited size, fast\n- **Heap**: Manual, large size, slower access`),

      lesson('c2-4', 'Structures', 'structures', 'Create custom data types.', 'interactive', '12 min',
        `## Structures in C\n\nStructures (struct) let you group related variables of different types.\n\n### Use Cases\n- Student records\n- Product information\n- Game entities\n- Any grouped data\n\n### Typedef\nUse typedef to create aliases for types, making code cleaner.`, [{ language: 'c', code: '#include <stdio.h>\n\ntypedef struct {\n    char name[50];\n    int age;\n    float gpa;\n} Student;\n\nint main() {\n    Student s1 = {"Alice", 20, 3.8};\n    \n    printf("Name: %s\\n", s1.name);\n    printf("Age: %d\\n", s1.age);\n    printf("GPA: %.2f\\n", s1.gpa);\n    \n    return 0;\n}', explanation: 'Structures group different data types together' }]),
    ]},
  ],
};

export const cppCourse: Course = {
  id: 'cpp', slug: 'cplusplus', title: 'C++ Programming', description: 'Object-oriented programming with C++.', longDescription: 'Learn C++ - the powerful object-oriented language used in game development, systems programming, and high-performance applications. Master classes, inheritance, templates, STL, and modern C++ features.',
  color: '#00599C', difficulty: 'Expert', category: 'Systems', tags: ['cpp', 'oop', 'programming', 'games'],
  totalLessons: 18, totalQuizzes: 4, totalChallenges: 6, estimatedHours: 28, xpReward: 1400, coinReward: 700,
  modules: [
    { id: 'pp1', title: 'C++ Basics', description: 'C++ syntax and improvements over C.', order: 1, lessons: [
      lesson('pp1-1', 'C++ vs C', 'cpp-vs-c', 'What makes C++ different from C.', 'reading', '12 min',
        `## C++ - C with Superpowers\n\nC++ was created by Bjarne Stroustrup as an extension of C. It adds:\n\n### Key Additions\n- **Object-Oriented Programming**: Classes, objects, inheritance\n- **Standard Template Library (STL)**: Vectors, maps, algorithms\n- **References**: Safer alternative to pointers\n- **Function overloading**: Same name, different parameters\n- **Namespaces**: Organize code\n- **iostream**: Type-safe I/O\n\n### Hello World in C++\nNotice the cleaner I/O with cout instead of printf.`, [{ language: 'cpp', code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}', explanation: 'C++ uses cout with << operator for output' }]),

      lesson('pp1-2', 'References', 'references', 'Understand references - safer than pointers.', 'interactive', '12 min',
        `## References in C++\n\nA reference is an alias for an existing variable.\n\n### Key Differences from Pointers\n- Cannot be null\n- Cannot be reassigned\n- No dereferencing needed\n- Safer and easier to use\n\n### Use Cases\n- Function parameters (pass by reference)\n- Range-based for loops\n- Avoiding unnecessary copies`, [{ language: 'cpp', code: '#include <iostream>\nusing namespace std;\n\nvoid swap(int &a, int &b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}\n\nint main() {\n    int x = 5, y = 10;\n    swap(x, y);\n    cout << x << " " << y << endl; // 10 5\n    return 0;\n}', explanation: 'References allow modifying original variables in functions' }]),

      lesson('pp1-3', 'Classes & Objects', 'classes-objects', 'The foundation of OOP in C++.', 'interactive', '18 min',
        `## Classes & Objects\n\nA class is a blueprint for creating objects. It encapsulates data (attributes) and behavior (methods).\n\n### Key Concepts\n- **Encapsulation**: Data hiding with private/public\n- **Constructor**: Initializes objects\n- **Destructor**: Cleans up when object is destroyed\n- **this pointer**: Refers to current object\n\n### Access Specifiers\n- **public**: Accessible everywhere\n- **private**: Only within the class\n- **protected**: Within class and derived classes`, [{ language: 'cpp', code: '#include <iostream>\nusing namespace std;\n\nclass Car {\nprivate:\n    string brand;\n    int speed;\n\npublic:\n    Car(string b) {\n        brand = b;\n        speed = 0;\n    }\n    void accelerate() {\n        speed += 10;\n    }\n    int getSpeed() {\n        return speed;\n    }\n};\n\nint main() {\n    Car myCar("Toyota");\n    myCar.accelerate();\n    cout << myCar.getSpeed() << endl; // 10\n    return 0;\n}', explanation: 'Class with private data and public methods' }]),
    ]},

    { id: 'pp2', title: 'OOP in C++', description: 'Inheritance, polymorphism, and advanced OOP.', order: 2, lessons: [
      lesson('pp2-1', 'Inheritance', 'inheritance', 'Create class hierarchies.', 'interactive', '15 min',
        `## Inheritance\n\nInheritance allows a class to inherit properties and methods from another class.\n\n### Types\n- **Public inheritance**: is-a relationship\n- **Protected inheritance**: limited access\n- **Private inheritance**: implementation detail\n\n### Benefits\n- Code reuse\n- Logical hierarchy\n- Polymorphism base`, [{ language: 'cpp', code: '#include <iostream>\nusing namespace std;\n\nclass Animal {\npublic:\n    void speak() {\n        cout << "Some sound" << endl;\n    }\n};\n\nclass Dog : public Animal {\npublic:\n    void speak() {\n        cout << "Woof!" << endl;\n    }\n};\n\nint main() {\n    Dog d;\n    d.speak(); // Woof!\n    return 0;\n}', explanation: 'Dog inherits from Animal and overrides speak()' }]),

      lesson('pp2-2', 'Polymorphism', 'polymorphism', 'Virtual functions and runtime binding.', 'reading', '15 min',
        `## Polymorphism\n\nPolymorphism means "many forms." In C++, it allows treating objects of derived classes as base class objects.\n\n### Virtual Functions\n- Declared with \`virtual\` keyword\n- Enable runtime polymorphism\n- Base class pointer can call derived class methods\n\n### Pure Virtual Functions\n\`virtual void draw() = 0;\`\n- Makes a class abstract\n- Must be overridden by derived classes\n- Cannot instantiate abstract classes`),

      lesson('pp2-3', 'STL Containers', 'stl-containers', 'Use the Standard Template Library.', 'interactive', '15 min',
        `## STL Containers\n\nThe Standard Template Library provides ready-to-use data structures.\n\n### Common Containers\n- **vector**: Dynamic array\n- **map**: Key-value pairs (tree-based)\n- **unordered_map**: Hash table\n- **set**: Unique sorted elements\n- **queue/stack**: Adapter containers\n\n### Algorithms\n- sort, find, binary_search\n- accumulate, count, for_each`, [{ language: 'cpp', code: '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<int> nums = {3, 1, 4, 1, 5};\n    \n    nums.push_back(9);\n    sort(nums.begin(), nums.end());\n    \n    for (int n : nums) {\n        cout << n << " ";\n    }\n    // Output: 1 1 3 4 5 9\n    \n    return 0;\n}', explanation: 'Vector is a dynamic array from the STL' }]),
    ]},
  ],
};

export const pythonFullCourse: Course = {
  id: 'python', slug: 'python-masterclass', title: 'Python Masterclass', description: 'Complete Python from basics to advanced.', longDescription: 'Comprehensive Python course covering fundamentals, OOP, file handling, modules, exception handling, and building real-world projects. Python is the most beginner-friendly and versatile programming language.',
  color: '#3776AB', difficulty: 'Beginner', category: 'Backend', tags: ['python', 'programming', 'automation', 'data'],
  totalLessons: 20, totalQuizzes: 5, totalChallenges: 8, estimatedHours: 25, xpReward: 1000, coinReward: 500,
  modules: [
    { id: 'py1', title: 'Python Basics', description: 'Syntax, variables, and core concepts.', order: 1, lessons: [
      lesson('py1-1', 'Python Introduction', 'python-intro', 'Why Python is the best first language.', 'reading', '10 min',
        `## Why Learn Python?\n\nPython is the most popular programming language in the world.\n\n### Key Features\n- **Simple syntax**: Reads like English\n- **Versatile**: Web, data science, AI, automation\n- **Huge community**: Millions of developers\n- **Libraries**: 400,000+ packages available\n\n### Python Uses\n- Web development (Django, Flask)\n- Data Science (pandas, numpy)\n- Machine Learning (TensorFlow, PyTorch)\n- Automation & scripting\n- Game development`),

      lesson('py1-2', 'Variables & Types', 'variables-types', 'Dynamic typing in Python.', 'interactive', '12 min',
        `## Variables in Python\n\nPython is dynamically typed - you dont declare types.\n\n### Basic Types\n- **int**: Whole numbers\n- **float**: Decimal numbers\n- **str**: Text strings\n- **bool**: True or False\n- **None**: Null value\n\n### Type Conversion\nUse int(), float(), str() to convert between types.`, [{ language: 'python', code: '# Variables in Python\nname = "Alice"\nage = 25\npi = 3.14\nis_student = True\n\nprint(f"Name: {name}")\nprint(f"Age: {age}")\nprint(f"Pi: {pi}")\n\n# f-strings for formatting\nprint(f"{name} is {age} years old")', explanation: 'Python uses dynamic typing - no type declarations needed' }]),

      lesson('py1-3', 'Lists & Dictionaries', 'lists-dicts', 'Powerful built-in data structures.', 'interactive', '15 min',
        `## Lists\nOrdered, mutable collections.\n\n### Common Operations\n- append(), insert(), remove()\n- sort(), reverse()\n- List comprehensions\n\n## Dictionaries\nKey-value pairs for fast lookups.\n\n### Common Operations\n- Access: dict["key"] or dict.get("key")\n- Add/Update: dict["key"] = value\n- Iterate: for key, value in dict.items()`, [{ language: 'python', code: '# Lists\nfruits = ["apple", "banana", "cherry"]\nfruits.append("date")\n\n# List comprehension\nsquares = [x**2 for x in range(5)]\n\n# Dictionaries\nstudent = {\n    "name": "Alice",\n    "age": 20,\n    "grade": "A"\n}\n\nprint(student["name"])\nprint(f"Squares: {squares}")', explanation: 'Lists store ordered collections; dictionaries store key-value pairs' }]),

      lesson('py1-4', 'Control Flow', 'control-flow', 'if/else, loops, and comprehensions.', 'interactive', '12 min',
        `## Control Flow in Python\n\n### if/elif/else\nIndentation-based (no curly braces!)\n\n### Loops\n- **for**: Iterate over sequences\n- **while**: Conditional looping\n- **range()**: Generate number sequences\n\n### Loop Control\n- **break**: Exit loop\n- **continue**: Skip iteration\n- **else**: Runs if loop didnt break`, [{ language: 'python', code: '# for loop\nfor i in range(1, 6):\n    if i % 2 == 0:\n        print(f"{i} is even")\n    else:\n        print(f"{i} is odd")\n\n# while loop\ncount = 3\nwhile count > 0:\n    print(count)\n    count -= 1\n\n# List comprehension\nevens = [x for x in range(10) if x % 2 == 0]\nprint(evens)  # [0, 2, 4, 6, 8]', explanation: 'Python uses indentation for code blocks' }]),

      lesson('py1-5', 'Functions', 'functions-py', 'Define reusable code blocks.', 'interactive', '12 min',
        `## Functions in Python\n\nDefine functions with the \`def\` keyword.\n\n### Features\n- Default arguments\n- Keyword arguments\n- Variable arguments (*args, **kwargs)\n- Lambda functions\n- Return multiple values`, [{ language: 'python', code: '# Function definition\ndef greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\n# Lambda\nsquare = lambda x: x ** 2\n\n# Multiple return\ndef get_stats(numbers):\n    return min(numbers), max(numbers), sum(numbers)/len(numbers)\n\nprint(greet("Alice"))\nprint(greet("Bob", "Hi"))\nprint(square(5))\n\nnums = [1, 5, 3, 9, 2]\nmin_val, max_val, avg = get_stats(nums)\nprint(f"Min: {min_val}, Max: {max_val}, Avg: {avg:.2f}")', explanation: 'Functions use def keyword with flexible argument handling' }]),
    ]},

    { id: 'py2', title: 'Intermediate Python', description: 'OOP, files, and modules.', order: 2, lessons: [
      lesson('py2-1', 'Classes & OOP', 'classes-py', 'Object-oriented programming in Python.', 'interactive', '15 min',
        `## OOP in Python\n\nPython supports full object-oriented programming.\n\n### Key Concepts\n- **class**: Blueprint for objects\n- **__init__**: Constructor method\n- **self**: Reference to instance\n- **Inheritance**: Class hierarchies\n- **Encapsulation**: Private attributes with _\n- **Polymorphism**: Same interface, different implementation`, [{ language: 'python', code: 'class Dog:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    \n    def bark(self):\n        return f"{self.name} says: Woof!"\n    \n    def __str__(self):\n        return f"Dog({self.name}, {self.age})"\n\nmy_dog = Dog("Buddy", 3)\nprint(my_dog)\nprint(my_dog.bark())', explanation: 'Classes use __init__ as constructor and self for instance reference' }]),

      lesson('py2-2', 'File Handling', 'file-handling', 'Read and write files.', 'interactive', '12 min',
        `## File Handling\n\nPython makes file operations simple.\n\n### Modes\n- \`r\`: Read (default)\n- \`w\`: Write (overwrites)\n- \`a\`: Append\n- \`x\`: Create (fails if exists)\n\n### Context Manager\nAlways use \`with\` statement - it auto-closes the file.`, [{ language: 'python', code: '# Reading a file\nwith open("data.txt", "r") as file:\n    content = file.read()\n    print(content)\n\n# Writing to a file\ndata = ["Line 1", "Line 2", "Line 3"]\nwith open("output.txt", "w") as file:\n    for line in data:\n        file.write(line + "\\n")\n\n# Reading line by line\nwith open("data.txt", "r") as file:\n    for line in file:\n        print(line.strip())', explanation: 'with statement ensures files are properly closed' }]),

      lesson('py2-3', 'Exception Handling', 'exceptions', 'Handle errors gracefully.', 'reading', '12 min',
        `## Exception Handling\n\nUse try/except to handle errors without crashing.\n\n### Structure\n\`\`\`python\ntry:\n    # risky code\nexcept ValueError:\n    # handle specific error\nexcept Exception as e:\n    # handle any error\nelse:\n    # runs if no error\nfinally:\n    # always runs\n\`\`\`\n\n### Common Exceptions\n- ValueError, TypeError\n- FileNotFoundError\n- IndexError, KeyError\n- ZeroDivisionError`),

      lesson('py2-4', 'Modules & Packages', 'modules', 'Organize code into reusable modules.', 'reading', '10 min',
        `## Modules & Packages\n\n### Importing\n- \`import module\`: Import entire module\n- \`from module import func\`: Import specific items\n- \`import module as alias\`: Create alias\n\n### Creating Modules\nAny Python file is a module. Create packages by putting modules in directories with __init__.py.\n\n### Popular Built-in Modules\n- os, sys: System operations\n- datetime: Date and time\n- json: JSON handling\n- random: Random numbers\n- math, statistics: Math operations`),
    ]},
  ],
};

// All courses combined
export const allCoursesFull: Course[] = [reactCourse, nextjsCourse, pythonFullCourse, cCourse, cppCourse];
