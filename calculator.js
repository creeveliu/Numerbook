// ============================================
// Numerbook Calculator - 计算器核心逻辑
// ============================================

'use strict';

// ============ 词法分析器 (Tokenizer) ============
const TokenType = {
    NUMBER: 'NUMBER',
    IDENTIFIER: 'IDENTIFIER',
    PLUS: 'PLUS',
    MINUS: 'MINUS',
    STAR: 'STAR',
    SLASH: 'SLASH',
    EQUAL: 'EQUAL',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    POW: 'POW',
    EOF: 'EOF'
};

class Token {
    constructor(type, value = null) {
        this.type = type;
        this.value = value;
    }
}

class Tokenizer {
    constructor(text) {
        this.text = text.trim();
        this.pos = 0;
        this.currentChar = this.text[0] || null;
    }

    advance() {
        this.pos++;
        this.currentChar = this.text[this.pos] || null;
    }

    skipWhitespace() {
        while (this.currentChar && /\s/.test(this.currentChar)) {
            this.advance();
        }
    }

    number() {
        let result = '';
        while (this.currentChar && (/\d/.test(this.currentChar) || this.currentChar === '.')) {
            result += this.currentChar;
            this.advance();
        }
        return new Token(TokenType.NUMBER, parseFloat(result));
    }

    identifier() {
        let result = '';
        while (this.currentChar && /[a-zA-Z_\u4e00-\u9fa5]/.test(this.currentChar)) {
            result += this.currentChar;
            this.advance();
        }
        return new Token(TokenType.IDENTIFIER, result);
    }

    getNextToken() {
        while (this.currentChar) {
            if (/\s/.test(this.currentChar)) {
                this.skipWhitespace();
                continue;
            }

            if (/\d/.test(this.currentChar) || (this.currentChar === '.' && /\d/.test(this.text[this.pos + 1]))) {
                return this.number();
            }

            if (/[a-zA-Z_\u4e00-\u9fa5]/.test(this.currentChar)) {
                return this.identifier();
            }

            switch (this.currentChar) {
                case '+': this.advance(); return new Token(TokenType.PLUS, '+');
                case '-': this.advance(); return new Token(TokenType.MINUS, '-');
                case '*': this.advance(); return new Token(TokenType.STAR, '*');
                case '/': this.advance(); return new Token(TokenType.SLASH, '/');
                case '=': this.advance(); return new Token(TokenType.EQUAL, '=');
                case '(': this.advance(); return new Token(TokenType.LPAREN, '(');
                case ')': this.advance(); return new Token(TokenType.RPAREN, ')');
                case '^': this.advance(); return new Token(TokenType.POW, '^');
                default:
                    throw new Error(`未知字符：${this.currentChar}`);
            }
        }
        return new Token(TokenType.EOF);
    }

    tokenize() {
        const tokens = [];
        let token;
        while ((token = this.getNextToken()).type !== TokenType.EOF) {
            tokens.push(token);
        }
        return tokens;
    }
}

// ============ 语法分析器 (Parser) ============
class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

class NumberNode extends ASTNode {
    constructor(value) {
        super('Number');
        this.value = value;
    }
}

class IdentifierNode extends ASTNode {
    constructor(name) {
        super('Identifier');
        this.name = name;
    }
}

class BinaryNode extends ASTNode {
    constructor(operator, left, right) {
        super('Binary');
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

class UnaryNode extends ASTNode {
    constructor(operator, operand) {
        super('Unary');
        this.operator = operator;
        this.operand = operand;
    }
}

class AssignmentNode extends ASTNode {
    constructor(name, expression) {
        super('Assignment');
        this.name = name;
        this.expression = expression;
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        this.currentToken = this.tokens[0];
    }

    advance() {
        this.pos++;
        this.currentToken = this.tokens[this.pos];
    }

    match(type) {
        return this.currentToken && this.currentToken.type === type;
    }

    eat(type) {
        if (this.match(type)) {
            const token = this.currentToken;
            this.advance();
            return token;
        }
        throw new Error(`期望 ${type}，但得到 ${this.currentToken?.type}`);
    }

    parse() {
        if (this.tokens.length === 0) {
            return null;
        }
        const result = this.expression();
        return result;
    }

    // expression ::= term (('+' | '-') term)*
    expression() {
        let node = this.term();

        while (this.match(TokenType.PLUS) || this.match(TokenType.MINUS)) {
            const operator = this.currentToken.type === TokenType.PLUS ? '+' : '-';
            this.advance();
            node = new BinaryNode(operator, node, this.term());
        }

        return node;
    }

    // term ::= factor (('*' | '/') factor)*
    term() {
        let node = this.exponent();

        while (this.match(TokenType.STAR) || this.match(TokenType.SLASH)) {
            const operator = this.currentToken.type === TokenType.STAR ? '*' : '/';
            this.advance();
            node = new BinaryNode(operator, node, this.exponent());
        }

        return node;
    }

    // exponent ::= factor ('^' factor)*
    exponent() {
        let node = this.factor();

        if (this.match(TokenType.POW)) {
            this.advance();
            const right = this.exponent(); // 右结合
            node = new BinaryNode('^', node, right);
        }

        return node;
    }

    // factor ::= number | identifier | '(' expression ')' | unary
    factor() {
        if (this.match(TokenType.NUMBER)) {
            const token = this.eat(TokenType.NUMBER);
            return new NumberNode(token.value);
        }

        if (this.match(TokenType.IDENTIFIER)) {
            const name = this.currentToken.value;
            this.advance();

            // 检查是否是赋值语句
            if (this.match(TokenType.EQUAL)) {
                this.advance(); // 吃掉 '='
                const expr = this.expression();
                return new AssignmentNode(name, expr);
            }

            return new IdentifierNode(name);
        }

        if (this.match(TokenType.LPAREN)) {
            this.advance(); // 吃掉 '('
            const node = this.expression();
            this.eat(TokenType.RPAREN); // 吃掉 ')'
            return node;
        }

        if (this.match(TokenType.MINUS)) {
            this.advance();
            return new UnaryNode('-', this.factor());
        }

        throw new Error(`意外的 token: ${this.currentToken?.type}`);
    }
}

// ============ 求值器 (Evaluator) ============
class VariableScope {
    constructor() {
        this.variables = new Map();
    }

    set(name, value) {
        this.variables.set(name, value);
    }

    get(name) {
        if (!this.variables.has(name)) {
            throw new Error(`变量 '${name}' 未定义`);
        }
        return this.variables.get(name);
    }

    has(name) {
        return this.variables.has(name);
    }

    clear() {
        this.variables.clear();
    }

    getAll() {
        return Object.fromEntries(this.variables);
    }
}

class Evaluator {
    constructor() {
        this.scope = new VariableScope();
    }

    reset() {
        this.scope.clear();
    }

    evaluate(node) {
        if (!node) {
            return { success: true, value: null };
        }

        try {
            const value = this.evalNode(node);
            return { success: true, value: value };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    evalNode(node) {
        switch (node.type) {
            case 'Number':
                return node.value;

            case 'Identifier':
                return this.scope.get(node.name);

            case 'Binary': {
                const left = this.evalNode(node.left);
                const right = this.evalNode(node.right);

                switch (node.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/':
                        if (right === 0) {
                            throw new Error('除数不能为零');
                        }
                        return left / right;
                    case '^': return Math.pow(left, right);
                    default:
                        throw new Error(`未知运算符：${node.operator}`);
                }
            }

            case 'Unary':
                const operand = this.evalNode(node.operand);
                if (node.operator === '-') {
                    return -operand;
                }
                throw new Error(`未知一元运算符：${node.operator}`);

            case 'Assignment':
                const value = this.evalNode(node.expression);
                this.scope.set(node.name, value);
                return value;

            default:
                throw new Error(`未知的节点类型：${node.type}`);
        }
    }

    evaluateLine(line) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            return { success: true, value: null, isEmpty: true };
        }

        try {
            const tokens = new Tokenizer(trimmedLine).tokenize();
            if (tokens.length === 0) {
                return { success: true, value: null, isEmpty: true };
            }

            const ast = new Parser(tokens).parse();
            const result = this.evaluate(ast);

            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// ============ 对外暴露的 API ============
const evaluator = new Evaluator();

const Calculator = {
    // 词法分析
    tokenize: function(text) {
        return new Tokenizer(text).tokenize();
    },

    // 语法分析
    parse: function(text) {
        const tokens = new Tokenizer(text).tokenize();
        return new Parser(tokens).parse();
    },

    // 求值
    evaluate: function(text) {
        return evaluator.evaluateLine(text);
    },

    // 重置所有变量
    reset: function() {
        evaluator.reset();
    },

    // 获取所有变量
    getVariables: function() {
        return evaluator.scope.getAll();
    }
};

// 导出到全局（供测试使用）
if (typeof window !== 'undefined') {
    window.Calculator = Calculator;
}

// 导出模块（供 Node.js 使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
}
