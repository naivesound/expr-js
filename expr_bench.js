var expr = require('./expr');

var formula = 'x=2+3*(x/(42+plusone(x))),x';

function bench(name, n, iter, evaluate) {
  var s = '0';
  for (var i = 0; i < n; i++) {
    s = s + ',' + formula;
  }
  var incr = function(x) {
    this.value = (this.value||0) + x();
    return this.value;
  };
  var vars = {};
  var funcs = {'plusone': incr};
  if (evaluate) {
    var e = expr.parse(s, vars, funcs);
    var start = new Date().getTime();
    for (var i = 0; i < iter; i++) {
      e();
    }
    console.log(name, (new Date().getTime() - start) / iter);

  } else {
    var start = new Date().getTime();
    for (var i = 0; i < iter; i++) {
      var e = expr.parse(s, vars, funcs);
    }
    console.log(name, (new Date().getTime() - start) / iter);
  }
}

function nativeBench(name, n, iter) {
  var s = '0';
  for (var i = 0; i < n; i++) {
    s = s + ',' + formula;
  }
  var plusone = function(x) {
    this.value = (this.value||0) + x;
    return this.value;
  };
  var x = 0;
  var start = new Date().getTime();
  for (var i = 0; i < iter; i++) {
    eval(s);
  }
  console.log(name, (new Date().getTime() - start) / iter);
}

//bench('parse   1', 1, 10000, false);
//bench('parse  10', 10, 10000, false);
//bench('parse 100', 100, 10000, false);

//bench('eval   1', 1, 10000, true);
//bench('eval  10', 10, 10000, true);
//bench('eval 100', 100, 10000, true);

nativeBench('native   1', 1, 100);
nativeBench('native  10', 10, 10000);
nativeBench('native 100', 100, 10000);
