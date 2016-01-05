import Lexer from 'lex';

const TOPLEVEL = 0;
const TOPLEVEL_KW = new Set(["import", "from", "style", "view"])
const STYLE = 2;

export default function () {
    let lexer = new Lexer();

    lexer.showPosition = function() {
        let lex = this.original_lexeme
        let prefix = /(?:\n|^)(.*)$/.exec(this.input.substr(0, this.index))[1]
        let suffix = /.*$/m.exec(this.input.substr(this.index))[0]
        let indent = prefix.substr(0, prefix.length - lex.length)
        let arrow = lex.replace(/./g, '^') || '^'
        return (prefix + suffix + "\n" +
            indent.replace(/./g, ' ') + arrow + ' ---')
    }
    let old_set_input = lexer.setInput;
    lexer.setInput = function(x) {
        this.yylineno = 0;
        this.bracket_level = 0;
        this.original_lexeme = '';
        this.indent = [0];
        old_set_input.call(this, x)
    }

    /********************* Common tokens *****************************/

    /// this rule must be first
    lexer.addRule(/^[\t ]*/gm, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        if(this.bracket_level != 0) {
            return;
        }
        var indentation = lexeme.length;

        if (indentation > this.indent[0]) {
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
                throw Error(`Invalid indentation expected
                    ${this.indent[0]}, got ${indentation}`)
            }
        }
        if(this.indent[0] == 0) {
            this.state = TOPLEVEL;
        }

        if (tokens.length) return tokens;
    }, []);

    lexer.addRule(/[ \t]+/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
    }, []);

    lexer.addRule(/\n?$/, function () {
        this.original_lexeme = '';
        this.yytext = '';
        let tokens = ['NL']
        while(this.indent.length > 1) {
            tokens.push("DEDENT")
            this.indent.shift()
        }
        tokens.push('EOF')
        return tokens
    }, []);

    lexer.addRule(/\n+/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        this.yylineno += 1;
        if(this.bracket_level == 0) {
            return 'NL';
        }
    }, []);

    /********************* Toplevel tokens ***************************/

    lexer.addRule(/[a-zA-Z_][a-zA-Z0-9_]*/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        if(TOPLEVEL_KW.has(lexeme)) {
            switch(lexeme) {
                case "style":
                    this.state = STYLE;
                    break;
            }
            return lexeme;
        } else {
            return 'IDENT';
        }
    }, [TOPLEVEL]);

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

    /********************* Style tokens ***************************/

    lexer.addRule(/[:]/, function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        return lexeme;
    }, [STYLE]);
    lexer.addRule(new RegExp("-?" +
        "(?:[a-zA-Z_\u0080-\uffff]|\\[^\n0-9a-fA-F]|\\[0-9a-fA-F]{1,6} ?)" +
        "(?:[a-zA-Z_0-9\u0080-\uffff-]|\\[^\n0-9a-fA-F]|\\[0-9a-fA-F]{1,6} ?)*"),
    function (lexeme) {
        this.original_lexeme = lexeme;
        this.yytext = lexeme;
        return "IDENT_TOKEN";
    }, [STYLE]);


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
