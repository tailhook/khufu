import Lexer from 'lex';

const TOPLEVEL = 0;
const TOPLEVEL_KW = new Set(["import", "from", "style", "view"])

export default function () {
    let lexer = new Lexer();

    lexer.showPosition = function() {
        let lex = this.original_lexeme
        let prefix = /(?:\n|^)(.*)$/.exec(this.input.substr(0, this.index))[1];
        let suffix = /.*$/m.exec(this.input.substr(this.index))[0];
        let indent = prefix.substr(0, prefix.length - lex.length)
        return (prefix + suffix + "\n" +
            indent.replace(/./g, ' ') + lex.replace(/./g, '^') + ' ---')
    }
    let old_set_input = lexer.setInput;
    lexer.setInput = function(x) {
        this.yylineno = 0;
        this.bracket_level = 0;
        this.original_lexeme = '';
        old_set_input.call(this, x)
    }
    lexer.addRule(/[a-zA-Z_][a-zA-Z0-9_]*/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        if(TOPLEVEL_KW.has(lexeme)) {
            return lexeme;
        } else {
            return 'IDENT';
        }
    }, [TOPLEVEL]);

    lexer.addRule(/\n/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        this.yylineno += 1;
        if(this.bracket_level == 0) {
            return 'NL';
        }
    }, [TOPLEVEL]);
    lexer.addRule(/[ \t]+/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
    }, []);

    lexer.addRule(/[/*+\\-^,\\.]/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        return lexeme;
    }, [TOPLEVEL]);


    lexer.addRule(/"(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/, function (lex) {
        this.original_lexeme = lex;
        this.yytext = lex.substr(1, lex.length-2);
        return 'STRING';
    }, [TOPLEVEL]);
    lexer.addRule(/'(?:\\["'bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^'\\])*'/, function (lex) {
        this.original_lexeme = lex;
        this.yytext = lex.substr(1, lex.length-2);
        return 'STRING';
    }, [TOPLEVEL]);

    lexer.addRule(/[({[]/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        this.bracket_level += 1;
        return lexeme;
    }, [TOPLEVEL]);
    lexer.addRule(/[\]})]/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        if(this.bracket_level < 1) {
            this.reject = true;
            return;
        }
        this.bracket_level -= 1;
        return lexeme;
    }, [TOPLEVEL]);

    lexer.addRule(/$/, function () {
        this.original_lexeme = '';
        this.yytext = '';
        if(this.state != TOPLEVEL) {
            this.reject = true;
        } else {
            return ['NL', 'EOF'];
        }
    }, []);

    return lexer;
}

/*
    "lex": {
        "macros": {
            "digit": "[0-9]",
            "esc": "\\\\",
            "int": "-?(?:[0-9]|[1-9][0-9]+)",
            "exp": "(?:[eE][-+]?[0-9]+)",
            "frac": "(?:\\.[0-9]+)"
        },
        "rules": [
           ["[ \t]+",                    "/ * skip whitespace * /"],
           ["{int}{frac}?{exp}?\\b", "return 'NUMBER';"],
           ["\"(?:{esc}[\"'bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"'{esc}])*\"",
                "yytext = yytext.substr(1,yyleng-2); return 'STRING';"],
           ["'(?:{esc}[\"'bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"'{esc}])*'",
                "yytext = yytext.substr(1,yyleng-2); return 'STRING';"],
           ["[/*+\\-^(){},\\.]",                     "return yytext;"],
           ["import",                  "return 'import';"],
           ["from",                    "return 'from';"],
           ["\\w+",                     "return 'IDENT';"],
           ["\\n",                     "return 'EOL';"],
           ["$",                     "return ['EOL', 'EOF'];"],
        ]
    },
*/
