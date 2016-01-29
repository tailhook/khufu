import Lexer from './baselexer';

const TOPLEVEL = 0;
const TOPLEVEL_KW = ["import", "from", "style", "view", "as"]
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
const VIEW_TEMPLATE = 16;   // ${vars} identifiers
const MATCHING_BRACKET = { '<': '>', '(': ')', '[': ']', '{': '}' }

function lex(value) {
    if(typeof value == 'string') {
        return lex(lexeme => value);
    } else {
        return function(lexeme) {
            this.yytext = lexeme;
            let old_state = this.state;
            let result = value.call(this, lexeme)
            if(result && result != 'NL') {
                this.newline = false;
            }
            if(old_state == this.state && this.state == VIEW_LINESTART) {
                this.state = VIEW;
            }
            return result;
        }
    }
}

function unquote(value) {
    return value.replace(/\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}/, function(x) {
        switch(x.charAt(1)) {
            case '"': return '"';
            case "'": return "'";
            case "b": return "\b";
            case "f": return "\f";
            case "n": return "\n";
            case "r": return "\r";
            case "t": return "\t";
            case "/": return "/";
            case "\\": return "\\";
            case "u": return String.fromCharCode(parseInt(x.substr(2), 16));
            default: return x;
        }
        return x
    })
}

export default function () {
    let lexer = new Lexer();

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
        if(lexeme == '<') {
            if(this.brackets.length == 0 && this.state == VIEW_LINESTART) {
                this.brackets.unshift(lexeme);
                this.state = VIEW_TAG;
            } else {
                this.reject = true;
            }
        } else {
            this.brackets.unshift(lexeme);
            if(this.state == VIEW_TAG) {
                this.state = VIEW;
            }
        }
        return lexeme;
    }), []);
    lexer.addRule(/[)}\]>]/, lex(function (lexeme) {
        this.yytext = lexeme;
        if(MATCHING_BRACKET[this.brackets[0]] != lexeme) {
            this.reject = true;
            return;
        }
        if(lexeme == '>') {
            if(this.brackets.length == 1 && this.brackets[0] == '<') {
                this.brackets.shift();
                this.state = VIEW;
            } else {
                this.reject = true;
            }
        } else {
            this.brackets.shift();
            if(this.brackets[0] == '<') {
                this.state = VIEW_TAG;
            }
        }
        return lexeme;
    }), []);

    lexer.addRule(/"(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
        lex(function (lex) {
            this.yytext = unquote(lex.substr(1, lex.length-2));
            return 'STRING';
        }), [TOPLEVEL, VIEW, VIEW_TAG, VIEW_LINESTART, VIEW_TEMPLATE]);
    lexer.addRule(/'(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^'\\])*'/,
        lex(function (lex) {
            this.yytext = unquote(lex.substr(1, lex.length-2));
            return 'STRING';
        }), [TOPLEVEL, VIEW, VIEW_TAG, VIEW_LINESTART, VIEW_TEMPLATE]);

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

    let css_esc = "\\\\[^\\n0-9a-fA-F]|\\\\[0-9a-fA-F]{1,6} ?"
    let css_ident = "-?" +
        `(?:[a-zA-Z_\\u0080-\\uffff]|${css_esc})` +
        `(?:[a-zA-Z_0-9\\u0080-\\uffff-]|${css_esc})*`
    let css_number =
        "[+-]?(?:[0-9]+\\.[0-9]+|[0-9]+|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?"
    let css_unquoted =
        "(?:[^\"'()\\s\\u0000-\\u0008\\u000b\\u000e-\\u001f\\u007f]" +
        `|${css_esc})*`
    let css_string = `(?:"(?:[^"\\\\\\n]|${css_esc}|\\\\\\n)*"` +
                     `|'(?:[^'\\\\\\n]|${css_esc}|\\\\\\n)*')`


    lexer.addRule(/[:.,]/, lex(x => x), [STYLE]);
    lexer.addRule(new RegExp(css_ident), lex("IDENT_TOKEN"), [STYLE]);

    lexer.addRule(new RegExp(css_number), lex("NUMBER"), [STYLE]);

    lexer.addRule(new RegExp(css_number + css_ident),
        lex("DIMENSION"), [STYLE]);
    lexer.addRule(new RegExp(css_number + '%'),
        lex("PERCENTAGE_TOKEN"), [STYLE]);

    lexer.addRule(new RegExp("url\\(\\s*(?:" +
        css_string + "|" + css_unquoted + ")\s*\\)"),
        lex("URL"), [STYLE]);
    lexer.addRule(new RegExp("#(?:[a-zA-Z_0-9\\u0080-\\uffff-]|${css_esc})*"),
        lex("HASH_TOKEN"), [STYLE]);

    /********************* View tokens ***************************/

    lexer.addRule(/->/, lex(x => x), [VIEW, VIEW_LINESTART]);
    lexer.addRule(/<-/, lex(x => x), [VIEW, VIEW_LINESTART]);
    lexer.addRule(/[!=][=][=]/, lex(x => x),
        [VIEW, VIEW_LINESTART, VIEW_TEMPLATE]);
    lexer.addRule(/[><!=]\=/, lex(x => x),
        [VIEW, VIEW_LINESTART, VIEW_TEMPLATE]);
    lexer.addRule(/[|:,.*+/%=<>!?-]/, lex(x => x),
        [VIEW, VIEW_LINESTART, VIEW_TEMPLATE]);
    lexer.addRule(/[a-zA-Z_][a-zA-Z0-9_]*/, lex(function(lexeme) {
        if(VIEW_KW.indexOf(lexeme) >= 0) {
            return lexeme;
        } else {
            return 'IDENT';
        }
    }), [VIEW, VIEW_LINESTART, VIEW_TEMPLATE]);
    lexer.addRule(/@[a-zA-Z_][a-zA-Z0-9_]*/, lex(function(lexeme) {
        this.yytext = lexeme.substr(1);
        return 'STORE';
    }), [TOPLEVEL, VIEW, VIEW_LINESTART, VIEW_TAG, VIEW_TEMPLATE]);
    lexer.addRule(/[a-zA-Z_][a-zA-Z0-9_-]*/, lex('TAG_NAME'), [VIEW_TAG]);
    lexer.addRule(/[=.?+-]/, lex(x => x), [VIEW_TAG]);
    lexer.addRule(new RegExp(
        "(?:[0-9]|[1-9][0-9]+)" +  // integer part
        "(?:\\.[0-9]+)?" +           // fractional part
        "(?:[eE][-+]?[0-9]+)?\\b"),      // exponent
        lex("NUMBER"), [VIEW, VIEW_TAG, VIEW_LINESTART, VIEW_TEMPLATE])
    lexer.addRule(
        /`(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|\$(?!\{)|[^$`\\])*(?:`|\$\{)/,
        lex(function (lex) {
            if(lex.charAt(lex.length-1) == '`') {
                this.yytext = unquote(lex.substr(1, lex.length-2));
                return 'STRING';
            } else {
                this.yytext = unquote(lex.substr(1, lex.length-3));
                this.templates += 1;
                this.state = VIEW_TEMPLATE;
                return 'TEMPLATE_BEGIN';
            }
        }), [VIEW, VIEW_TAG, VIEW_LINESTART]);
    lexer.addRule(
        /}(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|\$(?!\{)|[^$`\\])*(?:`|\$\{)/,
        lex(function (lex) {
            if(lex.charAt(lex.length-1) == '`') {
                this.yytext = unquote(lex.substr(1, lex.length-2));
                this.templates -= 1;
                if(!this.templates) {
                    if(this.brackets[0] == '<') {
                        this.state = VIEW_TAG;
                    } else {
                        this.state = VIEW;
                    }
                }
                return 'TEMPLATE_END';
            } else {
                this.yytext = unquote(lex.substr(1, lex.length-3));
                return 'TEMPLATE_INTER';
            }
        }), [VIEW_TEMPLATE]);

    return lexer.factory();
}
