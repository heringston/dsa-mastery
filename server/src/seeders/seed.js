const { sequelize, Topic, Pattern, Problem, ProblemPattern, TestCase } = require('../models');

/**
 * Seed script — populates the database with:
 * - 16 topics
 * - 16 patterns
 * - ~40 problems with realistic test cases AND codeConfiguration
 *
 * codeConfiguration structure per language:
 * {
 *   functionName: string,
 *   params: [{ name: string, type: string }],
 *   returnType: string,
 *   template: string  // Starter code shown to the user
 * }
 *
 * Run with: npm run seed
 */

const TOPICS = [
  { name: 'Arrays', slug: 'arrays' },
  { name: 'Strings', slug: 'strings' },
  { name: 'Hashing', slug: 'hashing' },
  { name: 'Two Pointers', slug: 'two-pointers' },
  { name: 'Sliding Window', slug: 'sliding-window' },
  { name: 'Binary Search', slug: 'binary-search' },
  { name: 'Stack', slug: 'stack' },
  { name: 'Queue', slug: 'queue' },
  { name: 'Linked List', slug: 'linked-list' },
  { name: 'Trees', slug: 'trees' },
  { name: 'Graphs', slug: 'graphs' },
  { name: 'Heap', slug: 'heap' },
  { name: 'Greedy', slug: 'greedy' },
  { name: 'Dynamic Programming', slug: 'dynamic-programming' },
  { name: 'Sorting', slug: 'sorting' },
  { name: 'Matrix', slug: 'matrix' }
];

const PATTERNS = [
  { name: 'Two Pointers', slug: 'two-pointers' },
  { name: 'Sliding Window', slug: 'sliding-window' },
  { name: 'Fast & Slow Pointers', slug: 'fast-slow-pointers' },
  { name: 'Merge Intervals', slug: 'merge-intervals' },
  { name: 'Cyclic Sort', slug: 'cyclic-sort' },
  { name: 'BFS', slug: 'bfs' },
  { name: 'DFS', slug: 'dfs' },
  { name: 'Binary Search', slug: 'binary-search' },
  { name: 'Monotonic Stack', slug: 'monotonic-stack' },
  { name: 'Top K Elements', slug: 'top-k-elements' },
  { name: 'HashMap', slug: 'hashmap' },
  { name: 'Prefix Sum', slug: 'prefix-sum' },
  { name: 'Backtracking', slug: 'backtracking' },
  { name: 'Greedy', slug: 'greedy' },
  { name: 'Tabulation', slug: 'tabulation' },
  { name: 'Memoization', slug: 'memoization' }
];

// Helper to make code config for a problem
function makeConfig(functionName, params, returnType, javaBody, pythonBody, cppBody) {
  return {
    java: {
      functionName, params, returnType,
      template: `class Solution {\n    public ${javaReturnType(returnType)} ${functionName}(${javaParams(params)}) {\n        ${javaBody}\n    }\n}`
    },
    python: {
      functionName, params, returnType,
      template: `class Solution:\n    def ${functionName}(self, ${pythonParams(params)}):\n        ${pythonBody}`
    },
    cpp: {
      functionName, params, returnType,
      template: `class Solution {\npublic:\n    ${cppReturnType(returnType)} ${functionName}(${cppParams(params)}) {\n        ${cppBody}\n    }\n};`
    }
  };
}

function javaReturnType(t) {
  const m = { 'int': 'int', 'long': 'long', 'double': 'double', 'boolean': 'boolean', 'string': 'String', 'int[]': 'int[]', 'string[]': 'String[]', 'void': 'void' };
  return m[t] || t;
}

function javaParams(params) {
  return params.map(p => `${javaReturnType(p.type)} ${p.name}`).join(', ');
}

function pythonParams(params) {
  return params.map(p => p.name).join(', ');
}

function cppReturnType(t) {
  const m = { 'int': 'int', 'long': 'long long', 'double': 'double', 'boolean': 'bool', 'string': 'string', 'int[]': 'vector<int>', 'string[]': 'vector<string>', 'void': 'void' };
  return m[t] || t;
}

function cppParams(params) {
  return params.map(p => `${cppReturnType(p.type)} ${p.name}`).join(', ');
}

const PROBLEMS = [
  // ===== ARRAYS =====
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the answer in any order.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers\n- Line 3: target integer',
    difficulty: 'EASY',
    topicSlug: 'arrays',
    patternSlugs: ['hashmap'],
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
    sampleInput: '4\n2 7 11 15\n9',
    sampleOutput: '0 1',
    explanation: 'nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1].',
    codeConfiguration: makeConfig('twoSum',
      [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
      'int[]',
      '// Write your solution here\n        return new int[]{};',
      '# Write your solution here\n        return []',
      '// Write your solution here\n        return {};'
    ),
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isSample: true },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isSample: false },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isSample: false },
      { input: '5\n1 5 3 7 2\n8', expectedOutput: '0 3', isSample: false },
    ]
  },
  {
    title: 'Maximum Subarray',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers',
    difficulty: 'MEDIUM',
    topicSlug: 'arrays',
    patternSlugs: ['prefix-sum'],
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    sampleInput: '9\n-2 1 -3 4 -1 2 1 -5 4',
    sampleOutput: '6',
    explanation: 'The subarray [4,-1,2,1] has the largest sum = 6.',
    codeConfiguration: makeConfig('maxSubArray',
      [{ name: 'nums', type: 'int[]' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isSample: true },
      { input: '1\n1', expectedOutput: '1', isSample: false },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isSample: false },
      { input: '3\n-1 -2 -3', expectedOutput: '-1', isSample: false },
    ]
  },
  {
    title: 'Product of Array Except Self',
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers',
    difficulty: 'MEDIUM',
    topicSlug: 'arrays',
    patternSlugs: ['prefix-sum'],
    constraints: '2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30',
    sampleInput: '4\n1 2 3 4',
    sampleOutput: '24 12 8 6',
    explanation: 'For each index, multiply all other elements. answer[0] = 2*3*4 = 24.',
    codeConfiguration: makeConfig('productExceptSelf',
      [{ name: 'nums', type: 'int[]' }],
      'int[]',
      '// Write your solution here\n        return new int[nums.length];',
      '# Write your solution here\n        return [0] * len(nums)',
      '// Write your solution here\n        return vector<int>(nums.size());'
    ),
    testCases: [
      { input: '4\n1 2 3 4', expectedOutput: '24 12 8 6', isSample: true },
      { input: '5\n-1 1 0 -3 3', expectedOutput: '0 0 9 0 0', isSample: false },
      { input: '3\n2 3 4', expectedOutput: '12 8 6', isSample: false },
    ]
  },

  // ===== STRINGS =====
  {
    title: 'Valid Anagram',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nInput format:\n- Line 1: string s\n- Line 2: string t',
    difficulty: 'EASY',
    topicSlug: 'strings',
    patternSlugs: ['hashmap'],
    constraints: '1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.',
    sampleInput: 'anagram\nnagaram',
    sampleOutput: 'true',
    explanation: '"nagaram" is an anagram of "anagram" since both contain the same characters.',
    codeConfiguration: makeConfig('isAnagram',
      [{ name: 's', type: 'string' }, { name: 't', type: 'string' }],
      'boolean',
      '// Write your solution here\n        return false;',
      '# Write your solution here\n        return False',
      '// Write your solution here\n        return false;'
    ),
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true', isSample: true },
      { input: 'rat\ncar', expectedOutput: 'false', isSample: true },
      { input: 'listen\nsilent', expectedOutput: 'true', isSample: false },
      { input: 'hello\nworld', expectedOutput: 'false', isSample: false },
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.\n\nInput format:\n- Line 1: string s',
    difficulty: 'MEDIUM',
    topicSlug: 'strings',
    patternSlugs: ['sliding-window', 'hashmap'],
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    sampleInput: 'abcabcbb',
    sampleOutput: '3',
    explanation: 'The answer is "abc", with the length of 3.',
    codeConfiguration: makeConfig('lengthOfLongestSubstring',
      [{ name: 's', type: 'string' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3', isSample: true },
      { input: 'bbbbb', expectedOutput: '1', isSample: false },
      { input: 'pwwkew', expectedOutput: '3', isSample: false },
      { input: '', expectedOutput: '0', isSample: false },
      { input: 'abcdef', expectedOutput: '6', isSample: false },
    ]
  },
  {
    title: 'Longest Palindromic Substring',
    description: 'Given a string s, return the longest palindromic substring in s.\n\nInput format:\n- Line 1: string s',
    difficulty: 'MEDIUM',
    topicSlug: 'strings',
    patternSlugs: ['two-pointers'],
    constraints: '1 <= s.length <= 1000\ns consist of only digits and English letters.',
    sampleInput: 'babad',
    sampleOutput: 'bab',
    explanation: '"aba" is also a valid answer.',
    codeConfiguration: makeConfig('longestPalindrome',
      [{ name: 's', type: 'string' }],
      'string',
      '// Write your solution here\n        return "";',
      '# Write your solution here\n        return ""',
      '// Write your solution here\n        return "";'
    ),
    testCases: [
      { input: 'babad', expectedOutput: 'bab', isSample: true },
      { input: 'cbbd', expectedOutput: 'bb', isSample: false },
      { input: 'a', expectedOutput: 'a', isSample: false },
      { input: 'racecar', expectedOutput: 'racecar', isSample: false },
    ]
  },

  // ===== HASHING =====
  {
    title: 'Contains Duplicate',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers',
    difficulty: 'EASY',
    topicSlug: 'hashing',
    patternSlugs: ['hashmap'],
    constraints: '1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
    sampleInput: '4\n1 2 3 1',
    sampleOutput: 'true',
    explanation: '1 appears twice in the array.',
    codeConfiguration: makeConfig('containsDuplicate',
      [{ name: 'nums', type: 'int[]' }],
      'boolean',
      '// Write your solution here\n        return false;',
      '# Write your solution here\n        return False',
      '// Write your solution here\n        return false;'
    ),
    testCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true', isSample: true },
      { input: '4\n1 2 3 4', expectedOutput: 'false', isSample: true },
      { input: '10\n1 1 1 3 3 4 3 2 4 2', expectedOutput: 'true', isSample: false },
    ]
  },

  // ===== TWO POINTERS =====
  {
    title: 'Valid Palindrome',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.\n\nInput format:\n- Line 1: string s',
    difficulty: 'EASY',
    topicSlug: 'two-pointers',
    patternSlugs: ['two-pointers'],
    constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    sampleInput: 'A man, a plan, a canal: Panama',
    sampleOutput: 'true',
    explanation: '"amanaplanacanalpanama" is a palindrome.',
    codeConfiguration: makeConfig('isPalindrome',
      [{ name: 's', type: 'string' }],
      'boolean',
      '// Write your solution here\n        return false;',
      '# Write your solution here\n        return False',
      '// Write your solution here\n        return false;'
    ),
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isSample: true },
      { input: 'race a car', expectedOutput: 'false', isSample: true },
      { input: ' ', expectedOutput: 'true', isSample: false },
      { input: 'abba', expectedOutput: 'true', isSample: false },
    ]
  },
  {
    title: 'Container With Most Water',
    description: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers (heights)',
    difficulty: 'MEDIUM',
    topicSlug: 'two-pointers',
    patternSlugs: ['two-pointers'],
    constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4',
    sampleInput: '9\n1 8 6 2 5 4 8 3 7',
    sampleOutput: '49',
    explanation: 'The lines at index 1 and 8 form the container with max area = min(8,7) * (8-1) = 49.',
    codeConfiguration: makeConfig('maxArea',
      [{ name: 'height', type: 'int[]' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49', isSample: true },
      { input: '2\n1 1', expectedOutput: '1', isSample: false },
      { input: '3\n4 3 2', expectedOutput: '4', isSample: false },
    ]
  },
  {
    title: '3Sum',
    description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nThe solution set must not contain duplicate triplets. Output each triplet on a separate line, space-separated.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers',
    difficulty: 'MEDIUM',
    topicSlug: 'two-pointers',
    patternSlugs: ['two-pointers'],
    constraints: '3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5',
    sampleInput: '6\n-1 0 1 2 -1 -4',
    sampleOutput: '-1 -1 2\n-1 0 1',
    explanation: 'nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0.',
    // 3Sum returns void (prints directly) since it has multi-line output
    codeConfiguration: null,
    testCases: [
      { input: '6\n-1 0 1 2 -1 -4', expectedOutput: '-1 -1 2\n-1 0 1', isSample: true },
      { input: '3\n0 1 1', expectedOutput: '', isSample: false },
      { input: '3\n0 0 0', expectedOutput: '0 0 0', isSample: false },
    ]
  },

  // ===== SLIDING WINDOW =====
  {
    title: 'Maximum Average Subarray I',
    description: 'You are given an integer array nums consisting of n elements, and an integer k.\n\nFind a contiguous subarray whose length is equal to k that has the maximum average value and return this value.\n\nInput format:\n- Line 1: n and k, space-separated\n- Line 2: n space-separated integers',
    difficulty: 'EASY',
    topicSlug: 'sliding-window',
    patternSlugs: ['sliding-window'],
    constraints: 'n == nums.length\n1 <= k <= n <= 10^5\n-10^4 <= nums[i] <= 10^4',
    sampleInput: '6 4\n1 12 -5 -6 50 3',
    sampleOutput: '12.75',
    explanation: 'Maximum average is (12 + (-5) + (-6) + 50) / 4 = 51/4 = 12.75',
    // Uses stdin/stdout directly since it reads n and k on same line
    codeConfiguration: null,
    testCases: [
      { input: '6 4\n1 12 -5 -6 50 3', expectedOutput: '12.75', isSample: true },
      { input: '1 1\n5', expectedOutput: '5.0', isSample: false },
      { input: '5 3\n0 1 1 3 3', expectedOutput: '2.33', isSample: false },
    ]
  },
  {
    title: 'Minimum Size Subarray Sum',
    description: 'Given an array of positive integers nums and a positive integer target, return the minimal length of a subarray whose sum is greater than or equal to target. If there is no such subarray, return 0 instead.\n\nInput format:\n- Line 1: target\n- Line 2: n (size of array)\n- Line 3: n space-separated integers',
    difficulty: 'MEDIUM',
    topicSlug: 'sliding-window',
    patternSlugs: ['sliding-window'],
    constraints: '1 <= target <= 10^9\n1 <= nums.length <= 10^5\n1 <= nums[i] <= 10^4',
    sampleInput: '7\n6\n2 3 1 2 4 3',
    sampleOutput: '2',
    explanation: 'The subarray [4,3] has the minimal length under the problem constraint.',
    codeConfiguration: makeConfig('minSubArrayLen',
      [{ name: 'target', type: 'int' }, { name: 'nums', type: 'int[]' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '7\n6\n2 3 1 2 4 3', expectedOutput: '2', isSample: true },
      { input: '4\n3\n1 1 1 1', expectedOutput: '3', isSample: false },
      { input: '11\n3\n1 2 3 4 5', expectedOutput: '1', isSample: false },
    ]
  },

  // ===== BINARY SEARCH =====
  {
    title: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers\n- Line 3: target integer',
    difficulty: 'EASY',
    topicSlug: 'binary-search',
    patternSlugs: ['binary-search'],
    constraints: '1 <= nums.length <= 10^4\nnums is sorted in ascending order.',
    sampleInput: '6\n-1 0 3 5 9 12\n9',
    sampleOutput: '4',
    explanation: '9 exists in nums and its index is 4.',
    codeConfiguration: makeConfig('search',
      [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
      'int',
      '// Write your solution here\n        return -1;',
      '# Write your solution here\n        return -1',
      '// Write your solution here\n        return -1;'
    ),
    testCases: [
      { input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', isSample: true },
      { input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', isSample: true },
      { input: '1\n5\n5', expectedOutput: '0', isSample: false },
      { input: '3\n1 2 3\n3', expectedOutput: '2', isSample: false },
    ]
  },
  {
    title: 'Search in Rotated Sorted Array',
    description: 'There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated at an unknown pivot index.\n\nGiven the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers\n- Line 3: target integer',
    difficulty: 'MEDIUM',
    topicSlug: 'binary-search',
    patternSlugs: ['binary-search'],
    constraints: '1 <= nums.length <= 5000\nAll values of nums are unique.',
    sampleInput: '7\n4 5 6 7 0 1 2\n0',
    sampleOutput: '4',
    explanation: '0 is found at index 4.',
    codeConfiguration: makeConfig('search',
      [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
      'int',
      '// Write your solution here\n        return -1;',
      '# Write your solution here\n        return -1',
      '// Write your solution here\n        return -1;'
    ),
    testCases: [
      { input: '7\n4 5 6 7 0 1 2\n0', expectedOutput: '4', isSample: true },
      { input: '7\n4 5 6 7 0 1 2\n3', expectedOutput: '-1', isSample: false },
      { input: '1\n1\n0', expectedOutput: '-1', isSample: false },
    ]
  },

  // ===== STACK =====
  {
    title: 'Valid Parentheses',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nInput format:\n- Line 1: string s',
    difficulty: 'EASY',
    topicSlug: 'stack',
    patternSlugs: ['monotonic-stack'],
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'.',
    sampleInput: '()[]{}',
    sampleOutput: 'true',
    explanation: 'All brackets are properly matched and ordered.',
    codeConfiguration: makeConfig('isValid',
      [{ name: 's', type: 'string' }],
      'boolean',
      '// Write your solution here\n        return false;',
      '# Write your solution here\n        return False',
      '// Write your solution here\n        return false;'
    ),
    testCases: [
      { input: '()[]{}', expectedOutput: 'true', isSample: true },
      { input: '(]', expectedOutput: 'false', isSample: true },
      { input: '()', expectedOutput: 'true', isSample: false },
      { input: '([)]', expectedOutput: 'false', isSample: false },
      { input: '{[]}', expectedOutput: 'true', isSample: false },
    ]
  },

  // ===== LINKED LIST =====
  {
    title: 'Reverse Linked List',
    description: 'Given a list of space-separated integers representing a singly linked list, reverse it.\n\nInput format:\n- Line 1: space-separated integers\n\nOutput: space-separated integers of the reversed list.',
    difficulty: 'EASY',
    topicSlug: 'linked-list',
    patternSlugs: ['two-pointers'],
    constraints: 'The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000',
    sampleInput: '1 2 3 4 5',
    sampleOutput: '5 4 3 2 1',
    explanation: 'The list 1->2->3->4->5 becomes 5->4->3->2->1 after reversal.',
    codeConfiguration: makeConfig('reverseList',
      [{ name: 'nums', type: 'int[]' }],
      'int[]',
      '// Reverse the array (simulates linked list reversal)\n        int[] result = new int[nums.length];\n        for (int i = 0; i < nums.length; i++) {\n            result[i] = nums[nums.length - 1 - i];\n        }\n        return result;',
      '# Reverse the list (simulates linked list reversal)\n        return nums[::-1]',
      '// Reverse the vector\n        vector<int> result(nums.rbegin(), nums.rend());\n        return result;'
    ),
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1', isSample: true },
      { input: '2\n1 2', expectedOutput: '2 1', isSample: false },
      { input: '1\n1', expectedOutput: '1', isSample: false },
    ]
  },
  {
    title: 'Merge Two Sorted Lists',
    description: 'You are given two sorted arrays list1 and list2. Merge them into one sorted array.\n\nInput format:\n- Line 1: list1 (space-separated integers)\n- Line 2: list2 (space-separated integers)\n\nOutput: Space-separated integers of the merged sorted list.',
    difficulty: 'EASY',
    topicSlug: 'linked-list',
    patternSlugs: ['two-pointers'],
    constraints: 'Both list1 and list2 are sorted in non-decreasing order.',
    sampleInput: '1 2 4\n1 3 4',
    sampleOutput: '1 1 2 3 4 4',
    explanation: 'Merging [1,2,4] and [1,3,4] gives [1,1,2,3,4,4].',
    codeConfiguration: null, // uses raw stdin
    testCases: [
      { input: '1 2 4\n1 3 4', expectedOutput: '1 1 2 3 4 4', isSample: true },
      { input: '\n', expectedOutput: '', isSample: false },
      { input: '\n0', expectedOutput: '0', isSample: false },
    ]
  },

  // ===== TREES =====
  {
    title: 'Maximum Depth of Binary Tree',
    description: 'Given the root of a binary tree as a level-order traversal (using "null" for empty nodes), return its maximum depth.\n\nInput format:\n- Line 1: level-order traversal (space-separated, "null" for empty)\n\nOutput: An integer representing the maximum depth.',
    difficulty: 'EASY',
    topicSlug: 'trees',
    patternSlugs: ['dfs'],
    constraints: 'The number of nodes in the tree is in the range [0, 10^4].',
    sampleInput: '3 9 20 null null 15 7',
    sampleOutput: '3',
    explanation: 'The tree has depth 3.',
    codeConfiguration: null, // tree problems use raw stdin for MVP
    testCases: [
      { input: '3 9 20 null null 15 7', expectedOutput: '3', isSample: true },
      { input: '1 null 2', expectedOutput: '2', isSample: false },
      { input: '1', expectedOutput: '1', isSample: false },
    ]
  },
  {
    title: 'Invert Binary Tree',
    description: 'Given the root of a binary tree (level-order), invert the tree and return its level-order traversal.\n\nInput format:\n- Line 1: level-order traversal (space-separated)\n\nOutput: Level-order traversal of the inverted tree.',
    difficulty: 'EASY',
    topicSlug: 'trees',
    patternSlugs: ['dfs'],
    constraints: 'The number of nodes in the tree is in the range [0, 100].',
    sampleInput: '4 2 7 1 3 6 9',
    sampleOutput: '4 7 2 9 6 3 1',
    explanation: 'Each left and right subtree is swapped.',
    codeConfiguration: null,
    testCases: [
      { input: '4 2 7 1 3 6 9', expectedOutput: '4 7 2 9 6 3 1', isSample: true },
      { input: '2 1 3', expectedOutput: '2 3 1', isSample: false },
    ]
  },
  {
    title: 'Validate Binary Search Tree',
    description: 'Given the root of a binary tree (level-order), determine if it is a valid BST.\n\nInput format:\n- Line 1: level-order traversal (space-separated, "null" for empty)\n\nOutput: "true" or "false".',
    difficulty: 'MEDIUM',
    topicSlug: 'trees',
    patternSlugs: ['dfs'],
    constraints: 'The number of nodes in the tree is in the range [1, 10^4].',
    sampleInput: '2 1 3',
    sampleOutput: 'true',
    explanation: 'The left child (1) is less than root (2), right child (3) is greater.',
    codeConfiguration: null,
    testCases: [
      { input: '2 1 3', expectedOutput: 'true', isSample: true },
      { input: '5 1 4 null null 3 6', expectedOutput: 'false', isSample: true },
      { input: '1', expectedOutput: 'true', isSample: false },
    ]
  },

  // ===== GRAPHS =====
  {
    title: 'Number of Islands',
    description: 'Given an m x n 2D binary grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nInput format:\n- Line 1: m and n\n- Next m lines: the grid rows (characters without spaces)',
    difficulty: 'MEDIUM',
    topicSlug: 'graphs',
    patternSlugs: ['bfs', 'dfs'],
    constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300',
    sampleInput: '4 5\n11110\n11010\n11000\n00000',
    sampleOutput: '1',
    explanation: 'All 1s are connected, forming a single island.',
    codeConfiguration: null,
    testCases: [
      { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1', isSample: true },
      { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3', isSample: false },
      { input: '1 1\n1', expectedOutput: '1', isSample: false },
    ]
  },
  {
    title: 'Course Schedule',
    description: 'There are numCourses courses labeled from 0 to numCourses-1. Given prerequisite pairs, return true if you can finish all courses.\n\nInput format:\n- Line 1: numCourses\n- Line 2: number of prerequisites\n- Next lines: prerequisite pairs (course dependency)',
    difficulty: 'MEDIUM',
    topicSlug: 'graphs',
    patternSlugs: ['bfs', 'dfs'],
    constraints: '1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000',
    sampleInput: '2\n1\n1 0',
    sampleOutput: 'true',
    explanation: 'To take course 1 you must take course 0. This is possible.',
    codeConfiguration: null,
    testCases: [
      { input: '2\n1\n1 0', expectedOutput: 'true', isSample: true },
      { input: '2\n2\n1 0\n0 1', expectedOutput: 'false', isSample: true },
      { input: '3\n2\n1 0\n2 1', expectedOutput: 'true', isSample: false },
    ]
  },

  // ===== HEAP =====
  {
    title: 'Kth Largest Element in an Array',
    description: 'Given an integer array nums and an integer k, return the kth largest element in the array.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers\n- Line 3: k',
    difficulty: 'MEDIUM',
    topicSlug: 'heap',
    patternSlugs: ['top-k-elements'],
    constraints: '1 <= k <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    sampleInput: '6\n3 2 1 5 6 4\n2',
    sampleOutput: '5',
    explanation: 'The sorted array is [1,2,3,4,5,6]. The 2nd largest element is 5.',
    codeConfiguration: makeConfig('findKthLargest',
      [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '6\n3 2 1 5 6 4\n2', expectedOutput: '5', isSample: true },
      { input: '9\n3 2 3 1 2 4 5 5 6\n4', expectedOutput: '4', isSample: false },
    ]
  },
  {
    title: 'Top K Frequent Elements',
    description: 'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers\n- Line 3: k',
    difficulty: 'MEDIUM',
    topicSlug: 'heap',
    patternSlugs: ['top-k-elements', 'hashmap'],
    constraints: '1 <= nums.length <= 10^5\nk is in the range [1, the number of unique elements].',
    sampleInput: '6\n1 1 1 2 2 3\n2',
    sampleOutput: '1 2',
    explanation: '1 appears 3 times, 2 appears 2 times. The top 2 frequent are [1, 2].',
    codeConfiguration: makeConfig('topKFrequent',
      [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
      'int[]',
      '// Write your solution here\n        return new int[]{};',
      '# Write your solution here\n        return []',
      '// Write your solution here\n        return {};'
    ),
    testCases: [
      { input: '6\n1 1 1 2 2 3\n2', expectedOutput: '1 2', isSample: true },
      { input: '1\n1\n1', expectedOutput: '1', isSample: false },
    ]
  },

  // ===== GREEDY =====
  {
    title: 'Jump Game',
    description: 'You are given an integer array nums. You are initially positioned at the array\'s first index, and each element represents your maximum jump length at that position.\n\nReturn true if you can reach the last index, or false otherwise.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers',
    difficulty: 'MEDIUM',
    topicSlug: 'greedy',
    patternSlugs: ['greedy'],
    constraints: '1 <= nums.length <= 10^4\n0 <= nums[i] <= 10^5',
    sampleInput: '5\n2 3 1 1 4',
    sampleOutput: 'true',
    explanation: 'Jump 1 step from index 0 to 1, then 3 steps to the last index.',
    codeConfiguration: makeConfig('canJump',
      [{ name: 'nums', type: 'int[]' }],
      'boolean',
      '// Write your solution here\n        return false;',
      '# Write your solution here\n        return False',
      '// Write your solution here\n        return false;'
    ),
    testCases: [
      { input: '5\n2 3 1 1 4', expectedOutput: 'true', isSample: true },
      { input: '5\n3 2 1 0 4', expectedOutput: 'false', isSample: true },
      { input: '1\n0', expectedOutput: 'true', isSample: false },
    ]
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy and a different day in the future to sell.\n\nReturn the maximum profit. If no profit, return 0.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers',
    difficulty: 'EASY',
    topicSlug: 'greedy',
    patternSlugs: ['greedy'],
    constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
    sampleInput: '6\n7 1 5 3 6 4',
    sampleOutput: '5',
    explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
    codeConfiguration: makeConfig('maxProfit',
      [{ name: 'prices', type: 'int[]' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5', isSample: true },
      { input: '5\n7 6 4 3 1', expectedOutput: '0', isSample: true },
      { input: '2\n1 2', expectedOutput: '1', isSample: false },
    ]
  },

  // ===== DYNAMIC PROGRAMMING =====
  {
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nInput format:\n- Line 1: integer n',
    difficulty: 'EASY',
    topicSlug: 'dynamic-programming',
    patternSlugs: ['tabulation'],
    constraints: '1 <= n <= 45',
    sampleInput: '3',
    sampleOutput: '3',
    explanation: 'There are three ways to climb to the top: 1+1+1, 1+2, 2+1.',
    codeConfiguration: makeConfig('climbStairs',
      [{ name: 'n', type: 'int' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '3', expectedOutput: '3', isSample: true },
      { input: '2', expectedOutput: '2', isSample: true },
      { input: '5', expectedOutput: '8', isSample: false },
      { input: '10', expectedOutput: '89', isSample: false },
    ]
  },
  {
    title: 'Coin Change',
    description: 'Given an integer array coins representing denominations and an integer amount, return the fewest number of coins to make up that amount. If impossible, return -1.\n\nInput format:\n- Line 1: n (number of coin types)\n- Line 2: n space-separated integers (coin values)\n- Line 3: amount',
    difficulty: 'MEDIUM',
    topicSlug: 'dynamic-programming',
    patternSlugs: ['tabulation'],
    constraints: '1 <= coins.length <= 12\n0 <= amount <= 10^4',
    sampleInput: '3\n1 5 11\n11',
    sampleOutput: '1',
    explanation: '11 = 11, so only 1 coin is needed.',
    codeConfiguration: makeConfig('coinChange',
      [{ name: 'coins', type: 'int[]' }, { name: 'amount', type: 'int' }],
      'int',
      '// Write your solution here\n        return -1;',
      '# Write your solution here\n        return -1',
      '// Write your solution here\n        return -1;'
    ),
    testCases: [
      { input: '3\n1 5 11\n11', expectedOutput: '1', isSample: true },
      { input: '3\n1 2 5\n11', expectedOutput: '3', isSample: false },
      { input: '1\n2\n3', expectedOutput: '-1', isSample: false },
      { input: '1\n1\n0', expectedOutput: '0', isSample: false },
    ]
  },
  {
    title: 'Longest Increasing Subsequence',
    description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers',
    difficulty: 'MEDIUM',
    topicSlug: 'dynamic-programming',
    patternSlugs: ['tabulation', 'binary-search'],
    constraints: '1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4',
    sampleInput: '8\n10 9 2 5 3 7 101 18',
    sampleOutput: '4',
    explanation: 'The longest increasing subsequence is [2,3,7,101], its length is 4.',
    codeConfiguration: makeConfig('lengthOfLIS',
      [{ name: 'nums', type: 'int[]' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '8\n10 9 2 5 3 7 101 18', expectedOutput: '4', isSample: true },
      { input: '7\n0 1 0 3 2 3', expectedOutput: '4', isSample: false },
      { input: '6\n7 7 7 7 7 7', expectedOutput: '1', isSample: false },
    ]
  },
  {
    title: '0/1 Knapsack',
    description: 'Given weights and values of n items, put these items in a knapsack of capacity W to get the maximum total value.\n\nInput format:\n- Line 1: n and W\n- Line 2: weights\n- Line 3: values\n\nOutput: Maximum value.',
    difficulty: 'HARD',
    topicSlug: 'dynamic-programming',
    patternSlugs: ['tabulation', 'memoization'],
    constraints: '1 <= n <= 100\n1 <= W <= 1000',
    sampleInput: '3 50\n10 20 30\n60 100 120',
    sampleOutput: '220',
    explanation: 'Take items with weight 20 and 30 (total weight 50, value 100+120=220).',
    codeConfiguration: null, // complex input format, use raw stdin
    testCases: [
      { input: '3 50\n10 20 30\n60 100 120', expectedOutput: '220', isSample: true },
      { input: '4 7\n1 3 4 5\n1 4 5 7', expectedOutput: '9', isSample: false },
      { input: '1 1\n2\n3', expectedOutput: '0', isSample: false },
    ]
  },
  {
    title: 'Edit Distance',
    description: 'Given two strings word1 and word2, return the minimum number of operations (insert, delete, replace) required to convert word1 to word2.\n\nInput format:\n- Line 1: word1\n- Line 2: word2',
    difficulty: 'HARD',
    topicSlug: 'dynamic-programming',
    patternSlugs: ['tabulation'],
    constraints: '0 <= word1.length, word2.length <= 500',
    sampleInput: 'horse\nros',
    sampleOutput: '3',
    explanation: 'horse -> rorse -> rose -> ros. 3 operations.',
    codeConfiguration: makeConfig('minDistance',
      [{ name: 'word1', type: 'string' }, { name: 'word2', type: 'string' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: 'horse\nros', expectedOutput: '3', isSample: true },
      { input: 'intention\nexecution', expectedOutput: '5', isSample: false },
      { input: '\na', expectedOutput: '1', isSample: false },
    ]
  },

  // ===== SORTING =====
  {
    title: 'Merge Intervals',
    description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.\n\nInput format:\n- Line 1: n\n- Next n lines: start and end (space-separated)\n\nOutput: Merged intervals, one per line.',
    difficulty: 'MEDIUM',
    topicSlug: 'sorting',
    patternSlugs: ['merge-intervals'],
    constraints: '1 <= intervals.length <= 10^4',
    sampleInput: '4\n1 3\n2 6\n8 10\n15 18',
    sampleOutput: '1 6\n8 10\n15 18',
    explanation: 'Intervals [1,3] and [2,6] overlap, so they are merged to [1,6].',
    codeConfiguration: null,
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', isSample: true },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5', isSample: false },
      { input: '1\n1 1', expectedOutput: '1 1', isSample: false },
    ]
  },

  // ===== MATRIX =====
  {
    title: 'Spiral Matrix',
    description: 'Given an m x n matrix, return all elements in spiral order.\n\nInput format:\n- Line 1: m and n\n- Next m lines: matrix rows\n\nOutput: Space-separated elements in spiral order.',
    difficulty: 'MEDIUM',
    topicSlug: 'matrix',
    patternSlugs: ['two-pointers'],
    constraints: '1 <= m, n <= 10\n-100 <= matrix[i][j] <= 100',
    sampleInput: '3 3\n1 2 3\n4 5 6\n7 8 9',
    sampleOutput: '1 2 3 6 9 8 7 4 5',
    explanation: 'Spiral traversal: right, down, left, up, then inward.',
    codeConfiguration: null,
    testCases: [
      { input: '3 3\n1 2 3\n4 5 6\n7 8 9', expectedOutput: '1 2 3 6 9 8 7 4 5', isSample: true },
      { input: '3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12', expectedOutput: '1 2 3 4 8 12 11 10 9 5 6 7', isSample: false },
    ]
  },

  // ===== HARD PROBLEMS =====
  {
    title: 'Trapping Rain Water',
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\nInput format:\n- Line 1: n (size of array)\n- Line 2: n space-separated integers (heights)',
    difficulty: 'HARD',
    topicSlug: 'arrays',
    patternSlugs: ['two-pointers', 'monotonic-stack'],
    constraints: 'n == height.length\n1 <= n <= 2 * 10^4',
    sampleInput: '12\n0 1 0 2 1 0 1 3 2 1 2 1',
    sampleOutput: '6',
    explanation: '6 units of rain water are trapped between the bars.',
    codeConfiguration: makeConfig('trap',
      [{ name: 'height', type: 'int[]' }],
      'int',
      '// Write your solution here\n        return 0;',
      '# Write your solution here\n        return 0',
      '// Write your solution here\n        return 0;'
    ),
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6', isSample: true },
      { input: '6\n4 2 0 3 2 5', expectedOutput: '9', isSample: false },
    ]
  },
];


async function seed() {
  try {
    console.log('Starting seed...');

    // Sync database (force: true drops existing tables)
    await sequelize.sync({ force: true });
    console.log('Database synced (tables recreated)');

    // Seed topics
    const topics = await Topic.bulkCreate(TOPICS);
    const topicMap = {};
    topics.forEach(t => { topicMap[t.slug] = t.id; });
    console.log(`Seeded ${topics.length} topics`);

    // Seed patterns
    const patterns = await Pattern.bulkCreate(PATTERNS);
    const patternMap = {};
    patterns.forEach(p => { patternMap[p.slug] = p.id; });
    console.log(`Seeded ${patterns.length} patterns`);

    // Seed problems
    let problemCount = 0;
    let testCaseCount = 0;

    for (const p of PROBLEMS) {
      const problem = await Problem.create({
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        topicId: topicMap[p.topicSlug],
        constraints: p.constraints,
        sampleInput: p.sampleInput,
        sampleOutput: p.sampleOutput,
        explanation: p.explanation,
        codeConfiguration: p.codeConfiguration  // NEW: language-specific config
      });

      // Link patterns
      for (const patSlug of p.patternSlugs) {
        await ProblemPattern.create({
          problemId: problem.id,
          patternId: patternMap[patSlug]
        });
      }

      // Create test cases
      for (let i = 0; i < p.testCases.length; i++) {
        await TestCase.create({
          problemId: problem.id,
          input: p.testCases[i].input,
          expectedOutput: p.testCases[i].expectedOutput,
          isSample: p.testCases[i].isSample,
          orderIndex: i + 1
        });
        testCaseCount++;
      }
      problemCount++;
    }

    console.log(`Seeded ${problemCount} problems with ${testCaseCount} test cases`);
    console.log('Seed complete!');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    process.exit();
  }
}

seed();
