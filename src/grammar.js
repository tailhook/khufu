import {Parser} from 'jison'
import Lexer from './lexer'

var statement;

function list(item) {
    return [
        [`${item} ${item}s`, "$$ = [$1].concat($2);" ],
        ["", "$$ = [];" ],
    ]
}

export var parser = new Parser({

    "operators": [
        ["left", "+", "-"],
        ["left", "*", "/"],
        ["left", "^"],
        ["left", "(", ".", "["],
        ["left", "UNARY"]
    ],
    "tokens": "import from style view " +
        "{ } ( ) < > + - * / ^ , . : " +
        "INDENT DEDENT IDENT NL " +
        // CSS
        "IDENT_TOKEN" +
        // HTML
        "TAG_NAME STORE store link -> <-",
    "start": "file",
    "bnf": {
        "file": [
            ["blocks EOF", "return $1;"],
        ],
        "blocks": list('block'),
        "block": [
            ["import { names } from STRING NL",
                "$$ = ['import_names', $3, $6];"],
            ["import IDENT from STRING NL",
                "$$ = ['import_default', $2, $4];"],
            ["style : NL INDENT rules DEDENT", "$$ = ['style', $5];"],
            ["style : NL", "$$ = ['style', []]"],
            ["view IDENT ( args ) : NL " +
             "INDENT statements DEDENT", "$$ = ['view', $2, $4, $9]"],
            ["view IDENT ( args ) : NL", "$$ = ['view', $2, $4, []]"],
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
        // HTML
        "args": [
            ["IDENT , args", "$$ = [$1].concat($3);"],
            ["IDENT", "$$ = [$1];"],
            ["", "$$ = [];"],
        ],
        "statements": list('statement'),
        "elstatements": list('elstatement'),
        "statement": [
            ["STRING", "$$ = ['string', $1];" ],
            ["< TAG_NAME attributes > NL", "$$ = ['element', $2, $3, []];" ],
            ["< TAG_NAME attributes > NL " +
                "INDENT elstatements DEDENT", "$$ = ['element', $2, $3, $7];" ],
            ["store STORE = e NL", "$$ = ['store', $2, $4]"],
        ],
        "elstatement": [
            ["statement", "$$ = $1;"],
            // TODO(tailhook) support other targets than stores
            ["link { names } e -> STORE NL",
                "$$ = ['link', $3, $5, ['store', $7]];"],
        ],
        "attributes": [
            ["attribute attributes", "$$ = [$1].concat($2);" ],
            ["", "$$ = [];" ],
        ],
        "attribute": [
            ["TAG_NAME = attrvalue", "$$ = [$1, $3];"],
            ["TAG_NAME", "$$ = [$1, $3];"],
        ],
        "attrvalue": [
            ["STRING", "$$ = ['string', $1];"],
            ["TAG_NAME", "$$ = ['ident', $1];"],
        ],
        "e" :[
              [ "e + e",   "$$ = ['add', $1, $3];" ],
              [ "e - e",   "$$ = ['sub', $1, $3];" ],
              [ "e * e",   "$$ = ['mul', $1, $3];" ],
              [ "e / e",   "$$ = ['div', $1, $3];" ],
              [ "e ^ e",   "$$ = ['pow', $1, $3];" ],
              [ "- e",     "$$ = ['minus', $2];", {"prec": "UNARY"} ],
              [ "+ e",     "$$ = ['plus', $2];", {"prec": "UNARY"} ],
              [ "( e )",   "$$ = $2;" ],
              [ "e ( e )", "$$ = ['call', $1, $3];" ],
              [ "NUMBER",  "$$ = ['number', yytext];" ],
              [ "IDENT",  "$$ = ['name', $1];" ],
              [ "STORE",  "$$ = ['store', $1];" ],
        ],
    }
})
parser.lexer = new Lexer()
