const codeExecutionService = require('./src/services/codeExecutionService');
const axios = require('axios');

async function test() {
  try {
    const code = `
public class Main {
    public static void main(String[] args) {
        System.out.println("5");
    }
}
`;
    console.log('Testing execution...');
    const response = await axios.post(
      'https://ce.judge0.com/submissions?base64_encoded=true&wait=true',
      {
        source_code: Buffer.from(code).toString('base64'),
        language_id: 62,
        stdin: Buffer.from('2 3').toString('base64'),
      }
    );
    console.log('Result:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}
test();
