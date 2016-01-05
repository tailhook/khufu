import {Parser} from 'jison'
import Lexer from './lexer'

export var parser = new Parser({

    "operators": [
        ["left", "+", "-"],
        ["left", "*", "/"],
        ["left", "^"],
        ["left", "UMINUS"]
    ],
    "tokens": "import from style view " +
        "{ } ( ) + - * / ^ , . : " +
        "INDENT DEDENT IDENT NL" +
        // CSS
        "IDENT_TOKEN",
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
            ["style : NL INDENT rules DEDENT", "$$ = ['style', $5];"],
            ["style : NL", "$$ = ['style', []]"],
        ],
        "names": [
            ["IDENT , names", "$$ = [$1].concat($3);"],
            ["IDENT", "$$ = [$1];"],
        ],
        // CSS
        "rules": [
            ["rule rules", "$$ = [$1].concat($2);"],
            ["", "$$ = [];"],
        ],
        "rule": [
            ["selector NL INDENT properties DEDENT", "$$ = ['rule', $1, $4]"],
            ["selector NL", "$$ = ['rule', $1, []]"],
        ],
        "selector": [
            ["IDENT_TOKEN", "$$ = [$1];"],
        ],
        "properties": [
            ["property properties", "$$ = [$1].concat($2);"],
            ["", "$$ = [];"],
        ],
        "property": [
            ["IDENT_TOKEN : property_value NL", "$$ = ['property', $1, $3]"],
        ],
        "property_value": [
            ["IDENT_TOKEN", "$$ = $1"],
        ],
        // FUTURE
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
