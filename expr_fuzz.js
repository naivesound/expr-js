var assert = require('assert');
var expr = require('./expr');

var exitcode = 0;

var symbols = [
  '(',
  ')',
  'f(',
  '1',
  '12',
  '-',
  '*',
  '|',
  '&',
  '=',
  '>',
  'x'
];

function exprFunc(args) {
  if (args[0]) {
    if (args[1]) {
      return args[0]() + args[1]();
    } else {
      return args[0]()
    }
  } else {
    return 0;
  }
}

function randomExpr() {
  this.set = this.set || {};
  var s = '';
  var l = Math.random() * 100;
  for (var x = 0; x < l; x++) {
    s = s + symbols[0|(Math.random()*symbols.length)];
  }
  s = s.replace(/--/g, '')
    .replace(/-=/g, '=').replace(/&=/, '=')
    .replace(/x+/g, 'x').replace(/x\d+/g, 'x').replace(/x+/g, 'x');
  if (!this.set[s]) {
    this.set[s] = true;
    return s;
  } else {
    return randomExpr();
  }
}

function fuzz(n) {
  var stats = {
    yy: 0,
    yn: 0,
    ny: 0,
    nn: 0,
    neq: 0,
  };
  for (var i = 0; i < n; i++) {
    var e = randomExpr();
    var ok = false;
    var expect = undefined;
    var vars = {};
    try {
      x = 0;
      expect = eval('function f(a,b){return (a||0)+(b||0)};'+e);
      ok = true;
    } catch (err) {
    }

    if (ok && expect !== undefined) {
      var f = expr.parse(e, vars, {f: exprFunc});
      if (!f) {
        stats.yn++;
        console.log('??', e, expect);
      } else {
        var result = f();
        if (result != expect) {
          stats.neq++;
          console.log('<>', e, expect, result);
        } else {
          stats.yy++;
          //console.log('OK', e, expect, result);
        }
      }
    } else {
      var f = expr.parse(e, {}, {f: exprFunc});
      if (f) {
        console.log('!!', e, expect, f());
        stats.ny++;
      } else {
        stats.nn++;
        continue;
      }
    }
  }
  return stats;
}

console.log(fuzz(1000000));

process.exit(exitcode);
