const axios = require('axios');

async function testApi() {
  try {
    const randomEmail = `test${Date.now()}@example.com`;
    const loginRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: randomEmail,
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Got token');

    // 2. Create a custom contest with 1 problem
    const createRes = await axios.post('http://localhost:5000/api/contests', {
      numProblems: 1,
      durationMinutes: 60,
      difficulty: 'EASY',
      topics: [1] // 1 is Arrays
    }, { headers: { Authorization: `Bearer ${token}` } });
    const contest = createRes.data.contest;
    console.log('Created contest:', contest.id);

    // 3. Start contest
    await axios.post(`http://localhost:5000/api/contests/${contest.id}/start`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Started contest');

    // 4. Submit code
    const problem = contest.Problems[0];
    const sourceCode = problem.codeConfiguration ? problem.codeConfiguration.java.template : 'class Solution { }';
    console.log('Submitting for problem:', problem.id, problem.title);

    const submitRes = await axios.post('http://localhost:5000/api/submissions', {
      contestId: contest.id,
      problemId: problem.id,
      language: 'java',
      sourceCode: sourceCode
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log('Submit Success!', submitRes.data.submission.status);

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testApi();
