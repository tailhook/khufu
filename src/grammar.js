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
            ["selectors NL INDENT properties DEDENT", "$$ = ['rule', $1, $4]"],
            ["selectors NL", "$$ = ['rule', $1, []]"],
        ],
        "selectors": [
            ["selector", "$$ = [$1]"],
            ["selector , selectors", "$$ = [$1].concat($3)"],
        ],
        "selector": [
            ["IDENT_TOKEN", "$$ = $1;"],
            ["css_classes", "$$ = $1;"],
            ["IDENT_TOKEN css_classes", "$$ = $1 + $2;"],
        ],
        "css_classes": [
            [". IDENT_TOKEN", "$$ = '.' +$2"],
            [": IDENT_TOKEN", "$$ = ':' +$2"],
            [". IDENT_TOKEN css_classes", "$$ = '.' + $2 + $3"],
            [": IDENT_TOKEN css_classes", "$$ = ':' + $2 + $3"],
        ],
        "properties": [
            ["property properties", "$$ = [$1].concat($2);"],
            ["", "$$ = [];"],
        ],
        "property": [
            ["IDENT_TOKEN : property_value", "$$ = ['property', $1, $3]"],
        ],
        "property_value": [
            ["NL", "$$ = '';"],
            ["NL INDENT css_lines DEDENT", "$$ = $3"],
            ["css_value NL", "$$ = $1;"],
            ["css_value NL INDENT css_lines DEDENT", "$$ = $1 + ' ' + $4"],
        ],
        "css_lines": [
            ["css_value NL", "$$ = $1"],
            ["css_value NL css_lines", "$$ = $1 + ' ' + $3"],
        ],
        "css_value": [
            ["css_item", "$$ = $1;"],
            ["css_item css_value", "$$ = $1 + ' ' + $2"],
        ],
        "css_item": [
            ["IDENT_TOKEN", "$$ = $1"],
            ["HASH_TOKEN", "$$ = $1"],
            ["URL", "$$ = $1"],
            ["DIMENSION", "$$ = $1"],
            ["NUMBER", "$$ = $1"],
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
            ["< TAG_NAME classes attributes > NL",
                "$$ = ['element', $2, $3, $4, []];" ],
            ["< TAG_NAME classes attributes > NL INDENT elstatements DEDENT",
                "$$ = ['element', $2, $3, $4, $8];" ],
            ["let IDENT = e NL", "$$ = ['assign', $2, $4]"],
            ["if e : NL stmtblock elifblocks", "$$ = ['if', [$2, $5], $6]"],
            ["if e : NL stmtblock elifblocks elseblock",
                "$$ = ['if', [$2, $5], $6, $7]"],
            ["for lval of e : NL stmtblock", "$$ = ['for', $2, $4, $2, $7]"],
            ["for lval of e key e : NL stmtblock",
                "$$ = ['for', $2, $4, $6, $9]"],
            ["e NL", "$$ = ['expression', $1];" ],
        ],
        "classes": list('classe'),
        "classe": [
            [". TAG_NAME", "$$ = [$2];"],
            [". TAG_NAME ? ( e )", "$$ = [$2, $5];"],
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
            ["store STORE = e NL", "$$ = ['store', $2, $4]"],
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
        "comma_separated": [
            ["e , comma_separated", "$$ = [$1].concat($3);"],
            ["e", "$$ = [$1];"],
            ["", "$$ = [];"],
        ],
        "e" :[
              [ "e + e",   "$$ = ['binop', '+', $1, $3];" ],
              [ "e - e",   "$$ = ['binop', '-', $1, $3];" ],
              [ "e * e",   "$$ = ['binop', '*', $1, $3];" ],
              [ "e / e",   "$$ = ['binop', '/', $1, $3];" ],
              [ "e ^ e",   "$$ = ['pow', $1, $3];" ],
              [ "- e",     "$$ = ['minus', $2];", {"prec": "UNARY"} ],
              [ "+ e",     "$$ = ['plus', $2];", {"prec": "UNARY"} ],
              [ "( e )",   "$$ = $2;" ],
              [ "e ( comma_separated )", "$$ = ['call', $1, $3];" ],
              [ "e [ e ]", "$$ = ['index', $1, $3];" ],
              [ "e . IDENT", "$$ = ['attr', $1, $3];" ],
              [ "[ comma_separated ]",       "$$ = ['list', $2];" ],
              [ "NUMBER",  "$$ = ['number', $1];" ],
              [ "STRING",  "$$ = ['string', $1];" ],
              [ "IDENT",  "$$ = ['name', $1];" ],
              [ "STORE",  "$$ = ['store', $1];" ],
        ],
    }
})
parser.lexer = new Lexer()
