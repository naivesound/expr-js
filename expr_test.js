var assert = require('assert');
var expr = require('./expr');

var exitcode = 0;

function test(dict, vars, funcs) {
  for (var key in dict) {
    if (dict.hasOwnProperty(key)) {
      var expected = dict[key];
      var e = expr.parse(key, vars, funcs);
      if (!e && expected !== undefined) {
	console.log('Parse failed:', e);
	exitcode = 1;
      } else {
	var res = (e ? e() : undefined);
	if (res != expected) {
	  console.log('Expr failed: {', key, '} expected', expected, 'got', res);
	  exitcode = 1;
	}
      }
    }
  }
}

function testSetup() {
  assert(expr.parse);
  assert(expr.varExpr);
}

function testNumbers() {
  test({
    '': 0,
    '2': 2,
    '2.3': 2.3,
    '(2)': 2,
    '(((2)))': 2,
    'x': 42,
    '(x)': 42,
  }, {x: expr.varExpr(42)});
}

function testUnary() {
  test({
    '-2': -2,
    '^2': -3,
    '!2': 0,
    '!0': 1,
  });
}

function testBinary() {
  test({
    '3+2': 5,
    '3/2': 1.5,
    '(3/2)|0': 1, // bitwise converts to int
    '2+3/2': 2+3/2,
    '6/2+8*4/2': 19,
    '2*x': 10,
    '2/x': 2/5,
  }, {x: expr.varExpr(5)});
}

function testComma() {
  test({
    '2, 3, 5':  5,
    '2+3, 5*3': 15,
  });
}

function testAssign() {
  test({
    'z=10':     10,
    'y=10,x+y': 15,
    "w=(w!=0)": 0,
  }, {x: expr.varExpr(5)});
}

function testFunc() {
  test({
    "2+add3(3, 7, 9)":     21,
    "next(4)":             5,
    "next(nop())":         1,
    "next(next(4))":       6,
    "next((2,4))":         5,
    "next(1, (2,4))":      2,
    "next((2,4),1)":       5,
    "2+add3(3, add3(1, 2, 3), 9)": 20,

    "nop()":    0,
    "nop()+nop()":    0,
    "nop((1,(nop())))":    0,
    "nop(1)":   0,
    "nop((1))": 0,
    "1,nop()": 0,
  }, {}, {
    "add3": function(args) { return args[0]()+args[1]()+args[2](); },
    "nop": function() {return 0;},
    "next": function(args) {return args[0]()+1;},
  });
}

function testFuncContext() {
  var incr = function(args) {
    this.value = (this.value||0) + args[0]();
    return this.value;
  };
  test({"incr(3)+incr(2)":5}, {}, {incr: incr})
}

function testParseErrors() {
  test({
    "(": undefined,
    ")": undefined,
    "),": undefined,
    ")+(": undefined,
    "+(": undefined,
    "f(": undefined,
    "1=x,": undefined,
    "1=x)": undefined,
    "1)": undefined,
    "2=3": undefined,
    "2@3": undefined,

    "1()": undefined,
    ",f(x)": undefined,
    ",": undefined,
    "1,,2": undefined,
    "f(,x)": undefined,
    "f(x=)>1": undefined,

    "1x": undefined,
    "1 x": undefined,
    "1 1": undefined,

    "2+": undefined,
    "+2": undefined,
    "+": undefined,
    "-": undefined,
    "1++": undefined,

    "+,": undefined,
    "xfx((f1))": undefined,
  }, {}, {});
}

testSetup();
testNumbers();
testUnary();
testBinary();
testComma();
testAssign();
testFunc();
testFuncContext();

testParseErrors();

// Call this functions to get a random list of valid expressions
function testFuzz() {
  var funcs = {'f': function() { return 1; }};
  var sym = "()+,1x>=f*";
  var set = {};
  for (var i = 0; i < 100000; i++) {
    var s = "";
    var l = Math.random() * 100;
    for (var x = 0; x < l; x++) {
      s = s + sym[0|(Math.random()*sym.length)];
    }
    var e = expr.parse(s, {}, funcs);
    if (e && !set[s])  {
      set[s] = true;
      console.log(s);
    }
  }
}

process.exit(exitcode);
