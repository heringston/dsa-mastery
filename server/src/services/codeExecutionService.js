const axios = require('axios');
const env = require('../config/env');

/**
 * CodeExecutionService — wraps the Judge0 API behind a clean interface.
 *
 * Supports two modes:
 * 1. RapidAPI (paid) — uses X-RapidAPI headers
 * 2. Public Judge0 CE — no API key required (default for MVP)
 *
 * Judge0 language IDs: https://ce.judge0.com/languages
 */

const LANGUAGE_MAP = {
  'java': 62,        // Java (OpenJDK 13.0.1)
  'python': 71,      // Python (3.8.1)
  'javascript': 63,  // JavaScript (Node.js 12.14.0)
  'cpp': 54,         // C++ (GCC 9.2.0)
  'c': 50            // C (GCC 9.2.0)
};

class CodeExecutionService {
  constructor() {
    this.apiUrl = env.judge0.apiUrl || 'https://ce.judge0.com';
    this.apiKey = env.judge0.apiKey;
    this.apiHost = env.judge0.apiHost;

    // Detect if we have a real RapidAPI key or should use the free public endpoint
    this.useRapidApi = this.apiKey && this.apiKey !== 'your-rapidapi-key-here';

    if (!this.useRapidApi) {
      // Fall back to free public Judge0 CE
      this.apiUrl = 'https://ce.judge0.com';
      console.log('[CodeExecution] Using free public Judge0 CE endpoint');
    } else {
      console.log('[CodeExecution] Using RapidAPI Judge0 endpoint');
    }
  }

  /**
   * Execute code against a single test case.
   * Returns: { status, stdout, stderr, compileOutput, time, memory }
   */
  async execute(code, language, stdin) {
    const languageId = LANGUAGE_MAP[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`);
    }

    const payload = {
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(stdin || '').toString('base64'),
      cpu_time_limit: 5,
      memory_limit: 256000,
    };

    const headers = { 'Content-Type': 'application/json' };

    if (this.useRapidApi) {
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-RapidAPI-Host'] = this.apiHost;
    }

    try {
      // First try synchronous mode (wait=true)
      const response = await axios.post(
        `${this.apiUrl}/submissions?base64_encoded=true&wait=true`,
        payload,
        { headers, timeout: 30000 }
      );

      const data = response.data;

      // If Judge0 returns status "Processing" or "In Queue", we need to poll
      if (data.status && (data.status.id === 1 || data.status.id === 2)) {
        return await this._poll(data.token, headers);
      }

      return this._parseResult(data);
    } catch (error) {
      if (error.response) {
        console.error('[CodeExecution] API error:', error.response.status, error.response.data);

        // If synchronous mode not supported, try async + polling
        if (error.response.status === 400 || error.response.status === 404) {
          return await this._submitAsync(payload, headers);
        }
        throw new Error(`Code execution API error: ${error.response.status}`);
      }
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  /**
   * Fallback: submit asynchronously then poll for result.
   */
  async _submitAsync(payload, headers) {
    const response = await axios.post(
      `${this.apiUrl}/submissions?base64_encoded=true`,
      payload,
      { headers, timeout: 15000 }
    );

    const token = response.data.token;
    if (!token) throw new Error('No submission token received');

    return await this._poll(token, headers);
  }

  /**
   * Poll for submission result.
   */
  async _poll(token, headers, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s

      const res = await axios.get(
        `${this.apiUrl}/submissions/${token}?base64_encoded=true`,
        { headers, timeout: 10000 }
      );

      const data = res.data;
      // Status 1 = In Queue, 2 = Processing
      if (data.status && data.status.id !== 1 && data.status.id !== 2) {
        return this._parseResult(data);
      }
    }
    throw new Error('Code execution timed out waiting for result');
  }

  /**
   * Execute code against multiple test cases sequentially.
   */
  async executeMultiple(code, language, testCases) {
    const results = [];
    for (const testCase of testCases) {
      try {
        const result = await this.execute(code, language, testCase.input);
        results.push({
          ...result,
          testCaseId: testCase.id,
          expectedOutput: testCase.expectedOutput,
          passed: this._compareOutput(result.stdout, testCase.expectedOutput)
        });

        // Short-circuit on compilation error (same error for all test cases)
        if (result.status === 'COMPILATION_ERROR') {
          for (let j = results.length; j < testCases.length; j++) {
            results.push({
              ...result,
              testCaseId: testCases[j].id,
              expectedOutput: testCases[j].expectedOutput,
              passed: false
            });
          }
          break;
        }
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          status: 'INTERNAL_ERROR',
          error: error.message,
          stdout: '',
          stderr: error.message,
          compileOutput: '',
          time: null,
          memory: null,
          passed: false
        });
      }
    }
    return results;
  }

  getSupportedLanguages() {
    return Object.keys(LANGUAGE_MAP);
  }

  _parseResult(data) {
    const stdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString() : '';
    const stderr = data.stderr ? Buffer.from(data.stderr, 'base64').toString() : '';
    const compileOutput = data.compile_output ? Buffer.from(data.compile_output, 'base64').toString() : '';

    let status;
    const statusId = data.status?.id;
    if (statusId === 3) status = 'ACCEPTED';
    else if (statusId === 4) status = 'WRONG_ANSWER';
    else if (statusId === 5) status = 'TIME_LIMIT_EXCEEDED';
    else if (statusId === 6) status = 'COMPILATION_ERROR';
    else if (statusId >= 7 && statusId <= 12) status = 'RUNTIME_ERROR';
    else if (statusId === 1 || statusId === 2) status = 'PENDING';
    else status = 'INTERNAL_ERROR';

    return {
      status,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      compileOutput: compileOutput.trim(),
      time: parseFloat(data.time) || null,
      memory: data.memory || null,
      statusDescription: data.status?.description || ''
    };
  }

  _compareOutput(actual, expected) {
    if (!actual && !expected) return true;
    if (!actual || !expected) return false;
    return actual.trim() === expected.trim();
  }
}

module.exports = new CodeExecutionService();
