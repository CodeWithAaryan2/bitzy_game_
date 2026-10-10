import type { Quiz } from '@/types';

export const quizzes: Quiz[] = [
  {
    id: 'html-quiz-1',
    lessonId: 'html-semantic',
    title: 'HTML Basics Quiz',
    description: 'Test your knowledge of HTML fundamentals.',
    timeLimit: 300,
    passingScore: 70,
    xpReward: 50,
    coinReward: 25,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What does HTML stand for?',
        options: ['HyperText Markup Language', 'HighTech Modern Language', 'HyperTransfer Mark Language', 'Home Tool Markup Language'],
        correctAnswer: 0,
        explanation: 'HTML stands for HyperText Markup Language.',
        difficulty: 'easy'
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        question: 'Which tag is used for the main heading of a page?',
        options: ['<head>', '<h1>', '<header>', '<heading>'],
        correctAnswer: 1,
        explanation: '<h1> is the main heading tag. <head> contains metadata, <header> is a semantic container.',
        difficulty: 'easy'
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'What is the purpose of the alt attribute in an <img> tag?',
        options: ['To make the image load faster', 'To provide alternative text for accessibility', 'To change the image alignment', 'To add a caption'],
        correctAnswer: 1,
        explanation: 'The alt attribute provides alternative text for screen readers and when images fail to load.',
        difficulty: 'easy'
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Which HTML5 element should be used for the main content of a page?',
        options: ['<content>', '<main>', '<body>', '<article>'],
        correctAnswer: 1,
        explanation: '<main> represents the dominant content of the <body>. There should be only one per page.',
        difficulty: 'medium'
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'What is the correct way to create a hyperlink?',
        options: ['<link href="url">', '<a src="url">', '<a href="url">', '<hyperlink url="url">'],
        correctAnswer: 2,
        explanation: 'The <a> tag with href attribute creates hyperlinks.',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'css-quiz-1',
    lessonId: 'css-box-model',
    title: 'CSS Fundamentals Quiz',
    description: 'Test your CSS knowledge.',
    timeLimit: 300,
    passingScore: 70,
    xpReward: 60,
    coinReward: 30,
    questions: [
      {
        id: 'cq1',
        type: 'multiple_choice',
        question: 'What does CSS stand for?',
        options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
        correctAnswer: 1,
        explanation: 'CSS stands for Cascading Style Sheets.',
        difficulty: 'easy'
      },
      {
        id: 'cq2',
        type: 'multiple_choice',
        question: 'Which property changes the text color?',
        options: ['text-color', 'font-color', 'color', 'text-style'],
        correctAnswer: 2,
        explanation: 'The color property sets the text color.',
        difficulty: 'easy'
      },
      {
        id: 'cq3',
        type: 'multiple_choice',
        question: 'What is the recommended box-sizing value?',
        options: ['content-box', 'border-box', 'padding-box', 'margin-box'],
        correctAnswer: 1,
        explanation: 'border-box includes padding and border in the element\'s total width and height.',
        difficulty: 'medium'
      },
      {
        id: 'cq4',
        type: 'multiple_choice',
        question: 'Which selector has the highest specificity?',
        options: ['.class', '#id', 'element', '*'],
        correctAnswer: 1,
        explanation: 'ID selectors (#id) have higher specificity than class, element, and universal selectors.',
        difficulty: 'medium'
      },
      {
        id: 'cq5',
        type: 'multiple_choice',
        question: 'What does the ":hover" pseudo-class do?',
        options: ['Styles the first child', 'Styles when element is hovered', 'Styles on focus', 'Styles when active'],
        correctAnswer: 1,
        explanation: ':hover applies styles when the user hovers over an element with a pointing device.',
        difficulty: 'easy'
      }
    ]
  },
  {
    id: 'js-quiz-1',
    lessonId: 'js-arrays',
    title: 'JavaScript Basics Quiz',
    description: 'Test your JavaScript knowledge.',
    timeLimit: 400,
    passingScore: 70,
    xpReward: 75,
    coinReward: 35,
    questions: [
      {
        id: 'jq1',
        type: 'multiple_choice',
        question: 'What is the output of: console.log(typeof [])?',
        options: ['array', 'object', 'undefined', 'list'],
        correctAnswer: 1,
        explanation: 'In JavaScript, arrays are a type of object. typeof [] returns "object".',
        difficulty: 'medium'
      },
      {
        id: 'jq2',
        type: 'multiple_choice',
        question: 'Which keyword declares a constant variable?',
        options: ['var', 'let', 'const', 'fixed'],
        correctAnswer: 2,
        explanation: 'const declares a variable that cannot be reassigned.',
        difficulty: 'easy'
      },
      {
        id: 'jq3',
        type: 'multiple_choice',
        question: 'What does [1, 2, 3].map(x => x * 2) return?',
        options: ['[1, 4, 9]', '[2, 4, 6]', '[1, 2, 3]', 'undefined'],
        correctAnswer: 1,
        explanation: 'map() transforms each element. 1*2=2, 2*2=4, 3*2=6.',
        difficulty: 'easy'
      },
      {
        id: 'jq4',
        type: 'multiple_choice',
        question: 'What is the result of "5" + 3 in JavaScript?',
        options: ['8', '53', 'NaN', 'Error'],
        correctAnswer: 1,
        explanation: 'The + operator with a string causes concatenation: "5" + 3 = "53".',
        difficulty: 'medium'
      },
      {
        id: 'jq5',
        type: 'multiple_choice',
        question: 'Which method adds an element to the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 0,
        explanation: 'push() adds elements to the end. pop() removes from end.',
        difficulty: 'easy'
      },
      {
        id: 'jq6',
        type: 'multiple_choice',
        question: 'What is a closure in JavaScript?',
        options: ['A way to close the browser', 'A function with access to outer scope', 'A type of loop', 'An error handler'],
        correctAnswer: 1,
        explanation: 'A closure is a function that retains access to its outer scope even after the outer function returns.',
        difficulty: 'hard'
      }
    ]
  }
];

export const getQuizByLessonId = (lessonId: string) => {
  return quizzes.find(q => q.lessonId === lessonId);
};

export const getQuizById = (id: string) => {
  return quizzes.find(q => q.id === id);
};
