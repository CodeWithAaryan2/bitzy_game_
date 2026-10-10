import type { Challenge } from '@/types';

export const challenges: Challenge[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    slug: 'two-sum',
    description: 'Given an array of integers and a target, return indices of two numbers that add up to target.',
    difficulty: 'Easy',
    category: 'Arrays',
    tags: ['array', 'hash-map', 'beginner'],
    problemStatement: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: `- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].' }
    ],
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  // Your code here\n  \n}',
      python: 'def two_sum(nums, target):\n    # Your code here\n    pass',
      typescript: 'function twoSum(nums: number[], target: number): number[] {\n  // Your code here\n  \n}'
    },
    testCases: [
      { id: '1', input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false, isExample: true, explanation: 'Basic case' },
      { id: '2', input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false, isExample: true, explanation: 'Not the first match' },
      { id: '3', input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: false, isExample: true, explanation: 'Same values' },
      { id: '4', input: '[1,2,3,4,5]\n8', expectedOutput: '[2,4]', isHidden: true, isExample: false },
      { id: '5', input: '[-1,-2,-3,-4,-5]\n-8', expectedOutput: '[2,4]', isHidden: true, isExample: false },
      { id: '6', input: '[0,4,3,0]\n0', expectedOutput: '[0,3]', isHidden: true, isExample: false }
    ],
    hints: [
      { id: '1', hintText: 'A brute force solution would check every pair of numbers. Can you think of a more efficient approach?', order: 1, xpCost: 5 },
      { id: '2', hintText: 'Consider using a hash map to store numbers you\'ve seen. For each number, check if (target - current) exists in the map.', order: 2, xpCost: 10 },
      { id: '3', hintText: 'Time complexity: O(n) with a single pass. Space: O(n) for the hash map.', order: 3, xpCost: 15 }
    ],
    xpReward: 50,
    coinReward: 25,
    solveCount: 12453,
    attemptCount: 28764
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    slug: 'reverse-string',
    description: 'Write a function that reverses a string.',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['string', 'two-pointers', 'beginner'],
    problemStatement: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    constraints: `- 1 <= s.length <= 10^5\n- s[i] is a printable ASCII character.`,
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: 'The string "hello" reversed is "olleh".' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: 'The string "Hannah" reversed is "hannaH".' }
    ],
    starterCode: {
      javascript: 'function reverseString(s) {\n  // Your code here\n  \n}',
      python: 'def reverse_string(s):\n    # Your code here\n    pass',
      typescript: 'function reverseString(s: string[]): void {\n  // Your code here\n  \n}'
    },
    testCases: [
      { id: '1', input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false, isExample: true, explanation: 'Basic case' },
      { id: '2', input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false, isExample: true, explanation: 'Mixed case' },
      { id: '3', input: '["a"]', expectedOutput: '["a"]', isHidden: true, isExample: false },
      { id: '4', input: '["A","B","C","D","E"]', expectedOutput: '["E","D","C","B","A"]', isHidden: true, isExample: false }
    ],
    hints: [
      { id: '1', hintText: 'Use two pointers: one at the start, one at the end. Swap and move inward.', order: 1, xpCost: 5 },
      { id: '2', hintText: 'Continue swapping until the pointers meet or cross each other.', order: 2, xpCost: 10 }
    ],
    xpReward: 40,
    coinReward: 20,
    solveCount: 9823,
    attemptCount: 15432
  },
  {
    id: 'fizz-buzz',
    title: 'Fizz Buzz',
    slug: 'fizz-buzz',
    description: 'The classic programming interview question.',
    difficulty: 'Easy',
    category: 'Numbers',
    tags: ['math', 'loop', 'beginner'],
    problemStatement: `Given an integer \`n\`, return a string array answer where:

- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
- answer[i] == "Fizz" if i is divisible by 3.
- answer[i] == "Buzz" if i is divisible by 5.
- answer[i] == i (as a string) if none of the above conditions are true.`,
    constraints: '- 1 <= n <= 10^4',
    examples: [
      { input: 'n = 3', output: '["1","2","Fizz"]', explanation: '3 is divisible by 3, so "Fizz".' },
      { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]', explanation: '3 → Fizz, 5 → Buzz.' },
      { input: 'n = 15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', explanation: '15 is divisible by both 3 and 5.' }
    ],
    starterCode: {
      javascript: 'function fizzBuzz(n) {\n  // Your code here\n  \n}',
      python: 'def fizz_buzz(n):\n    # Your code here\n    pass',
      typescript: 'function fizzBuzz(n: number): string[] {\n  // Your code here\n  \n}'
    },
    testCases: [
      { id: '1', input: '3', expectedOutput: '["1","2","Fizz"]', isHidden: false, isExample: true, explanation: 'Basic case' },
      { id: '2', input: '5', expectedOutput: '["1","2","Fizz","4","Buzz"]', isHidden: false, isExample: true, explanation: 'Buzz case' },
      { id: '3', input: '15', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isHidden: false, isExample: true, explanation: 'FizzBuzz case' },
      { id: '4', input: '1', expectedOutput: '["1"]', isHidden: true, isExample: false },
      { id: '5', input: '30', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz","16","17","Fizz","19","Buzz","Fizz","22","23","Fizz","Buzz","26","Fizz","28","29","FizzBuzz"]', isHidden: true, isExample: false }
    ],
    hints: [
      { id: '1', hintText: 'Loop from 1 to n. Use the modulo operator % to check divisibility.', order: 1, xpCost: 5 },
      { id: '2', hintText: 'Check divisibility by 15 first (both 3 and 5), then 3, then 5.', order: 2, xpCost: 10 }
    ],
    xpReward: 35,
    coinReward: 18,
    solveCount: 15234,
    attemptCount: 19876
  },
  {
    id: 'palindrome-check',
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    description: 'Check if a string is a palindrome, considering only alphanumeric characters.',
    difficulty: 'Easy',
    category: 'Strings',
    tags: ['string', 'two-pointers', 'beginner'],
    problemStatement: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.`,
    constraints: '- 1 <= s.length <= 2 * 10^5',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' },
      { input: 's = " "', output: 'true', explanation: 'After removing non-alphanumeric, s is empty which reads the same forward and backward.' }
    ],
    starterCode: {
      javascript: 'function isPalindrome(s) {\n  // Your code here\n  \n}',
      python: 'def is_palindrome(s):\n    # Your code here\n    pass',
      typescript: 'function isPalindrome(s: string): boolean {\n  // Your code here\n  \n}'
    },
    testCases: [
      { id: '1', input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false, isExample: true, explanation: 'Classic palindrome' },
      { id: '2', input: '"race a car"', expectedOutput: 'false', isHidden: false, isExample: true, explanation: 'Not a palindrome' },
      { id: '3', input: '" "', expectedOutput: 'true', isHidden: false, isExample: true, explanation: 'Empty after filtering' },
      { id: '4', input: '"0P"', expectedOutput: 'false', isHidden: true, isExample: false },
      { id: '5', input: '"Was it a car or a cat I saw?"', expectedOutput: 'true', isHidden: true, isExample: false }
    ],
    hints: [
      { id: '1', hintText: 'Filter out non-alphanumeric characters and convert to lowercase first.', order: 1, xpCost: 5 },
      { id: '2', hintText: 'Then compare the filtered string with its reverse, or use two pointers from both ends.', order: 2, xpCost: 10 }
    ],
    xpReward: 45,
    coinReward: 22,
    solveCount: 11234,
    attemptCount: 18765
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    slug: 'binary-search',
    description: 'Search for a target value in a sorted array using binary search.',
    difficulty: 'Medium',
    category: 'Algorithms',
    tags: ['array', 'binary-search', 'algorithm'],
    problemStatement: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    constraints: '- 1 <= nums.length <= 10^4\n- -10^4 < nums[i], target < 10^4\n- All the integers in nums are unique.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1.' }
    ],
    starterCode: {
      javascript: 'function search(nums, target) {\n  // Your code here\n  \n}',
      python: 'def search(nums, target):\n    # Your code here\n    pass',
      typescript: 'function search(nums: number[], target: number): number {\n  // Your code here\n  \n}'
    },
    testCases: [
      { id: '1', input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4', isHidden: false, isExample: true, explanation: 'Target found' },
      { id: '2', input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1', isHidden: false, isExample: true, explanation: 'Target not found' },
      { id: '3', input: '[5]\n5', expectedOutput: '0', isHidden: true, isExample: false },
      { id: '4', input: '[1,2,3,4,5,6,7,8,9,10]\n7', expectedOutput: '6', isHidden: true, isExample: false },
      { id: '5', input: '[1,2,3,4,5]\n6', expectedOutput: '-1', isHidden: true, isExample: false }
    ],
    hints: [
      { id: '1', hintText: 'Instead of checking every element, repeatedly divide the search interval in half.', order: 1, xpCost: 10 },
      { id: '2', hintText: 'Compare target with the middle element. If target is smaller, search the left half. Otherwise, search the right half.', order: 2, xpCost: 15 },
      { id: '3', hintText: 'Use left and right pointers. While left <= right, calculate mid = Math.floor((left + right) / 2).', order: 3, xpCost: 20 }
    ],
    xpReward: 100,
    coinReward: 50,
    solveCount: 8234,
    attemptCount: 14235
  },
  {
    id: 'merge-sorted-arrays',
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    description: 'Merge two sorted linked lists and return it as a new sorted list.',
    difficulty: 'Medium',
    category: 'Data Structures',
    tags: ['linked-list', 'recursion', 'merge'],
    problemStatement: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
    constraints: '- The number of nodes in both lists is in the range [0, 50].\n- -100 <= Node.val <= 100\n- Both list1 and list2 are sorted in non-decreasing order.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: 'Merged sorted list.' },
      { input: 'list1 = [], list2 = []', output: '[]', explanation: 'Both empty.' },
      { input: 'list1 = [], list2 = [0]', output: '[0]', explanation: 'One empty.' }
    ],
    starterCode: {
      javascript: 'function mergeTwoLists(list1, list2) {\n  // Your code here\n  \n}',
      python: 'def merge_two_lists(list1, list2):\n    # Your code here\n    pass',
      typescript: 'function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n  // Your code here\n  \n}'
    },
    testCases: [
      { id: '1', input: '[1,2,4]\n[1,3,4]', expectedOutput: '[1,1,2,3,4,4]', isHidden: false, isExample: true, explanation: 'Standard merge' },
      { id: '2', input: '[]\n[]', expectedOutput: '[]', isHidden: false, isExample: true, explanation: 'Both empty' },
      { id: '3', input: '[]\n[0]', expectedOutput: '[0]', isHidden: false, isExample: true, explanation: 'One empty' },
      { id: '4', input: '[1,3,5]\n[2,4,6]', expectedOutput: '[1,2,3,4,5,6]', isHidden: true, isExample: false },
      { id: '5', input: '[1,2,3]\n[4,5,6]', expectedOutput: '[1,2,3,4,5,6]', isHidden: true, isExample: false }
    ],
    hints: [
      { id: '1', hintText: 'Compare the heads of both lists. Take the smaller one and attach the result of merging the rest.', order: 1, xpCost: 10 },
      { id: '2', hintText: 'This can be solved recursively: the merged list starts with the smaller head, followed by the merge of the remaining lists.', order: 2, xpCost: 15 },
      { id: '3', hintText: 'Iterative approach: create a dummy node, use a pointer to build the list by comparing nodes from both lists.', order: 3, xpCost: 20 }
    ],
    xpReward: 100,
    coinReward: 50,
    solveCount: 6234,
    attemptCount: 11235
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring',
    description: 'Find the length of the longest substring without repeating characters.',
    difficulty: 'Medium',
    category: 'Strings',
    tags: ['string', 'sliding-window', 'hash-set'],
    problemStatement: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    constraints: '- 0 <= s.length <= 5 * 10^4',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' }
    ],
    starterCode: {
      javascript: 'function lengthOfLongestSubstring(s) {\n  // Your code here\n  \n}',
      python: 'def length_of_longest_substring(s):\n    # Your code here\n    pass',
      typescript: 'function lengthOfLongestSubstring(s: string): number {\n  // Your code here\n  \n}'
    },
    testCases: [
      { id: '1', input: '"abcabcbb"', expectedOutput: '3', isHidden: false, isExample: true, explanation: 'abc' },
      { id: '2', input: '"bbbbb"', expectedOutput: '1', isHidden: false, isExample: true, explanation: 'b' },
      { id: '3', input: '"pwwkew"', expectedOutput: '3', isHidden: false, isExample: true, explanation: 'wke' },
      { id: '4', input: '""', expectedOutput: '0', isHidden: true, isExample: false },
      { id: '5', input: '"dvdf"', expectedOutput: '3', isHidden: true, isExample: false },
      { id: '6', input: '"anviaj"', expectedOutput: '5', isHidden: true, isExample: false }
    ],
    hints: [
      { id: '1', hintText: 'The brute force approach checks all substrings. Can you use a sliding window to optimize?', order: 1, xpCost: 10 },
      { id: '2', hintText: 'Use a Set to track characters in the current window. Expand the window from the right, shrink from the left when you find a duplicate.', order: 2, xpCost: 15 },
      { id: '3', hintText: 'Time: O(n), Space: O(min(m,n)) where m is the charset size.', order: 3, xpCost: 20 }
    ],
    xpReward: 120,
    coinReward: 60,
    solveCount: 5234,
    attemptCount: 10235
  }
];

export const getChallengeBySlug = (slug: string) => {
  return challenges.find(c => c.slug === slug);
};

// DB challenge_id column is INTEGER — map slug -> stable numeric id via array position
export function getChallengeNumericId(slugOrId: string | number): number {
  const idx = challenges.findIndex(c => c.id === slugOrId);
  return idx >= 0 ? idx + 1 : 0;
}
