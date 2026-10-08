/**
 * CodeWrapperService — wraps user solution code into an executable program.
 *
 * WHY this exists:
 * Judge0 needs a complete program with main() that reads stdin and prints stdout.
 * Users write only the solution function (like LeetCode). This service wraps
 * their code with the appropriate stdin parsing, function invocation, and output
 * printing for each language.
 *
 * Each problem's `codeConfiguration` defines:
 * - functionName: the method to call (e.g., "twoSum")
 * - params: [{ name, type }] — parameter definitions
 * - returnType: what the function returns
 * - templates: { java, python, cpp } — starter code shown to user
 *
 * The wrapper reads stdin line-by-line, parses values based on param types,
 * calls the solution, and prints the result.
 */

// ─── Type parsing helpers for each language ──────────────────────────────

const JAVA_TYPE_PARSERS = {
  'int':       (varName, readExpr) => `int ${varName} = Integer.parseInt(${readExpr}.trim());`,
  'long':      (varName, readExpr) => `long ${varName} = Long.parseLong(${readExpr}.trim());`,
  'double':    (varName, readExpr) => `double ${varName} = Double.parseDouble(${readExpr}.trim());`,
  'boolean':   (varName, readExpr) => `boolean ${varName} = Boolean.parseBoolean(${readExpr}.trim());`,
  'string':    (varName, readExpr) => `String ${varName} = ${readExpr};`,
  'int[]':     (varName, readExpr) => `scanner.nextLine(); int[] ${varName} = Arrays.stream(${readExpr}.trim().split("\\\\s+")).mapToInt(Integer::parseInt).toArray();`,
  'string[]':  (varName, readExpr) => `scanner.nextLine(); String[] ${varName} = ${readExpr}.trim().split("\\\\s+");`,
  'double[]':  (varName, readExpr) => `scanner.nextLine(); double[] ${varName} = Arrays.stream(${readExpr}.trim().split("\\\\s+")).mapToDouble(Double::parseDouble).toArray();`,
};

const JAVA_RESULT_PRINTERS = {
  'int':       (expr) => `System.out.println(${expr});`,
  'long':      (expr) => `System.out.println(${expr});`,
  'double':    (expr) => `System.out.printf("%.2f%n", ${expr});`,
  'boolean':   (expr) => `System.out.println(${expr});`,
  'string':    (expr) => `System.out.println(${expr});`,
  'int[]':     (expr) => `System.out.println(Arrays.stream(${expr}).mapToObj(String::valueOf).collect(java.util.stream.Collectors.joining(" ")));`,
  'string[]':  (expr) => `System.out.println(String.join(" ", ${expr}));`,
  'void':      () => '', // function itself handles printing
};

const PYTHON_TYPE_PARSERS = {
  'int':       (varName, readExpr) => `${varName} = int(${readExpr}.strip())`,
  'long':      (varName, readExpr) => `${varName} = int(${readExpr}.strip())`,
  'double':    (varName, readExpr) => `${varName} = float(${readExpr}.strip())`,
  'boolean':   (varName, readExpr) => `${varName} = ${readExpr}.strip().lower() == 'true'`,
  'string':    (varName, readExpr) => `${varName} = ${readExpr}.strip()`,
  'int[]':     (varName, readExpr) => `input(); ${varName} = list(map(int, ${readExpr}.strip().split()))`,
  'string[]':  (varName, readExpr) => `input(); ${varName} = ${readExpr}.strip().split()`,
  'double[]':  (varName, readExpr) => `input(); ${varName} = list(map(float, ${readExpr}.strip().split()))`,
};

const PYTHON_RESULT_PRINTERS = {
  'int':       (expr) => `print(${expr})`,
  'long':      (expr) => `print(${expr})`,
  'double':    (expr) => `print(f"{${expr}:.2f}")`,
  'boolean':   (expr) => `print(str(${expr}).lower())`,
  'string':    (expr) => `print(${expr})`,
  'int[]':     (expr) => `print(" ".join(map(str, ${expr})))`,
  'string[]':  (expr) => `print(" ".join(${expr}))`,
  'void':      () => '',
};

const CPP_TYPE_PARSERS = {
  'int':       (varName, _) => `int ${varName}; cin >> ${varName};`,
  'long':      (varName, _) => `long long ${varName}; cin >> ${varName};`,
  'double':    (varName, _) => `double ${varName}; cin >> ${varName};`,
  'boolean':   (varName, _) => `string _${varName}; cin >> _${varName}; bool ${varName} = (_${varName} == "true");`,
  'string':    (varName, _) => `string ${varName}; getline(cin, ${varName});`,
  'int[]':     (varName) => `int _n_${varName}; cin >> _n_${varName}; vector<int> ${varName}(_n_${varName}); for(int i=0;i<_n_${varName};i++) cin >> ${varName}[i];`,
  'string[]':  (varName) => `int _n_${varName}; cin >> _n_${varName}; vector<string> ${varName}(_n_${varName}); for(int i=0;i<_n_${varName};i++) cin >> ${varName}[i];`,
  'double[]':  (varName) => `int _n_${varName}; cin >> _n_${varName}; vector<double> ${varName}(_n_${varName}); for(int i=0;i<_n_${varName};i++) cin >> ${varName}[i];`,
};

const CPP_RESULT_PRINTERS = {
  'int':       (expr) => `cout << ${expr} << endl;`,
  'long':      (expr) => `cout << ${expr} << endl;`,
  'double':    (expr) => `cout << fixed << setprecision(2) << ${expr} << endl;`,
  'boolean':   (expr) => `cout << (${expr} ? "true" : "false") << endl;`,
  'string':    (expr) => `cout << ${expr} << endl;`,
  'int[]':     (expr) => `for(int i=0;i<${expr}.size();i++){if(i)cout<<" ";cout<<${expr}[i];}cout<<endl;`,
  'string[]':  (expr) => `for(int i=0;i<${expr}.size();i++){if(i)cout<<" ";cout<<${expr}[i];}cout<<endl;`,
  'void':      () => '',
};


class CodeWrapperService {

  /**
   * Wrap user code into a complete executable program.
   *
   * @param {string} userCode - The user's solution code (class Solution { ... })
   * @param {string} language - 'java', 'python', 'cpp'
   * @param {object} codeConfig - The problem's codeConfiguration for this language
   * @returns {string} - Complete executable source code
   */
  wrapCode(userCode, language, codeConfig) {
    if (!codeConfig) {
      // Fallback: if no config, assume user wrote a complete program (stdin/stdout)
      return userCode;
    }

    switch (language) {
      case 'java':       return this._wrapJava(userCode, codeConfig);
      case 'python':     return this._wrapPython(userCode, codeConfig);
      case 'cpp':        return this._wrapCpp(userCode, codeConfig);
      case 'javascript': return this._wrapJavaScript(userCode, codeConfig);
      default:           return userCode;
    }
  }

  // ── Java ──────────────────────────────────────────────────────────────

  _wrapJava(userCode, config) {
    const { functionName, params, returnType } = config;

    // Build parameter parsing lines
    const parseLines = params.map(p => {
      const parser = JAVA_TYPE_PARSERS[p.type];
      if (!parser) return `// Unsupported type: ${p.type}`;
      return `            ${parser(p.name, 'scanner.nextLine()')}`;
    }).join('\n');

    // Build function call
    const paramNames = params.map(p => p.name).join(', ');
    const call = `solution.${functionName}(${paramNames})`;

    // Build result printing
    const printer = JAVA_RESULT_PRINTERS[returnType];
    let printLine;
    if (returnType === 'void') {
      printLine = `            ${call};`;
    } else {
      const resultType = this._javaReturnType(returnType);
      printLine = `            ${resultType} result = ${call};\n            ${printer('result')}`;
    }

    return `import java.util.*;
import java.util.stream.*;

${userCode}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Solution solution = new Solution();
        try {
${parseLines}
${printLine}
        } catch (Exception e) {
            System.err.println(e.toString());
            System.exit(1);
        }
    }
}`;
  }

  _javaReturnType(type) {
    const map = {
      'int': 'int', 'long': 'long', 'double': 'double',
      'boolean': 'boolean', 'string': 'String',
      'int[]': 'int[]', 'string[]': 'String[]',
    };
    return map[type] || type;
  }

  // ── Python ────────────────────────────────────────────────────────────

  _wrapPython(userCode, config) {
    const { functionName, params, returnType } = config;

    const parseLines = params.map(p => {
      const parser = PYTHON_TYPE_PARSERS[p.type];
      if (!parser) return `# Unsupported type: ${p.type}`;
      return parser(p.name, 'input()');
    }).join('\n');

    const paramNames = params.map(p => p.name).join(', ');
    const call = `solution.${functionName}(${paramNames})`;

    const printer = PYTHON_RESULT_PRINTERS[returnType];
    let printLine;
    if (returnType === 'void') {
      printLine = call;
    } else {
      printLine = `result = ${call}\n${printer('result')}`;
    }

    return `${userCode}

solution = Solution()
${parseLines}
${printLine}
`;
  }

  // ── C++ ───────────────────────────────────────────────────────────────

  _wrapCpp(userCode, config) {
    const { functionName, params, returnType } = config;

    const parseLines = params.map(p => {
      const parser = CPP_TYPE_PARSERS[p.type];
      if (!parser) return `// Unsupported type: ${p.type}`;
      return `    ${parser(p.name)}`;
    }).join('\n');

    const paramNames = params.map(p => p.name).join(', ');
    const call = `solution.${functionName}(${paramNames})`;

    const printer = CPP_RESULT_PRINTERS[returnType];
    let printLine;
    if (returnType === 'void') {
      printLine = `    ${call};`;
    } else {
      const cppType = this._cppReturnType(returnType);
      printLine = `    ${cppType} result = ${call};\n    ${printer('result')}`;
    }

    return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <sstream>
#include <iomanip>
using namespace std;

${userCode}

int main() {
    Solution solution;
${parseLines}
${printLine}
    return 0;
}`;
  }

  _cppReturnType(type) {
    const map = {
      'int': 'int', 'long': 'long long', 'double': 'double',
      'boolean': 'bool', 'string': 'string',
      'int[]': 'vector<int>', 'string[]': 'vector<string>',
    };
    return map[type] || type;
  }

  // ── JavaScript ────────────────────────────────────────────────────────

  _wrapJavaScript(userCode, config) {
    const { functionName, params, returnType } = config;

    let lineIdx = 0;
    // Node.js stdin reading
    let parseLines = params.map((p) => {
      let code = '';
      switch (p.type) {
        case 'int': case 'long':
          code = `  const ${p.name} = parseInt(lines[${lineIdx}].trim());`;
          lineIdx++;
          break;
        case 'double':
          code = `  const ${p.name} = parseFloat(lines[${lineIdx}].trim());`;
          lineIdx++;
          break;
        case 'boolean':
          code = `  const ${p.name} = lines[${lineIdx}].trim() === 'true';`;
          lineIdx++;
          break;
        case 'string':
          code = `  const ${p.name} = lines[${lineIdx}].trim();`;
          lineIdx++;
          break;
        case 'int[]':
          code = `  const ${p.name} = lines[${lineIdx + 1}].trim().split(/\\s+/).map(Number);`;
          lineIdx += 2;
          break;
        case 'string[]':
          code = `  const ${p.name} = lines[${lineIdx + 1}].trim().split(/\\s+/);`;
          lineIdx += 2;
          break;
        default:
          code = `  // Unsupported type: ${p.type}`;
      }
      return code;
    }).join('\n');

    const paramNames = params.map(p => p.name).join(', ');
    const call = `solution.${functionName}(${paramNames})`;

    let printLine;
    if (returnType === 'void') {
      printLine = `  ${call};`;
    } else if (returnType === 'int[]' || returnType === 'string[]' || returnType === 'double[]') {
      printLine = `  const result = ${call};\n  console.log(result.join(" "));`;
    } else if (returnType === 'boolean') {
      printLine = `  const result = ${call};\n  console.log(String(result));`;
    } else {
      printLine = `  const result = ${call};\n  console.log(result);`;
    }

    return `${userCode}

const input = require('fs').readFileSync('/dev/stdin', 'utf8');
const lines = input.split('\\n');
const solution = new Solution();
${parseLines}
${printLine}
`;
  }
}

module.exports = new CodeWrapperService();
