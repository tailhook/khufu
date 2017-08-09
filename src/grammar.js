import {Parser} from 'jison'
import Lexer from './lexer'

var statement;

function list(item) {
    return [
        [`${item} ${item}s`, "$$ = add_location(@$, [$1].concat($2));" ],
        ["", "$$ = [];" ],
    ]
}

function add_location(info, node) {
    Object.defineProperty(node, '_location', {value: info, enumerable: false})
    return node
}
function node(info, ...args) {
    return add_location(info, args)
}

export var parser = new Parser({
    actionInclude: node.toString() + add_location.toString(),
    "operators": [
        ["left", "?"],
        ["left", "or"],
        ["left", "and"],
        ["left", "not"],
        ["left", "==", "!=", "===", "!=="],
        ["left", ">", "<", "<=", ">="],
        ["left", "+", "-"],
        ["left", "*", "/", "%"],
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
            ["import { impnames } from STRING NL",
                "$$ = node(@$, 'import_names', $3, $6);"],
            ["import IDENT from STRING NL",
                "$$ = node(@$, 'import_default', $2, $4);"],
            ["import * as IDENT from STRING NL",
                "$$ = node(@$, 'import_namespace', $4, $6);"],
            ["style : NL INDENT styleitems DEDENT",
                "$$ = node(@$, 'style', $5);"],
            ["style : NL", "$$ = node(@$, 'style', [])"],
            ["view IDENT ( args ) { kwargs } : NL stmtblock",
                "$$ = node(@$, 'view', $2, $4, $7, $11)"],
            ["view IDENT ( args ) : NL stmtblock",
                "$$ = node(@$, 'view', $2, $4, [], $8)"],
        ],
        "impnames": [
            ["IDENT , impnames", "$$ = [[$1, $1]].concat($3);"],
            ["STORE , impnames", "$$ = [['@' + $1, '@' + $1]].concat($3);"],
            ["IDENT as IDENT , impnames",
                "$$ = [[$1, $3]].concat($5);"],
            ["STORE as STORE , impnames",
                "$$ = [['@' + $1, '@' + $3]].concat($5);"],
            ["IDENT", "$$ = node(@$, [$1, $1]);"],
            ["STORE", "$$ = node(@$, ['@' + $1, '@' + $1]);"],
            ["IDENT as IDENT", "$$ = [[$1, $3]];"],
            ["STORE as STORE", "$$ = [['@' + $1, '@' + $3]];"],
        ],
        // CSS
        "styleitems": [
            ["styleitem styleitems", "$$ = [$1].concat($2);"],
            ["", "$$ = [];"],
        ],
        "rules": [
            ["rule rules", "$$ = [$1].concat($2);"],
            ["", "$$ = [];"],
        ],
        "styleitem": [
            ["MEDIA media_queries NL INDENT rules DEDENT",
                "$$ = node(@$, 'media', $2, $5)"],
            ["MEDIA media_queries NL", "$$ = node(@$, 'media', $2, [])"],
            ["rule", "$$ = $1"],
        ],
        "rule": [
            ["selectors NL INDENT properties DEDENT",
                "$$ = node(@$, 'rule', $1, $4)"],
            ["selectors NL", "$$ = node(@$, 'rule', $1, [])"],
        ],
        "media_queries": [
            ["media_query , media_queries", "$$ = $1 + ', ' + $3"],
            ["media_query", "$$ = $1"],
        ],
        "media_query": [
            ["IDENT_TOKEN", "$$ = $1"],
            ["( media_query )", "$$ = '(' + $1 + ')'"],
            ["( IDENT_TOKEN : css_item )", "$$ = '(' + $2 + ': ' + $4 + ')'"],
            ["media_query and media_query", "$$ = $1 + ' and ' + $3"],
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
            ["IDENT_TOKEN : property_value",
                "$$ = node(@$, 'property', $1, $3)"],
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
            ["css_item ,", "$$ = $1 + ',';"],
            ["css_item css_value", "$$ = $1 + ' ' + $2"],
            ["css_item , css_value", "$$ = $1 + ', ' + $3"],
        ],
        "css_item": [
            ["IDENT_TOKEN", "$$ = $1"],
            ["PERCENTAGE_TOKEN", "$$ = $1"],
            ["HASH_TOKEN", "$$ = $1"],
            ["URL", "$$ = $1"],
            ["DIMENSION", "$$ = $1"],
            ["NUMBER", "$$ = $1"],
            ["css_item ( css_value ) ", "$$ = $1 + '(' + $3 + ')'"],
        ],
        // HTML
        "assign_tgt": [
            ["IDENT", "$$ = ['name', $1];"],
            ["complex_assign_tgt", "$$ = $1;"],
        ],
        "complex_assign_tgt": [
            ["[ tgt_list ]", "$$ = ['unpack_list', $2];"],
            ["{ tgt_map }", "$$ = ['unpack_map', $2];"],
        ],
        "arg_def": [
            ["assign_tgt", "$$ = $1;"],
            ["STORE", "$$ = ['store', $1];"],
        ],
        "tgt_list": [
            ["assign_tgt , tgt_list", "$$ = [$1].concat($3);"],
            ["assign_tgt", "$$ = [$1];"],
            ["", "$$ = [];"],
        ],
        "tgt_map": [
            ["IDENT , tgt_map", "$$ = [[$1, ['name', $1]]].concat($3);"],
            ["IDENT", "$$ = [[$1, ['name', $1]]];"],
            ["IDENT : assign_tgt , tgt_map",
                "$$ = [[$1, $3]].concat($5);"],
            ["IDENT : assign_tgt",
                "$$ = [[$1, $3]];"],
            ["", "$$ = [];"],
        ],
        "args": [
            ["arg_def , args", "$$ = [$1].concat($3);"],
            ["arg_def", "$$ = [$1];"],
            ["", "$$ = [];"],
        ],
        "kwargs": [
            ["IDENT , kwargs", "$$ = [['name', $1]].concat($3);"],
            ["IDENT", "$$ = [['name', $1]];"],
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
                "$$ = node(@$, 'element', $2, $3, $4, []);" ],
            ["< TAG_NAME classes attributes > simplevalue NL",
                "$$ = node(@$, 'element', $2, $3, $4, " +
                    "[['expression', $6]]);" ],
            ["< TAG_NAME classes attributes > NL INDENT elstatements DEDENT",
                "$$ = node(@$, 'element', $2, $3, $4, $8);" ],
            ["let assign_tgt = e NL", "$$ = node(@$, 'assign', $2, $4)"],
            ["if let assign_tgt = e : NL stmtblock elifblocks",
                "$$ = node(@$, 'if', [['let', $3, $5], $8], $9)"],
            ["if let assign_tgt = e : NL stmtblock elifblocks elseblock",
                "$$ = node(@$, 'if', [['let', $3, $5], $8], $9, $10)"],
            ["if e : NL stmtblock elifblocks",
                "$$ = node(@$, 'if', [$2, $5], $6)"],
            ["if e : NL stmtblock elifblocks elseblock",
                "$$ = node(@$, 'if', [$2, $5], $6, $7)"],
            ["for IDENT of e : NL stmtblock",
                "$$ = node(@$, 'for', ['name', $2], $4, ['name', $2], $7)"],
            ["for IDENT of e key e : NL stmtblock",
                "$$ = node(@$, 'for', ['name', $2], $4, $6, $9)"],
            ["for complex_assign_tgt of e key e : NL stmtblock",
                "$$ = node(@$, 'for', $2, $4, $6, $9)"],
            ["e NL INDENT statements DEDENT",
                "$$ = node(@$, 'block_call', $1, [['body', $4]]);" ],
            ["e : NL INDENT subblocks DEDENT",
                "$$ = node(@$, 'block_call', $1, $5);" ],
            ["e NL", "$$ = node(@$, 'expression', $1);" ],
        ],
        "subblocks": list('subblock'),
        "subblock": [
            ["IDENT : NL stmtblock", "$$ = node(@$, $1, $4);"],
            ["IDENT : simplevalue NL",
                "$$ = node(@$, $1, [['expression', $3]]);"],
        ],
        "classes": list('classe'),
        "classe": [
            [". TAG_NAME", "$$ = [$2];"],
            [". TAG_NAME ? ( e )", "$$ = [$2, $5];"],
        ],
        "elifblocks": list('elifblock'),
        "elifblock": [
            ["elif let assign_tgt = e : NL stmtblock", "$$ = [['let', $3, $5], $8]"],
            ["elif e : NL stmtblock", "$$ = [$2, $5]"],
        ],
        "elseblock": [
            ["else : NL stmtblock", "$$ = $4;"],
        ],
        "elstatement": [
            ["statement", "$$ = $1;"],
            // TODO(tailhook) support other targets than stores
            ["link { linknames } e -> STORE NL",
                "$$ = node(@$, 'link', $3, $5, ['store', $7]);"],
            ["store STORE = e row_enhancers NL",
                "$$ = node(@$, 'store', $2, $4, $5)"],
            ["store STORE = e row_enhancers NL INDENT col_enhancers DEDENT",
                "$$ = node(@$, 'store', $2, $4, $5.concat($8))"],
        ],
        "row_enhancers": list('row_enhancer'),
        "col_enhancers": list('col_enhancer'),
        "row_enhancer": [["| e", "$$ = $2"]],
        "col_enhancer": [["| e NL", "$$ = $2"]],
        "attributes": list('attribute'),
        "attribute": [
            ["TAG_NAME = attrvalue", "$$ = [$1, $3];"],
            ["TAG_NAME", "$$ = [$1];"],
        ],
        "attrvalue": [  // This is similar to simplevalue but IDENT = TAG_NAME
            ["NUMBER", "$$ = node(@$, 'number', $1);"],
            ["- NUMBER", "$$ = node(@$, 'number', '-' + $2)"],
            ["+ NUMBER", "$$ = node(@$, 'number', '+' + $2)"],
            ["STRING", "$$ = node(@$, 'string', $1);"],
            ["TAG_NAME", "$$ = node(@$, 'name', $1);"],
            ["STORE", "$$ = node(@$, 'store', $1);"],
            ["attrvalue . TAG_NAME", "$$ = node(@$, 'attr', $1, $3);"],
            ["( e )", "$$ = $2;"],
            ["{ object_entries }",   "$$ = node(@$, 'object', $2);" ],
            ["attrvalue ( comma_separated )",
                "$$ = node(@$, 'call', $1, $3);"],
            ["template", "$$ = node(@$, 'template', $1);" ],
        ],
        "simplevalue": [  // This is similar to attrvalue but TAG_NAME = IDENT
            ["NUMBER", "$$ = node(@$, 'number', $1);"],
            ["- NUMBER", "$$ = node(@$, 'number', '-' + $2)"],
            ["+ NUMBER", "$$ = node(@$, 'number', '+' + $2)"],
            ["STRING", "$$ = node(@$, 'string', $1);"],
            ["IDENT", "$$ = node(@$, 'name', $1);"],
            ["STORE", "$$ = node(@$, 'store', $1);"],
            ["simplevalue . IDENT", "$$ = node(@$, 'attr', $1, $3);"],
            ["( e )", "$$ = $2;"],
            ["{ object_entries }",   "$$ = node(@$, 'object', $2);" ],
            ["simplevalue ( comma_separated )",
                "$$ = node(@$, 'call', $1, $3);"],
            ["template", "$$ = node(@$, 'template', $1);" ],
        ],
        "linknames": [
            ["IDENT , linknames", "$$ = [$1].concat($3);"],
            ["IDENT", "$$ = [$1];"],
        ],
        "comma_separated": [
            ["e , comma_separated", "$$ = [$1].concat($3);"],
            ["e", "$$ = [$1];"],
            ["", "$$ = [];"],
        ],
        "object_entries": [
            ["IDENT : e , object_entries", "$$ = [[$1, $3]].concat($5);"],
            ["STRING : e , object_entries", "$$ = [[$1, $3]].concat($5);"],
            ["IDENT : e", "$$ = [[$1, $3]];"],
            ["STRING : e", "$$ = [[$1, $3]];"],
            ["", "$$ = [];"],
        ],
        "template": [
            ["TEMPLATE_BEGIN template_pair TEMPLATE_END",
                "$$ = [['const', $1]].concat($2).concat([['const', $3]])"],
        ],
        "template_pair": [
            ["e", "$$ = [['expr', $1]]"],
            ["e TEMPLATE_INTER template_pair",
                "$$ = [['expr', $1], ['const', $2]].concat($3)"],
        ],
        "e" :[
              [ "e ? e : e", "$$ = node(@$, 'ternary', $1, $3, $5);" ],
              [ "e and e", "$$ = node(@$, 'logop', '&&', $1, $3);" ],
              [ "e or e",  "$$ = node(@$, 'logop', '||', $1, $3);" ],
              [ "e + e",   "$$ = node(@$, 'binop', '+', $1, $3);" ],
              [ "e - e",   "$$ = node(@$, 'binop', '-', $1, $3);" ],
              [ "e * e",   "$$ = node(@$, 'binop', '*', $1, $3);" ],
              [ "e / e",   "$$ = node(@$, 'binop', '/', $1, $3);" ],
              [ "e % e",   "$$ = node(@$, 'binop', '%', $1, $3);" ],
              [ "e == e",   "$$ = node(@$, 'binop', '==', $1, $3);" ],
              [ "e != e",   "$$ = node(@$, 'binop', '!=', $1, $3);" ],
              [ "e === e",   "$$ = node(@$, 'binop', '===', $1, $3);" ],
              [ "e !== e",   "$$ = node(@$, 'binop', '!==', $1, $3);" ],
              [ "e > e",   "$$ = node(@$, 'binop', '>', $1, $3);" ],
              [ "e < e",   "$$ = node(@$, 'binop', '<', $1, $3);" ],
              [ "e >= e",   "$$ = node(@$, 'binop', '>=', $1, $3);" ],
              [ "e <= e",   "$$ = node(@$, 'binop', '<=', $1, $3);" ],
              [ "e ^ e",   "$$ = node(@$, 'binop', '**', $1, $3);" ],
              [ "-> STORE","$$ = node(@$, 'raw_store', $2);", {"prec": "UNARY"} ],
              [ "- e",     "$$ = node(@$, 'unary', '-', $2);", {"prec": "UNARY"} ],
              [ "+ e",     "$$ = node(@$, 'unary', '+', $2);", {"prec": "UNARY"} ],
              [ "not e",   "$$ = node(@$, 'unary', '!', $2);"],
              [ "( e )",   "$$ = $2;" ],
              [ "{ object_entries }",   "$$ = node(@$, 'object', $2);" ],
              [ "e ( comma_separated )", "$$ = node(@$, 'call', $1, $3);" ],
              [ "e [ e ]", "$$ = node(@$, 'index', $1, $3);" ],
              [ "e . IDENT", "$$ = node(@$, 'attr', $1, $3);" ],
              [ "[ comma_separated ]",       "$$ = node(@$, 'list', $2);" ],
              [ "template", "$$ = node(@$, 'template', $1);" ],
              [ "NUMBER",  "$$ = node(@$, 'number', $1);" ],
              [ "STRING",  "$$ = node(@$, 'string', $1);" ],
              [ "IDENT",  "$$ = node(@$, 'name', $1);" ],
              [ "STORE",  "$$ = node(@$, 'store', $1);" ],
        ],
    }
})

parser.lexer = new Lexer()
