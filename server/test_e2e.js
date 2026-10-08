/**
 * End-to-end test of the submission pipeline:
 * User code → CodeWrapperService → CodeExecutionService → Result
 */
const codeExecutionService = require('./src/services/codeExecutionService');
const codeWrapperService = require('./src/services/codeWrapperService');
const { Problem, TestCase } = require('./src/models');

async function testSubmission() {
  console.log('=== E2E Submission Pipeline Test ===\n');

  // Test 1: Java "Contains Duplicate" (has codeConfiguration)
  console.log('--- Test 1: Java Contains Duplicate (ACCEPTED) ---');
  const problem = await Problem.findOne({ where: { title: 'Contains Duplicate' } });
  if (!problem) {
    console.error('Problem not found! Make sure seed has run.');
    process.exit(1);
  }

  console.log('Problem:', problem.title);
  console.log('Has codeConfiguration:', !!problem.codeConfiguration);

  const langConfig = problem.codeConfiguration.java;
  console.log('Function:', langConfig.functionName);
  console.log('Params:', JSON.stringify(langConfig.params));
  console.log('ReturnType:', langConfig.returnType);

  // User writes a correct solution
  const userCode = `class Solution {
    public boolean containsDuplicate(int[] nums) {
        java.util.HashSet<Integer> seen = new java.util.HashSet<>();
        for (int n : nums) {
            if (!seen.add(n)) return true;
        }
        return false;
    }
}`;

  const wrappedCode = codeWrapperService.wrapCode(userCode, 'java', langConfig);
  console.log('\n--- Wrapped Code ---');
  console.log(wrappedCode);
  console.log('--- End Wrapped Code ---\n');

  // Get test cases
  const testCases = await TestCase.findAll({ where: { problemId: problem.id } });
  console.log(`Running against ${testCases.length} test cases...\n`);

  const results = await codeExecutionService.executeMultiple(wrappedCode, 'java', testCases);
  for (const r of results) {
    console.log(`  TC ${r.testCaseId}: ${r.passed ? 'PASS' : 'FAIL'} | Status: ${r.status} | Expected: "${r.expectedOutput}" | Got: "${r.stdout}"`);
  }

  const passed = results.filter(r => r.passed).length;
  console.log(`\nResult: ${passed}/${results.length} passed`);
  console.log(passed === results.length ? '✓ ACCEPTED' : '✗ WRONG_ANSWER');

  // Test 2: Python "Climbing Stairs" (has codeConfiguration)
  console.log('\n--- Test 2: Python Climbing Stairs (ACCEPTED) ---');
  const problem2 = await Problem.findOne({ where: { title: 'Climbing Stairs' } });
  const langConfig2 = problem2.codeConfiguration.python;

  const pythonCode = `class Solution:
    def climbStairs(self, n):
        if n <= 2:
            return n
        a, b = 1, 2
        for i in range(3, n + 1):
            a, b = b, a + b
        return b`;

  const wrappedPython = codeWrapperService.wrapCode(pythonCode, 'python', langConfig2);
  console.log('\n--- Wrapped Python ---');
  console.log(wrappedPython);
  console.log('--- End ---\n');

  const testCases2 = await TestCase.findAll({ where: { problemId: problem2.id } });
  const results2 = await codeExecutionService.executeMultiple(wrappedPython, 'python', testCases2);
  for (const r of results2) {
    console.log(`  TC ${r.testCaseId}: ${r.passed ? 'PASS' : 'FAIL'} | Status: ${r.status} | Expected: "${r.expectedOutput}" | Got: "${r.stdout}"`);
  }
  const passed2 = results2.filter(r => r.passed).length;
  console.log(`\nResult: ${passed2}/${results2.length} passed`);
  console.log(passed2 === results2.length ? '✓ ACCEPTED' : '✗ WRONG_ANSWER');

  // Test 3: Java compilation error
  console.log('\n--- Test 3: Java Compilation Error ---');
  const badCode = `class Solution {
    public boolean containsDuplicate(int[] nums) {
        this is not valid java
    }
}`;
  const wrappedBad = codeWrapperService.wrapCode(badCode, 'java', langConfig);
  const resultsBad = await codeExecutionService.executeMultiple(wrappedBad, 'java', [testCases[0]]);
  console.log(`  Status: ${resultsBad[0].status}`);
  console.log(`  CompileOutput: ${resultsBad[0].compileOutput?.substring(0, 200)}`);
  console.log(resultsBad[0].status === 'COMPILATION_ERROR' ? '✓ Correctly detected compilation error' : '✗ Did not detect compilation error');

  console.log('\n=== All tests complete ===');
  process.exit(0);
}

testSubmission().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
