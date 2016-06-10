// Operator constants
var unaryMinus = 1;
var unaryLogicalNot = 2;
var unaryBitwiseNot = 3;
var power = 4;
var multiply = 5;
var divide = 6;
var remainder = 7;
var plus = 8;
var minus = 9;
var shl = 10;
var shr = 11;
var lessThan = 12;
var lessOrEquals = 13;
var greaterThan = 14;
var greaterOrEquals = 15;
var equals = 16;
var notEquals = 17;
var bitwiseAnd = 18;
var bitwiseXor = 19;
var bitwiseOr = 20;
var logicalAnd = 21;
var logicalOr = 22;
var assign = 23;
var comma = 24;

var ops = {
  '-u': unaryMinus, '!u': unaryLogicalNot, '^u': unaryBitwiseNot,
  '**': power, '*': multiply, '/': divide, '%': remainder,
  '+': plus, '-': minus,
  '<<': shl, '>>': shr,
  '<': lessThan, '<=': lessOrEquals, '>': greaterThan, '>=': greaterOrEquals,
  '==': equals, '!=': notEquals,
  '&': bitwiseAnd, '^': bitwiseXor, '|': bitwiseOr,
  '&&': logicalAnd, '||': logicalOr,
  '=': assign, ',': comma
};

function isUnary(op) {
  return op >= unaryMinus && op <= unaryBitwiseNot;
}
function isLeftAssoc(op) {
  return !isUnary(op) && op != assign && op != power && op != comma;
}

function constExpr(value) {
  return function() {
    return value;
  };
}

function varExpr(value) {
  var v = function(x) {
    if (x !== undefined) {
      value = x;
    }
    return value;
  };
  v.variable = true;
  return v;
}

function unaryExpr(op, arg) {
  return function() {
    if (op == unaryMinus) {
      return -arg();
    } else if (op == unaryBitwiseNot) {
      return ~arg();
    } else if (op == unaryLogicalNot) {
      return !arg();
    }
  };
}

function binaryExpr(op, a, b) {
  var f = function() {
    var c;
    if (op == power) {
      return Math.pow(a(), b());
    } else if (op == multiply) {
      return a() * b();
    } else if (op == divide) {
      c = b();
      return c ? (a() / c) : 0;
    } else if (op == remainder) {
      c = b();
      return c ? (a() % c) : 0;
    } else if (op == plus) {
      return a() + b();
    } else if (op == minus) {
      return a() - b();
    } else if (op == shl) {
      return a() << b();
    } else if (op == shr) {
      return a() >> b();
    } else if (op == lessThan ) {
      return a() < b();
    } else if (op == lessOrEquals) {
      return a() <= b();
    } else if (op == greaterThan ) {
      return a() > b();
    } else if (op == greaterOrEquals) {
      return a() >= b();
    } else if (op == equals ) {
      return a() == b();
    } else if (op == notEquals) {
      return a() != b();
    } else if (op == bitwiseAnd) {
      return a() & b();
    } else if (op == bitwiseXor) {
      return a() ^ b();
    } else if (op == bitwiseOr) {
      return a() | b();
    } else if (op == logicalAnd) {
      return a() && b();
    } else if (op == logicalOr) {
      return a() || b();
    } else if (op == assign) {
      return a(b());
    } else if (op == comma) {
      a(); return b();
    }
  };
  if (op == assign) {
    if (!a.variable) {
      return; // bad variable
    }
  } else if (op == comma) {
    f.car = a;
    f.cdr = b;
  }
  return f;
}

var tokNumber = 1 << 0;
var tokWord = 1 << 1;
var tokOp = 1 << 2;
var tokOpen = 1 << 3;
var tokClose = 1 << 4;

function isDigit(c) {
  return c >= '0' && c <= '9';
}

function isLetter(c) {
  return c >= 'a' && c <= 'z';
}

function isSpace(c) {
  return c == ' ' || c == '\t' || c == '\r' || c == '\n';
}

function tokenize(s) {
  var tokens = [];
  var expected = tokOpen | tokNumber | tokWord;
  for (var i = 0; i < s.length;) {
    var c = s.charAt(i);
    var tok = '';
    if (isSpace(c)) {
      i++;
      continue;
    }
    if (isDigit(c)) {
      if ((expected & tokNumber) === 0) {
        return; // Unexpected number
      }
      expected = tokOp | tokClose;
      while ((c == '.' || isDigit(c)) && i < s.length) {
        tok = tok + s.charAt(i);
        i++;
        c = s.charAt(i);
      }
    } else if (c >= 'a' && c <= 'z') {
      if ((expected & tokWord) === 0) {
        return; // ErrUnexpectedWord
      }
      expected = tokOp | tokOpen | tokClose;
      while ((isLetter(c) || isDigit(c) || c == '_') && i < s.length) {
        tok = tok + s.charAt(i);
        i++;
        c = s.charAt(i);
      }
    } else if (c == '(' || c == ')') {
      tok = tok + c;
      i++;
      if (c == '(' && (expected&tokOpen) !== 0) {
        expected = tokNumber | tokWord | tokOpen | tokClose;
      } else if (c == ')' && (expected&tokClose) !== 0) {
        expected = tokOp | tokClose;
      } else {
        return; // Bad parens
      }
    } else {
      if ((expected & tokOp) === 0) {
        if (c != '-' && c != '^' && c != '!') {
          return; // ErrOperandMissing
        }
        tok = tok + c + 'u';
        i++;
      } else {
        var lastOp = '';
        while (!isLetter(c) && !isDigit(c) && ! isSpace(c) &&
               c != '_' && c != '(' && c != ')' && i < s.length) {
          if (ops[tok + s.charAt(i)] > 0) {
            tok = tok + s.charAt(i);
            lastOp = tok;
          } else if (!lastOp) {
            tok = tok + s.charAt(i);
          } else {
            break;
          }
          i++;
          c = s.charAt(i);
        }
        if (!lastOp) {
          return; //ErrBadOp
        }
      }
      expected = tokNumber | tokWord | tokOpen;
    }
    tokens.push(tok);
  }
  return tokens;
}

var parenAllowed = 1;
var parenExpected = 2;
var parenForbidden = 3;

function parse(s, vars, funcs) {
  var os = [];
  var es = [];
  var as = [];

  vars = vars || {};
  funcs = funcs || {};

  var tokens = tokenize(s);
  if (!tokens) {
    return;
  }

  var paren = parenAllowed;
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    var parenNext = parenAllowed;
    if (token == '(') {
      if (paren == parenExpected) {
        as.push({osp: os.length, esp: es.length, args: []});
        os.push('{');
      } else if (paren == parenAllowed) {
        os.push('(');
      } else {
        return; // Bad call
      }
    } else if (paren == parenExpected) {
      return; // Bad call
    } else if (token == ')') {
      var minLength = (as.length > 0 ? as[as.length-1].osp : 0);
      while (os.length > minLength && os[os.length-1] != '(' && os[os.length-1] != '{') {
        var parenExpr = bind(os.pop(), funcs, es);
        if (!parenExpr) {
          return;
        }
        es.push(parenExpr);
      }
      if (os.length === 0) {
        return; // Bad parens
      }
      if (os.pop() == '{') {
        var name = os.pop();
        var f = funcs[name];
        var a = as.pop();
        var args = a.args;
        if (es.length > a.esp) {
          args.push(es.pop());
        }
        es.push(f.bind({}, args));
      }
      parenNext = parenForbidden;
    } else if (!isNaN(token)) {
      // TODO check if parse is correct to avoid 2.3.3
      var n = parseFloat(token);
      es.push(constExpr(n));
      parenNext = parenForbidden;
    } else if (funcs[token]) {
      os.push(token);
      parenNext = parenExpected;
    } else if (ops[token]) {
      if (token == ',' && os.length > 0 && os[os.length-1] == '{') {
        as[as.length-1].args.push(es.pop());
      } else {
        var op = ops[token];
        var o2 = os[os.length-1];
        while (ops[o2] !== 0 && ((isLeftAssoc(op) && op >= ops[o2]) || op > ops[o2])) {
          var expr = bind(o2, funcs, es);
          if (!expr) {
            return;
          }
          es.push(expr);
          os.pop();
          o2 = os[os.length-1];
        }
        os.push(token);
      }
    } else if (token.match(/^\D/)) {
      // Variable
      if (vars[token]) {
        es.push(vars[token]);
      } else {
        var v = varExpr(0);
        vars[token] = v;
        es.push(v);
      }
      parenNext = parenForbidden;
    } else {
      return; // Bad variable name, e.g. '2.3.4' or '4ever'
    }
    paren = parenNext;
  }

  if (paren == parenExpected) {
    return; // Bad call
  }
  while (os.length > 0) {
    var rest = os.pop();
    if (rest == '(' || rest == ')') {
      return; // Bad paren
    }
    var restExpr = bind(rest, funcs, es);
    if (!restExpr) {
      return;
    }
    es.push(restExpr);
  }
  if (es.length === 0) {
    return constExpr(0);
  } else {
    return es.pop();
  }
}

function bind(name, funcs, stack) {
  if (ops[name]) {
    if (isUnary(ops[name])) {
      if (stack[stack.length - 1] === undefined) {
        return; // Operand missing
      } else {
        return unaryExpr(ops[name], stack.pop());
      }
    } else {
      var b = stack.pop();
      var a = stack.pop();
      if (a === undefined || b === undefined) {
        return; // Binary operand missing
      }
      return binaryExpr(ops[name], a, b);
    }
  } else {
    return; // Bad call
  }
}

module.exports = {
  parse: parse,
  varExpr: varExpr,
  tokenize: tokenize
};
