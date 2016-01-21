// The code here is derived from https://github.com/aaditmshah/lexer
//
// The original code have the following copyright:
//
// The MIT License (MIT)

// Copyright (c) 2013 Aadit M Shah
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//


export default class Lexer {
    constructor() {
        this._rules = []
    }

    addRule(pattern, action, start) {
        var global = pattern.global;

        if (!global) {
            var flags = "g";
            if (pattern.multiline) flags += "m";
            if (pattern.ignoreCase) flags += "i";
            pattern = new RegExp(pattern.source, flags);
        }

        if (Object.prototype.toString.call(start) !== "[object Array]") start = [0];

        this._rules.push({
            pattern: pattern,
            global: global,
            action: action,
            start: start
        });

        return this;
    }

    factory() {
        let proto = Object.create(new LexerInstance)
        proto._rules = this._rules.slice();
        return proto
    }
}

class LexerInstance {

    setInput(input) {
        this._tokens = [];
        this._remove = 0;
        this.state = 0;
        this.index = 0;
        this.input = input;
        this.yylineno = 1;
        this.column = 1;
        this.brackets = [];
        this.templates = 0;
        this.original_lexeme = '';
        this.indent = [0];
        this.newline = true;
    }

    showPosition() {
        let lex = this.original_lexeme || ''
        let prefix = /(?:\n|^)(.*)$/.exec(this.input.substr(0, this.index))[1]
        let suffix = /.*$/m.exec(this.input.substr(this.index))[0]
        let indent = prefix.substr(0, prefix.length - lex.length)
        let arrow = lex.replace(/[\s\S]/g, '^') || '^'
        let ln = this.yylineno + ': ';
        return (ln + prefix + suffix + "\n" +
            ln + indent.replace(/[\s\S]/g, ' ') + arrow + ' ---')
    }

    defunct(chr) {
        throw Error('Unexpected character "' + chr + '"\n' +
            this.showPosition())
    }

    lex() {
        var old_index = this.index;
        var token = this._lex()
        let loc = {
            first_line: this.yylineno,
            first_column: this.column,
        }
        this.original_lexeme = this.input.substr(
            old_index, this.index - old_index);
        for(var i of this.original_lexeme) {
            if(i == '\n') {
                this.yylineno += 1;
                this.column = 1;
            } else if(i == '\t') {
                this.column += 8;
            } else {
                this.column += 1;
            }
        }
        this.yylloc = {
            last_column: this.column,
            last_line: this.yylineno,
            ...loc}
        return token;
    }

    _lex() {
        if (this._tokens.length) return this._tokens.shift();

        this.reject = true;

        while (this.index <= this.input.length) {
            var matches = this._scan().splice(this._remove);
            var index = this.index;

            while (matches.length) {
                if (this.reject) {
                    var match = matches.shift();
                    var result = match.result;
                    var length = match.length;
                    this.index += length;
                    this.reject = false;
                    this._remove++;

                    var token = match.action.apply(this, result);
                    if (this.reject) this.index = result.index;
                    else if (typeof token !== "undefined") {
                        switch (Object.prototype.toString.call(token)) {
                        case "[object Array]":
                            this._tokens = token.slice(1);
                            token = token[0];
                        default:
                            if (length) this._remove = 0;
                            return token;
                        }
                    }
                } else break;
            }

            var input = this.input;

            if (index < input.length) {
                if (this.reject) {
                    this._remove = 0;
                    var token = this.defunct(input.charAt(this.index++));
                    if (typeof token !== "undefined") {
                        if (Object.prototype.toString.call(token) === "[object Array]") {
                            this._tokens = token.slice(1);
                            return token[0];
                        } else return token;
                    }
                } else {
                    if (this.index !== index) this._remove = 0;
                    this.reject = true;
                }
            } else if (matches.length)
                this.reject = true;
            else break;
        }
    }

    _scan() {
        var matches = [];
        var index = 0;

        var state = this.state;
        var lastIndex = this.index;
        var input = this.input;

        for (var i = 0, length = this._rules.length; i < length; i++) {
            var rule = this._rules[i];
            var start = rule.start;
            var states = start.length;

            if ((!states || start.indexOf(state) >= 0) ||
                (state % 2 && states === 1 && !start[0])) {
                var pattern = rule.pattern;
                pattern.lastIndex = lastIndex;
                var result = pattern.exec(input);

                if (result && result.index === lastIndex) {
                    var j = matches.push({
                        result: result,
                        action: rule.action,
                        length: result[0].length
                    });

                    if (rule.global) index = j;

                    while (--j > index) {
                        var k = j - 1;

                        if (matches[j].length > matches[k].length) {
                            var temple = matches[j];
                            matches[j] = matches[k];
                            matches[k] = temple;
                        }
                    }
                }
            }
        }

        return matches;
    }
}
