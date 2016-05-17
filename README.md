# expr.js

[![Build Status](https://travis-ci.org/naivesound/expr.js.svg?branch=master)](https://travis-ci.org/naivesound/expr.js)

Fast expression evaluator in JavaScript.

Originally created for http://naivesound.com/glitch to replace the standard
`eval()` which is slow and insecure.

## Install

```
npm install github:naivesound/expr-js
```

## Example

```javascript
var expr = require('expreval');

// Define variables
var variables = {'a': expr.varExpr(3), 'b': expr.varExpr(5)};

// Define custom functions
var functions = {
	'add': function(a, b) {
		return a() + b();
	}
}

// Compile expression string (returns undefined on syntax errors)
var e = expr.parse('add(a*2, b)', variables, functions);

// Evaluate expression
var result = e();
console.log("Result = ", result); // Prints 11
```

## Variables

Variables are just functions, when called without arguments - it returns
current value, when called with an arguments - it updates the value.

```javasccript
var expr = require('expreval');
var a = expr.varExpr(0);

a(42); // change variable

var e = expr.parse('a = a + 1', {'a': a});
e();
console.log(a()); // prints 43

a(0);
e();
console.log(a()); // prints 1
```

## Functions

Functions are just normal JS functions. You will have to evaluate all arguments
manually, that's how you can get `if(cond, then, else)` fnuctions and similar
lazy-evaluated ones:

```javascript
var expr = require('expreval');
var ifthen = function(cond, y, n) {
	if (cond()) {
		return y();
	} else {
		return n();
	}
}
var e = expr.parse('ifthen(5 > 3, 42, 100)', {}, {'ifthen': ifthen})
console.log(e()); // prints 42
```

## Mathematical operators

```
# Basic math:

2      -> 2
-2     -> -2
12+2   -> 14
12-2   -> 10
12/2   -> 6
12%7   -> 5 (modulo, remainder)
12**2  -> 144 (power)

# Bitwise operators

3|4    -> 15
2&7    -> 2
2^7    -> 5
^7     -> -8 (binary negation)

# Logical operators

2&&0   -> 0
2||0   -> 1
a()&&b()||c()  -> a() ? b() : c() (short-circuit)

# Parens

(2+3)*4 -> 20

# Assignment

a=2+3   -> 5, also puts "5" into variable "a"

# Comma

a=2+3,a=a+1,a*2  -> 12 (sequential execution, returns last retult)
```

## Performance

Node performance of the native `eval` seems to be pretty good (because JIT
knows that I'm going to evaluate the same constant string many times), but
browsers are still very slow.

Here's the results of parsing and evaluating one expression (28 chars), ten
expressions contatenated into one and 100 expressions concatenated into one
(~3k chars).

```
parse   1 0.0288
parse  10 0.2023
parse 100 1.9551
eval   1 0.0009
eval  10 0.003
eval 100 0.0316
native   1 0.075
native  10 0.2015
native 100 1.116
```

Parsing is not so fast, but evaluation of the compiled expressions beats
browser's `eval` by at least 30 times. Also remember that `eval` can be
insecure, while `expr` narrows down the scope to a list of allowed functions
and variables.

## License

Code is distributed under MIT license, feel free to use it in your proprietary projects as well.

