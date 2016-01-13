import Lexer from 'lex';

const TOPLEVEL = 0;
const TOPLEVEL_KW = ["import", "from", "style", "view"]
const NEWLINE = 1;
const VIEW_KW = [
    "store", "link", "let",
    "and", "or", "not",
    "for", "in", "of", "key", "if", "else", "elif",
    ... TOPLEVEL_KW]  // reserve them for better error reporting
const STYLE = 2;
const VIEW = 10;
const VIEW_LINESTART = 12;  // "<" at tag open
const VIEW_TAG = 14;        // "abc-def" identifiers
const MATCHING_BRACKET = { '<': '>', '(': ')', '[': ']', '{': '}' }

function lex(value) {
    if(typeof value == 'string') {
        return lex(lexeme => value);
    } else {
        return function(lexeme) {
            for(var i of lexeme) {
                if(i == '\n') {
                    this.yylineno += 1;
                }
            }
            this.original_lexeme = lexeme;
            this.yytext = lexeme;
            let old_state = this.state;
            let result = value.call(this, lexeme)
            if(result && result != 'NL') {
                this.newline = false;
            }
            if(old_state == this.state && this.state == VIEW_LINESTART) {
                this.state == VIEW;
            }
            return result;
        }
    }
}

export default function () {
    let lexer = new Lexer();

    lexer.showPosition = function() {
        let lex = this.original_lexeme || ''
        let prefix = /(?:\n|^)(.*)$/.exec(this.input.substr(0, this.index))[1]
        let suffix = /.*$/m.exec(this.input.substr(this.index))[0]
        let indent = prefix.substr(0, prefix.length - lex.length)
        let arrow = lex.replace(/./g, '^') || '^'
        let ln = this.yylineno + ':';
        return (ln + prefix + suffix + "\n" +
            ln + indent.replace(/./g, ' ') + arrow + ' ---')
    }
    let old_set_input = lexer.setInput;
    lexer.setInput = function(x) {
        this.yylineno = 0;
        this.brackets = [];
        this.original_lexeme = '';
        this.indent = [0];
        this.newline = true;
        old_set_input.call(this, x)
    }
    let original_lex = lexer.lex;
    lexer.lex = function() {
        try {
            return original_lex.call(this)
        } catch(e) {
            throw Error(e.message + '\n' + this.showPosition())
        }
    }

    /********************* Common tokens *****************************/

    lexer.addRule(/\/\/.*$/m, lex(() => {}), []);
    lexer.addRule(/^\s*\/\/.*\n/m, lex(() => {}), []);
    /// The order of whitespace rules matter
    lexer.addRule(/\s*$/g, lex(function(lexeme) {
        let tokens = ['NL']
        while(this.indent.length > 1) {
            tokens.push("DEDENT")
            this.indent.shift()
        }
        tokens.push('EOF')
        return tokens
    }), []);

    lexer.addRule(/\n/g, lex(function (lexeme) {
        if(this.brackets.length == 0 && !this.newline) {
            this.newline = true;
            return 'NL';
        }
    }), []);

    lexer.addRule(/^[\t ]*/gm, lex(function(lexeme) {
        if(this.brackets.length != 0) {
            return;
        }
        var indentation = lexeme.length;

        if(this.state == VIEW) {
            this.state = VIEW_LINESTART;
        }
        if(indentation > this.indent[0]) {
            this.indent.unshift(indentation);
            return "INDENT";
        }

        var tokens = [];

        if(indentation < this.indent[0]) {
            while (indentation < this.indent[0]) {
                tokens.push("DEDENT");
                this.indent.shift();
            }
            if(indentation != this.indent[0]) {
                throw Error("Invalid indentation, expected " +
                    `${this.indent[0]}, got ${indentation}`)
            }
        }
        if(this.indent[0] == 0) {
            this.state = TOPLEVEL;
        }

        if (tokens.length) return tokens;
    }), []);

    lexer.addRule(/[ \t]+/, lex(() => {}), []);

    lexer.addRule(/[({\[<]/, lex(function (lexeme) {
        this.brackets.unshift(lexeme);
        if(lexeme == '<' && this.brackets.length == 1) {
            if(this.state == VIEW_LINESTART) {
                this.state = VIEW_TAG;
            } else {
                this.reject = true;
            }
        } else {
            if(this.state == VIEW_TAG) {
                this.state = VIEW;
            }
        }
        return lexeme;
    }), []);
    lexer.addRule(/[)}\]>]/, lex(function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        if(MATCHING_BRACKET[this.brackets[0]] != lexeme) {
            this.reject = true;
            return;
        }
        if(lexeme == '>' && this.brackets.length == 1) {
            this.state = VIEW;
        }
        this.brackets.shift();
        if(this.brackets[0] == '>') {
            this.state = VIEW_TAG;
        }
        return lexeme;
    }), []);

    lexer.addRule(/"(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
        lex(function (lex) {
            // TODO(tailhook) unescape
            this.yytext = lex.substr(1, lex.length-2);
            return 'STRING';
        }), [TOPLEVEL, VIEW, VIEW_TAG, VIEW_LINESTART]);
    lexer.addRule(/'(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^'\\])*'/,
        lex(function (lex) {
            // TODO(tailhook) unescape
            this.yytext = lex.substr(1, lex.length-2);
            return 'STRING';
        }), [TOPLEVEL, VIEW, VIEW_TAG, VIEW_LINESTART]);

    /********************* Toplevel tokens ***************************/

    lexer.addRule(/[a-zA-Z_][a-zA-Z0-9_]*/, lex(function (lexeme) {
        if(TOPLEVEL_KW.indexOf(lexeme) >= 0) {
            switch(lexeme) {
                case "style":
                    this.state = STYLE;
                    break;
                case "view":
                    this.state = VIEW;
                    break;
            }
            return lexeme;
        } else {
            return 'IDENT';
        }
    }), [TOPLEVEL]);

    lexer.addRule(/[/*+\\-^,\\.]/, lex(lexeme => lexeme), [TOPLEVEL]);

    /********************* Style tokens ***************************/

    lexer.addRule(/[:]/, lex(x => x), [STYLE]);
    lexer.addRule(new RegExp("-?" +
        "(?:[a-zA-Z_\u0080-\uffff]|\\[^\n0-9a-fA-F]|\\[0-9a-fA-F]{1,6} ?)" +
        "(?:[a-zA-Z_0-9\u0080-\uffff-]|\\[^\n0-9a-fA-F]|\\[0-9a-fA-F]{1,6} ?)*"),
    lex("IDENT_TOKEN"), [STYLE]);

    /********************* View tokens ***************************/

    lexer.addRule(/->/, lex(x => x), [VIEW, VIEW_LINESTART]);
    lexer.addRule(/<-/, lex(x => x), [VIEW, VIEW_LINESTART]);
    lexer.addRule(/[:,.*+/=<>!-]/, lex(x => x), [VIEW, VIEW_LINESTART]);
    lexer.addRule(/[a-zA-Z_][a-zA-Z0-9_]*/, lex(function(lexeme) {
        if(VIEW_KW.indexOf(lexeme) >= 0) {
            return lexeme;
        } else {
            return 'IDENT';
        }
    }), [VIEW, VIEW_LINESTART]);
    lexer.addRule(/@[a-zA-Z_][a-zA-Z0-9_]*/, lex(function(lexeme) {
        this.yytext = lexeme.substr(1);
        return 'STORE';
    }), [VIEW, VIEW_LINESTART, VIEW_TAG]);
    lexer.addRule(/[a-zA-Z_][a-zA-Z0-9_-]*/, lex('TAG_NAME'), [VIEW_TAG]);
    lexer.addRule(/[=.?]/, lex(x => x), [VIEW_TAG]);
    lexer.addRule(new RegExp(
        "-?(?:[0-9]|[1-9][0-9]+)" +  // integer part
        "(?:\\.[0-9]+)?" +           // fractional part
        "(?:[eE][-+]?[0-9]+)?\\b"),      // exponent
        lex("NUMBER"), [VIEW, VIEW_TAG, VIEW_LINESTART])

    return lexer;
}
