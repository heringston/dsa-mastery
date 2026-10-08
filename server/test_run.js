const axios = require('axios');

async function testRun() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Run User',
      email: `test_run_${Date.now()}@example.com`,
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Got token');

    const createRes = await axios.post('http://localhost:5000/api/contests', {
      numProblems: 1,
      durationMinutes: 60,
      difficulty: 'EASY',
      topics: [1]
    }, { headers: { Authorization: `Bearer ${token}` } });
    const contest = createRes.data.contest;
    console.log('Created contest:', contest.id);

    const problem = contest.Problems[0];
    const sourceCode = problem.codeConfiguration ? problem.codeConfiguration.java.template : 'class Solution { }';
    
    console.log('Running code for problem:', problem.id);
    const runRes = await axios.post('http://localhost:5000/api/submissions/run', {
      problemId: problem.id,
      language: 'java',
      sourceCode: sourceCode
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log('Run Success!', runRes.data);

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testRun();
