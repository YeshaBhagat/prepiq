/* ====================================================
   lib/practice-data.js
   Static question bank and scoring logic for:
   - Aptitude tests  (pages/api/practice/aptitude.js)
   - Technical quizzes (pages/api/practice/quiz.js)
   - Coding challenges (pages/api/practice/coding.js)
   ==================================================== */

// ─────────────────────────────────────────────────────────────────────────────
// APTITUDE TESTS
// ─────────────────────────────────────────────────────────────────────────────

const APTITUDE_DATA = {
  'Quantitative Aptitude': {
    title: 'Quantitative Aptitude',
    questions: [
      {
        id: 'qa1',
        question: 'A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/h?',
        options: ['30 km/h', '36 km/h', '40 km/h', '45 km/h'],
        answer: 1,
        explanation: 'Speed = 150/15 = 10 m/s = 10 × 3.6 = 36 km/h.',
      },
      {
        id: 'qa2',
        question: 'What is 15% of 240?',
        options: ['24', '36', '48', '32'],
        answer: 1,
        explanation: '15/100 × 240 = 36.',
      },
      {
        id: 'qa3',
        question: 'If A can do a work in 10 days and B in 15 days, in how many days can they finish together?',
        options: ['5', '6', '7', '8'],
        answer: 1,
        explanation: 'Combined rate = 1/10 + 1/15 = 1/6. So they finish in 6 days.',
      },
      {
        id: 'qa4',
        question: 'What is the simple interest on ₹5000 at 8% per annum for 3 years?',
        options: ['₹1000', '₹1200', '₹1400', '₹1600'],
        answer: 1,
        explanation: 'SI = (5000 × 8 × 3) / 100 = ₹1200.',
      },
      {
        id: 'qa5',
        question: 'Find the average of 12, 18, 24, 30, 36.',
        options: ['20', '22', '24', '26'],
        answer: 2,
        explanation: 'Sum = 120. Average = 120/5 = 24.',
      },
    ],
  },
  'Logical Reasoning': {
    title: 'Logical Reasoning',
    questions: [
      {
        id: 'lr1',
        question: 'Find the next number in the series: 2, 6, 12, 20, 30, __',
        options: ['40', '42', '44', '36'],
        answer: 1,
        explanation: 'Differences: 4, 6, 8, 10, 12. Next term = 30 + 12 = 42.',
      },
      {
        id: 'lr2',
        question: 'All cats are animals. All animals are living things. Which conclusion is valid?',
        options: [
          'All living things are cats',
          'All cats are living things',
          'Some living things are cats',
          'Both B and C',
        ],
        answer: 3,
        explanation: 'By syllogism, all cats → animals → living things, so B and C are both valid.',
      },
      {
        id: 'lr3',
        question: 'Pointing to a man, a woman says "His mother is the only daughter of my mother." How is the woman related to the man?',
        options: ['Grandmother', 'Sister', 'Mother', 'Aunt'],
        answer: 2,
        explanation: '"Only daughter of my mother" is the woman herself. So the man\'s mother is the woman → she is his mother.',
      },
      {
        id: 'lr4',
        question: 'If FRIEND is coded as HUMJTK, how is CANDLE coded?',
        options: ['ECOCJG', 'DCQHMF', 'EDRPNG', 'ECPFNG'],
        answer: 3,
        explanation: 'Each letter is shifted +2, +3, +4... following the pattern. CANDLE → ECPFNG.',
      },
      {
        id: 'lr5',
        question: 'Which of the following is the odd one out? BCDE, PQRS, WXYZ, LMNO, FGHI',
        options: ['BCDE', 'WXYZ', 'LMNO', 'FGHI'],
        answer: 1,
        explanation: 'WXYZ is the only group that does not have 4 consecutive letters starting from a fixed pattern — it reaches the end of the alphabet.',
      },
    ],
  },
  'Verbal Ability': {
    title: 'Verbal Ability',
    questions: [
      {
        id: 'va1',
        question: 'Choose the word most similar in meaning to BENEVOLENT.',
        options: ['Hostile', 'Charitable', 'Indifferent', 'Selfish'],
        answer: 1,
        explanation: 'Benevolent means well-meaning and kindly — closest to Charitable.',
      },
      {
        id: 'va2',
        question: 'Choose the word most OPPOSITE in meaning to DILIGENT.',
        options: ['Careful', 'Lazy', 'Hardworking', 'Prompt'],
        answer: 1,
        explanation: 'Diligent means hardworking; its antonym is Lazy.',
      },
      {
        id: 'va3',
        question: 'Fill in the blank: The committee has not yet __ its decision.',
        options: ['announced', 'announcing', 'announce', 'announces'],
        answer: 0,
        explanation: 'After "has not yet", use the past participle "announced".',
      },
      {
        id: 'va4',
        question: 'Identify the grammatically CORRECT sentence.',
        options: [
          'Each of the students have submitted their assignments.',
          'Each of the students has submitted their assignments.',
          'Each of the students has submitted his assignment.',
          'Each of the students have submitted his assignment.',
        ],
        answer: 1,
        explanation: '"Each" is singular, so "has" is correct. "Their" as a gender-neutral singular is widely accepted.',
      },
      {
        id: 'va5',
        question: 'Choose the correctly spelled word.',
        options: ['Accomodation', 'Accommodation', 'Acomodation', 'Acommodation'],
        answer: 1,
        explanation: 'The correct spelling is "Accommodation" (double c, double m).',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TECHNICAL QUIZZES
// ─────────────────────────────────────────────────────────────────────────────

const QUIZ_DATA = {
  DSA: {
    title: 'Data Structures & Algorithms',
    questions: [
      {
        id: 'dsa1',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        answer: 1,
        explanation: 'Binary search halves the search space each step: O(log n).',
      },
      {
        id: 'dsa2',
        question: 'Which data structure uses FIFO order?',
        options: ['Stack', 'Queue', 'Heap', 'Tree'],
        answer: 1,
        explanation: 'Queue operates on First In, First Out (FIFO).',
      },
      {
        id: 'dsa3',
        question: 'What is the worst-case time complexity of Quick Sort?',
        options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
        answer: 1,
        explanation: 'Quick Sort\'s worst case is O(n²) when the pivot is always the smallest or largest element.',
      },
      {
        id: 'dsa4',
        question: 'Which traversal visits the root node last?',
        options: ['Inorder', 'Preorder', 'Postorder', 'Level-order'],
        answer: 2,
        explanation: 'Postorder: Left → Right → Root. The root is visited last.',
      },
      {
        id: 'dsa5',
        question: 'A hash table with a load factor > 1 can still work with which collision strategy?',
        options: ['Open addressing', 'Chaining', 'Robin Hood hashing', 'Cuckoo hashing'],
        answer: 1,
        explanation: 'Chaining uses linked lists at each bucket, allowing load factor > 1.',
      },
    ],
  },
  DBMS: {
    title: 'Database Management Systems',
    questions: [
      {
        id: 'db1',
        question: 'Which normal form eliminates transitive dependencies?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        answer: 2,
        explanation: '3NF removes transitive functional dependencies on the primary key.',
      },
      {
        id: 'db2',
        question: 'What does ACID stand for in database transactions?',
        options: [
          'Atomicity, Consistency, Isolation, Durability',
          'Availability, Consistency, Integrity, Data',
          'Access, Control, Integrity, Distribution',
          'Atomic, Complete, Independent, Durable',
        ],
        answer: 0,
        explanation: 'ACID = Atomicity, Consistency, Isolation, Durability — the four properties of reliable transactions.',
      },
      {
        id: 'db3',
        question: 'Which JOIN returns all rows from both tables, with NULLs where there is no match?',
        options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'],
        answer: 3,
        explanation: 'FULL OUTER JOIN returns all rows from both tables; unmatched sides are filled with NULLs.',
      },
      {
        id: 'db4',
        question: 'Which index is automatically created when a PRIMARY KEY is defined?',
        options: ['Bitmap index', 'Clustered index', 'Hash index', 'Composite index'],
        answer: 1,
        explanation: 'A clustered index is implicitly created on the primary key column(s).',
      },
      {
        id: 'db5',
        question: 'What is a deadlock in a database?',
        options: [
          'A query that takes too long to execute',
          'Two transactions each waiting for the other to release a lock',
          'A corrupt table that cannot be accessed',
          'A primary key violation',
        ],
        answer: 1,
        explanation: 'Deadlock occurs when two or more transactions are waiting on each other\'s locks indefinitely.',
      },
    ],
  },
  'Operating Systems': {
    title: 'Operating Systems',
    questions: [
      {
        id: 'os1',
        question: 'Which scheduling algorithm can lead to starvation?',
        options: ['Round Robin', 'FCFS', 'Priority Scheduling', 'Shortest Job First'],
        answer: 2,
        explanation: 'Priority Scheduling can starve low-priority processes if high-priority processes keep arriving.',
      },
      {
        id: 'os2',
        question: 'What is thrashing in an operating system?',
        options: [
          'Excessive CPU usage by a single process',
          'Excessive paging activity causing very little useful work',
          'A deadlock between multiple processes',
          'Fragmentation of the disk',
        ],
        answer: 1,
        explanation: 'Thrashing occurs when the OS spends more time swapping pages than executing processes.',
      },
      {
        id: 'os3',
        question: 'Which of the following is NOT a necessary condition for deadlock?',
        options: ['Mutual exclusion', 'Hold and wait', 'Preemption', 'Circular wait'],
        answer: 2,
        explanation: 'Deadlock requires NO preemption. Allowing preemption prevents or resolves deadlocks.',
      },
      {
        id: 'os4',
        question: 'What is the purpose of the TLB (Translation Lookaside Buffer)?',
        options: [
          'To cache recent disk sectors',
          'To speed up virtual-to-physical address translation',
          'To store the process control block',
          'To manage I/O requests',
        ],
        answer: 1,
        explanation: 'TLB is a hardware cache that stores recent virtual-to-physical address mappings for fast translation.',
      },
      {
        id: 'os5',
        question: 'In UNIX, what does a fork() system call return in the child process?',
        options: ['The parent\'s PID', '0', '-1', 'The child\'s own PID'],
        answer: 1,
        explanation: 'fork() returns 0 in the child process and the child\'s PID in the parent.',
      },
    ],
  },
  'Computer Networks': {
    title: 'Computer Networks',
    questions: [
      {
        id: 'cn1',
        question: 'Which layer of the OSI model is responsible for end-to-end communication?',
        options: ['Network', 'Transport', 'Session', 'Application'],
        answer: 1,
        explanation: 'The Transport layer (Layer 4) handles end-to-end communication, error recovery, and flow control.',
      },
      {
        id: 'cn2',
        question: 'What is the default port for HTTPS?',
        options: ['80', '443', '8080', '22'],
        answer: 1,
        explanation: 'HTTPS uses port 443 by default.',
      },
      {
        id: 'cn3',
        question: 'Which protocol is used to assign IP addresses dynamically?',
        options: ['DNS', 'FTP', 'DHCP', 'ARP'],
        answer: 2,
        explanation: 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices.',
      },
      {
        id: 'cn4',
        question: 'What does the 3-way handshake in TCP establish?',
        options: ['A secure encrypted connection', 'A reliable connection', 'A UDP session', 'An IP route'],
        answer: 1,
        explanation: 'TCP\'s 3-way handshake (SYN, SYN-ACK, ACK) establishes a reliable, ordered connection.',
      },
      {
        id: 'cn5',
        question: 'Which routing protocol uses the Bellman-Ford algorithm?',
        options: ['OSPF', 'BGP', 'RIP', 'EIGRP'],
        answer: 2,
        explanation: 'RIP (Routing Information Protocol) uses the Bellman-Ford distance-vector algorithm.',
      },
    ],
  },
  JavaScript: {
    title: 'JavaScript',
    questions: [
      {
        id: 'js1',
        question: 'What does `typeof null` return in JavaScript?',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        answer: 2,
        explanation: 'This is a well-known JavaScript quirk — `typeof null` returns "object" due to a legacy bug.',
      },
      {
        id: 'js2',
        question: 'Which method creates a new array with the results of calling a function on every element?',
        options: ['forEach', 'filter', 'reduce', 'map'],
        answer: 3,
        explanation: 'Array.prototype.map() creates a new array by applying a callback to each element.',
      },
      {
        id: 'js3',
        question: 'What is the output of `0.1 + 0.2 === 0.3` in JavaScript?',
        options: ['true', 'false', 'undefined', 'NaN'],
        answer: 1,
        explanation: 'Floating-point precision issues make 0.1 + 0.2 = 0.30000000000000004, so === 0.3 is false.',
      },
      {
        id: 'js4',
        question: 'What does the `event.stopPropagation()` method do?',
        options: [
          'Prevents the default browser action',
          'Stops the event from bubbling up to parent elements',
          'Removes the event listener',
          'Cancels asynchronous tasks',
        ],
        answer: 1,
        explanation: 'stopPropagation() prevents the event from bubbling up through the DOM tree.',
      },
      {
        id: 'js5',
        question: 'Which of the following is a microtask in JavaScript?',
        options: ['setTimeout callback', 'setInterval callback', 'Promise.then callback', 'requestAnimationFrame callback'],
        answer: 2,
        explanation: 'Promise.then callbacks are microtasks and run before the next macrotask (like setTimeout).',
      },
    ],
  },
  SQL: {
    title: 'SQL',
    questions: [
      {
        id: 'sql1',
        question: 'Which SQL clause is used to filter groups after GROUP BY?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'FILTER'],
        answer: 1,
        explanation: 'HAVING filters groups (after aggregation); WHERE filters individual rows (before aggregation).',
      },
      {
        id: 'sql2',
        question: 'What is the result of `SELECT COUNT(*) FROM table` if the table is empty?',
        options: ['NULL', 'Error', '0', '1'],
        answer: 2,
        explanation: 'COUNT(*) returns 0 for an empty table — it never returns NULL.',
      },
      {
        id: 'sql3',
        question: 'Which keyword removes duplicate rows from a SELECT result?',
        options: ['UNIQUE', 'DISTINCT', 'ONLY', 'DIFFERENT'],
        answer: 1,
        explanation: 'SELECT DISTINCT eliminates duplicate rows from the result set.',
      },
      {
        id: 'sql4',
        question: 'What does a LEFT JOIN return?',
        options: [
          'Only rows that match in both tables',
          'All rows from the left table and matched rows from the right',
          'All rows from the right table and matched rows from the left',
          'All rows from both tables',
        ],
        answer: 1,
        explanation: 'LEFT JOIN returns all rows from the left table; unmatched right-table columns are NULL.',
      },
      {
        id: 'sql5',
        question: 'Which SQL function returns the number of characters in a string?',
        options: ['SIZE()', 'COUNT()', 'LENGTH()', 'CHARACTERS()'],
        answer: 2,
        explanation: 'LENGTH() (standard SQL) or LEN() (SQL Server) returns the character count of a string.',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CODING CHALLENGES
// ─────────────────────────────────────────────────────────────────────────────

const CODING_CHALLENGES = [
  {
    id: 'cc-easy-arrays-1',
    difficulty: 'Easy',
    topic: 'Arrays',
    title: 'Find the Maximum Element',
    prompt: 'Given an array of integers, return the maximum element without using built-in max functions.',
    examples: ['Input: [3, 1, 4, 1, 5, 9, 2, 6] → Output: 9'],
    hints: ['Initialise a variable to the first element', 'Iterate through and update if current > max'],
    starterCode: `function findMax(arr) {
  // Your solution here
}`,
  },
  {
    id: 'cc-easy-strings-1',
    difficulty: 'Easy',
    topic: 'Strings',
    title: 'Reverse a String',
    prompt: 'Write a function that reverses a string without using the built-in reverse() method.',
    examples: ['Input: "hello" → Output: "olleh"'],
    hints: ['Use two pointers — one at the start and one at the end', 'Or build a new string character by character from the end'],
    starterCode: `function reverseString(str) {
  // Your solution here
}`,
  },
  {
    id: 'cc-medium-arrays-1',
    difficulty: 'Medium',
    topic: 'Arrays',
    title: 'Two Sum',
    prompt: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Each input has exactly one solution, and you may not use the same element twice.',
    examples: ['Input: nums = [2,7,11,15], target = 9 → Output: [0,1]'],
    hints: ['Use a hash map to store visited values and their indices', 'For each element, check if (target - element) exists in the map'],
    starterCode: `function twoSum(nums, target) {
  // Your solution here
}`,
  },
  {
    id: 'cc-medium-strings-1',
    difficulty: 'Medium',
    topic: 'Strings',
    title: 'Valid Anagram',
    prompt: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    examples: ['Input: s = "anagram", t = "nagaram" → Output: true', 'Input: s = "rat", t = "car" → Output: false'],
    hints: ['Sort both strings and compare', 'Or use a frequency map / character count array'],
    starterCode: `function isAnagram(s, t) {
  // Your solution here
}`,
  },
  {
    id: 'cc-hard-dp-1',
    difficulty: 'Hard',
    topic: 'Dynamic Programming',
    title: 'Longest Common Subsequence',
    prompt: 'Given two strings text1 and text2, return the length of their longest common subsequence. A subsequence is a sequence derived by deleting some characters without changing the relative order of the remaining characters.',
    examples: ['Input: text1 = "abcde", text2 = "ace" → Output: 3 ("ace")'],
    hints: [
      'Use a 2D DP table where dp[i][j] = LCS length of text1[0..i-1] and text2[0..j-1]',
      'If text1[i-1] === text2[j-1], dp[i][j] = dp[i-1][j-1] + 1',
      'Otherwise, dp[i][j] = max(dp[i-1][j], dp[i][j-1])',
    ],
    starterCode: `function longestCommonSubsequence(text1, text2) {
  // Your solution here
}`,
  },
  {
    id: 'cc-hard-graphs-1',
    difficulty: 'Hard',
    topic: 'Graphs',
    title: 'Number of Islands',
    prompt: 'Given an m×n grid of "1"s (land) and "0"s (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.',
    examples: ['Input: [["1","1","0"],["1","1","0"],["0","0","1"]] → Output: 2'],
    hints: [
      'Use DFS or BFS — when you find a "1", increment the count and flood-fill the island to "0"',
      'Use a visited set or modify the grid in-place',
    ],
    starterCode: `function numIslands(grid) {
  // Your solution here
}`,
  },
  {
    id: 'cc-medium-ll-1',
    difficulty: 'Medium',
    topic: 'Linked List',
    title: 'Reverse a Linked List',
    prompt: 'Given the head of a singly linked list, reverse the list and return the new head.',
    examples: ['Input: 1→2→3→4→5 → Output: 5→4→3→2→1'],
    hints: [
      'Iterative: use three pointers — prev, curr, next',
      'Recursive: reverse the rest of the list and link the current node at the end',
    ],
    starterCode: `function reverseList(head) {
  // Your solution here
}`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the question set for an aptitude test.
 * @param {string} testName
 */
export function getAptitudeTest(testName) {
  return APTITUDE_DATA[testName] || APTITUDE_DATA['Quantitative Aptitude'];
}

/**
 * Returns the question set for a technical quiz topic.
 * @param {string} topic
 */
export function getTechnicalQuiz(topic) {
  return QUIZ_DATA[topic] || QUIZ_DATA['DSA'];
}

/**
 * Returns a coding challenge filtered by difficulty and topic.
 * Falls back to the first matching difficulty, then the first challenge.
 * @param {{ difficulty?: string, topic?: string }} options
 */
export function getCodingChallenge({ difficulty, topic } = {}) {
  const byDiffTopic = CODING_CHALLENGES.find(
    c =>
      (!difficulty || c.difficulty.toLowerCase() === difficulty.toLowerCase()) &&
      (!topic       || c.topic.toLowerCase()      === topic.toLowerCase())
  );
  if (byDiffTopic) return byDiffTopic;

  const byDiff = CODING_CHALLENGES.find(
    c => !difficulty || c.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
  return byDiff || CODING_CHALLENGES[0];
}

/**
 * Scores a submitted question set (aptitude or quiz).
 * @param {'aptitude'|'quiz'} kind
 * @param {string} name  - test name / topic
 * @param {Record<string, number>} answers - { questionId: selectedOptionIndex }
 */
export function scoreQuestionSet(kind, name, answers) {
  const data = kind === 'aptitude' ? getAptitudeTest(name) : getTechnicalQuiz(name);

  const results = data.questions.map(q => {
    const given   = answers[q.id];
    const correct = given === q.answer;
    return {
      id:          q.id,
      correct,
      yourAnswer:  given != null ? q.options[given] : null,
      rightAnswer: q.options[q.answer],
      explanation: q.explanation,
    };
  });

  const score      = results.filter(r => r.correct).length;
  const total      = results.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return {
    title:      data.title,
    score,
    total,
    percentage,
    results,
  };
}

/**
 * Reviews a coding solution (stub — returns heuristic feedback).
 * In production, replace this with a real code evaluation service.
 * @param {{ challengeId: string, code: string }} options
 */
export function reviewCodingSolution({ challengeId, code }) {
  const challenge = CODING_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) {
    return { score: 0, rating: 'Unknown Challenge', feedback: ['Challenge not found.'] };
  }

  const trimmed = (code || '').trim();
  const lines   = trimmed.split('\n').filter(l => l.trim().length > 0).length;

  // Very basic heuristic scoring (for demo purposes)
  let score    = 0;
  const feedback = [];

  if (lines > 3) {
    score += 40;
    feedback.push('✅ You wrote some code — good start!');
  } else {
    feedback.push('⚠️ Solution appears incomplete. Add your logic inside the function.');
  }

  if (/return/.test(trimmed)) {
    score += 20;
    feedback.push('✅ Function includes a return statement.');
  } else {
    feedback.push('⚠️ Make sure your function returns a value.');
  }

  if (/for|while|forEach|map|reduce/.test(trimmed)) {
    score += 20;
    feedback.push('✅ Iteration logic detected.');
  }

  if (/if|else|ternary|\?/.test(trimmed)) {
    score += 10;
    feedback.push('✅ Conditional logic detected.');
  }

  if (lines >= 10) {
    score += 10;
    feedback.push('✅ Good solution length — looks well thought out.');
  }

  feedback.push(`💡 Hint: ${challenge.hints[0]}`);

  const rating =
    score >= 90 ? 'Excellent'  :
    score >= 70 ? 'Good'       :
    score >= 40 ? 'Needs Work' : 'Incomplete';

  return { score: Math.min(100, score), rating, feedback };
}
