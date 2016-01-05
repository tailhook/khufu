import {Parser} from 'jison'
import Lexer from './lexer'

export var parser = new Parser({

    "operators": [
        ["left", "+", "-"],
        ["left", "*", "/"],
        ["left", "^"],
        ["left", "UMINUS"]
    ],
    "tokens": "import from { } ( ) + - * / ^ , . IDENT NL",
    "start": "file",

    "bnf": {
        "file": [
            ["statements EOF", "return $1;"],
        ],
        "statements": [
            ["statement statements", "$$ = [$1].concat($2);" ],
            ["", "$$ = [];" ],
        ],
        "statement": [
            ["import { names } from STRING NL",
                "$$ = ['import_names', $3, $6];"],
            ["import IDENT from STRING NL",
                "$$ = ['import_default', $2, $4];"],
        ],
        "names": [
            ["IDENT , names", "$$ = [$1].concat($3);"],
            ["IDENT", "$$ = [$1];"],
        ],
        "e" :[
              [ "e + e",   "$$ = ['add', $1, $3];" ],
              [ "e - e",   "$$ = ['sub', $1, $3];" ],
              [ "e * e",   "$$ = ['mul', $1, $3];" ],
              [ "e / e",   "$$ = ['div', $1, $3];" ],
              [ "e ^ e",   "$$ = ['pow', $1, $3];" ],
              [ "- e",     "$$ = ['minus', $2];", {"prec": "UMINUS"} ],
              [ "( e )",   "$$ = $2;" ],
              [ "NUMBER",  "$$ = Number(yytext);" ],
        ],
    }
})
parser.lexer = new Lexer()
