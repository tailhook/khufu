import 'babel-polyfill'
import * as babel from 'babel-core'
import * as T from 'babel-types'
import * as babylon from 'babylon'
import {parser} from './grammar'
import * as view from './compile_view'

const DOM_FUNCTIONS = [
    'elementVoid',
    'elementOpen',
    'elementClose',
    'text',
]

export function parse_tree_error(message, tree) {
    let strtree = tree.toString();
    if(strtree.length > 20) {
        strtree = strtree.substr(0, 17) + '...';
    }
    return Error(message + ': ' + strtree);
}

function compile_block(block, path) {
    switch(block[0]) {
        case 'view':
            return view.compile(block, path);
        default:
            throw parse_tree_error("Unknown block", block);
    }
}

export function compile_text(txt) {
    let parse_tree = parser.parse(txt);
    let ast = T.file(T.program([
        T.importDeclaration(
            DOM_FUNCTIONS.map(
                x => T.importSpecifier(T.identifier(x), T.identifier(x))),
            T.stringLiteral('incremental-dom'))
    ]));
    //console.log("DECL", babylon.parse('export function x() {}', {
    //    sourceType: 'module',
    //}).program.body)
    babel.traverse(ast, {
        Program: path => {
            parse_tree.map(block => compile_block(block, path))
        },
    });
    return babel.transformFromAst(ast).code
}
