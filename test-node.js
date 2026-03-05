// Numerbook Calculator - Node.js 测试脚本

const Calculator = require('./calculator.js');

let passed = 0;
let failed = 0;
const failedTests = [];

function assertEqual(actual, expected, testName) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
        passed++;
        console.log(`✓ ${testName}`);
        return true;
    }
    failed++;
    const error = `期望：${JSON.stringify(expected)}, 实际：${JSON.stringify(actual)}`;
    failedTests.push(`${testName}: ${error}`);
    console.log(`✗ ${testName}: ${error}`);
    return false;
}

function assertThrows(fn, testName) {
    try {
        fn();
        failed++;
        failedTests.push(`${testName}: 未抛出错误`);
        console.log(`✗ ${testName}: 未抛出错误`);
        return false;
    } catch (e) {
        passed++;
        console.log(`✓ ${testName}`);
        return true;
    }
}

console.log('=== 词法分析器 (Tokenizer) 测试 ===\n');

Calculator.reset();
assertEqual(Calculator.tokenize('123'), [{type: 'NUMBER', value: 123}], '数字解析：整数');
assertEqual(Calculator.tokenize('3.14'), [{type: 'NUMBER', value: 3.14}], '数字解析：小数');
assertEqual(Calculator.tokenize('abc'), [{type: 'IDENTIFIER', value: 'abc'}], '标识符解析：简单变量');
assertEqual(Calculator.tokenize('abc_def'), [{type: 'IDENTIFIER', value: 'abc_def'}], '标识符解析：带下划线');
assertEqual(Calculator.tokenize('+'), [{type: 'PLUS', value: '+'}], '运算符解析：加法');
assertEqual(Calculator.tokenize('-'), [{type: 'MINUS', value: '-'}], '运算符解析：减法');
assertEqual(Calculator.tokenize('*'), [{type: 'STAR', value: '*'}], '运算符解析：乘法');
assertEqual(Calculator.tokenize('/'), [{type: 'SLASH', value: '/'}], '运算符解析：除法');
assertEqual(Calculator.tokenize('='), [{type: 'EQUAL', value: '='}], '等号解析');
assertEqual(Calculator.tokenize('( )'), [{type: 'LPAREN', value: '('}, {type: 'RPAREN', value: ')'}], '括号解析');
assertEqual(Calculator.tokenize('a + 10 * 2'), [
    {type: 'IDENTIFIER', value: 'a'},
    {type: 'PLUS', value: '+'},
    {type: 'NUMBER', value: 10},
    {type: 'STAR', value: '*'},
    {type: 'NUMBER', value: 2}
], '复杂表达式解析');
assertEqual(Calculator.tokenize('c = a + b'), [
    {type: 'IDENTIFIER', value: 'c'},
    {type: 'EQUAL', value: '='},
    {type: 'IDENTIFIER', value: 'a'},
    {type: 'PLUS', value: '+'},
    {type: 'IDENTIFIER', value: 'b'}
], '赋值语句解析');
assertEqual(Calculator.tokenize('  a   +   b  '), [
    {type: 'IDENTIFIER', value: 'a'},
    {type: 'PLUS', value: '+'},
    {type: 'IDENTIFIER', value: 'b'}
], '空白字符处理');

console.log('\n=== 语法分析器 (Parser) 测试 ===\n');

Calculator.reset();
assertEqual(Calculator.parse('10'), {type: 'Number', value: 10}, '数字表达式');
assertEqual(Calculator.parse('abc'), {type: 'Identifier', name: 'abc'}, '变量表达式');
const addAst = Calculator.parse('1 + 2');
assertEqual(addAst.type === 'Binary' && addAst.operator === '+', true, '加法表达式');
const priorityAst = Calculator.parse('1 + 2 * 3');
assertEqual(
    priorityAst.type === 'Binary' && priorityAst.operator === '+' &&
    priorityAst.right.type === 'Binary' && priorityAst.right.operator === '*',
    true, '乘法优先级高于加法'
);
const parenAst = Calculator.parse('(1 + 2) * 3');
assertEqual(
    parenAst.type === 'Binary' && parenAst.operator === '*' &&
    parenAst.left.type === 'Binary' && parenAst.left.operator === '+',
    true, '括号改变优先级'
);
const unaryAst = Calculator.parse('-5');
assertEqual(unaryAst.type === 'Unary' && unaryAst.operator === '-', true, '一元负号');
const assignAst = Calculator.parse('c = a + b');
assertEqual(assignAst.type === 'Assignment' && assignAst.name === 'c', true, '赋值语句');

console.log('\n=== 求值器 (Evaluator) 测试 ===\n');

Calculator.reset();
assertEqual(Calculator.evaluate('10'), {success: true, value: 10}, '数字求值');
assertEqual(Calculator.evaluate('10 + 20'), {success: true, value: 30}, '加法求值');
assertEqual(Calculator.evaluate('20 - 10'), {success: true, value: 10}, '减法求值');
assertEqual(Calculator.evaluate('6 * 7'), {success: true, value: 42}, '乘法求值');
assertEqual(Calculator.evaluate('100 / 4'), {success: true, value: 25}, '除法求值');
assertEqual(Calculator.evaluate('1 + 2 * 3'), {success: true, value: 7}, '优先级求值');
assertEqual(Calculator.evaluate('(1 + 2) * 3'), {success: true, value: 9}, '括号求值');
assertEqual(Calculator.evaluate('-5'), {success: true, value: -5}, '一元负号求值');

Calculator.reset();
const result1 = Calculator.evaluate('a = 10');
const result2 = Calculator.evaluate('a');
assertEqual(result1, {success: true, value: 10}, '变量赋值');
assertEqual(result2, {success: true, value: 10}, '变量读取');

Calculator.reset();
Calculator.evaluate('a = 10');
Calculator.evaluate('b = 20');
const result3 = Calculator.evaluate('c = a + b');
assertEqual(result3, {success: true, value: 30}, '变量引用');

Calculator.reset();
const result4 = Calculator.evaluate('x + 1');
assertEqual(result4.success === false && result4.error.includes('未定义'), true, '未定义变量错误');

Calculator.reset();
const result5 = Calculator.evaluate('10 / 0');
assertEqual(result5.success === false && result5.error.includes('零'), true, '除零错误');

assertEqual(Calculator.evaluate('3.14 * 2'), {success: true, value: 6.28}, '小数计算');

Calculator.reset();
Calculator.evaluate('单价 = 99');
Calculator.evaluate('数量 = 5');
const result6 = Calculator.evaluate('总计 = 单价 * 数量 + 10');
assertEqual(result6, {success: true, value: 505}, '复杂表达式');

console.log('\n====================');
console.log(`总计：${passed + failed}`);
console.log(`通过：${passed}`);
console.log(`失败：${failed}`);

if (failed > 0) {
    console.log('\n失败的测试:');
    failedTests.forEach(t => console.log(`  - ${t}`));
    process.exit(1);
} else {
    console.log('\n全部通过！✓');
    process.exit(0);
}
