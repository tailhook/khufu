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
    "start": "file",
    "bnf": {
        "file": [
            ["blocks EOF", "return $1;"],
            ["NL blocks EOF", "return $2;"],
        ],
        "blocks": list('block'),
        "block": [
            ["import { names } from STRING NL",
                "$$ = ['import_names', $3, $6];"],
            ["import IDENT from STRING NL",
                "$$ = ['import_default', $2, $4];"],
            ["style : NL INDENT rules DEDENT", "$$ = ['style', $5];"],
            ["style : NL", "$$ = ['style', []]"],
            ["view IDENT ( args ) : NL stmtblock", "$$ = ['view', $2, $4, $8]"],
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
        "stmtblock": [
            ["INDENT statements DEDENT", "$$ = $2"],
            ["", "$$ = []"],
        ],
        "statements": list('statement'),
        "elstatements": list('elstatement'),
        "statement": [
            ["< TAG_NAME attributes > NL", "$$ = ['element', $2, $3, []];" ],
            ["< TAG_NAME attributes > NL " +
                "INDENT elstatements DEDENT", "$$ = ['element', $2, $3, $7];" ],
            ["store STORE = e NL", "$$ = ['store', $2, $4]"],
            ["let IDENT = e NL", "$$ = ['assign', $2, $4]"],
            ["if e : NL stmtblock elifblocks", "$$ = ['if', [$2, $5], $6]"],
            ["if e : NL stmtblock elifblocks elseblock",
                "$$ = ['if', [$2, $5], $6, $7]"],
            ["for lval of e : NL stmtblock", "$$ = ['for', $2, $4, $2, $7]"],
            ["for lval of e key e : NL stmtblock",
                "$$ = ['for', $2, $4, $6, $9]"],
            ["e NL", "$$ = ['expression', $1];" ],
        ],
        "elifblocks": list('elifblock'),
        "elifblock": [
            ["elif e : NL stmtblock", "$$ = [$2, $5]"],
        ],
        "elseblock": [
            ["else : NL stmtblock", "$$ = $4;"],
        ],
        "elstatement": [
            ["statement", "$$ = $1;"],
            // TODO(tailhook) support other targets than stores
            ["link { names } e -> STORE NL",
                "$$ = ['link', $3, $5, ['store', $7]];"],
        ],
        "attributes": list('attribute'),
        "attribute": [
            ["TAG_NAME = attrvalue", "$$ = [$1, $3];"],
            ["TAG_NAME", "$$ = [$1];"],
        ],
        "attrvalue": [
            ["NUMBER", "$$ = ['number', $1];"],
            ["STRING", "$$ = ['string', $1];"],
            ["TAG_NAME", "$$ = ['name', $1];"],
            ["STORE", "$$ = ['store', $1];"],
            ["attrvalue . TAG_NAME", "$$ = ['attr', $1, $3];"],
        ],
        "lval": [
            ["IDENT", "$$ = ['name', $1]"],
        ],
        "callargs": [
            ["e , callargs", "$$ = [$1].concat($3);"],
            ["e", "$$ = [$1];"],
            ["", "$$ = [];"],
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
              [ "e ( callargs )", "$$ = ['call', $1, $3];" ],
              [ "e [ e ]", "$$ = ['index', $1, $3];" ],
              [ "e . IDENT", "$$ = ['attr', $1, $3];" ],
              [ "[ ]",       "$$ = ['list', []];" ],
              [ "NUMBER",  "$$ = ['number', $1];" ],
              [ "STRING",  "$$ = ['string', $1];" ],
              [ "IDENT",  "$$ = ['name', $1];" ],
              [ "STORE",  "$$ = ['store', $1];" ],
        ],
    }
})
parser.lexer = new Lexer()
