import 'babel-polyfill'
import * as babel from 'babel-core'
import * as T from 'babel-types'
import {parser} from './grammar'
import * as view from './compile_view'

const DOM_FUNCTIONS = [
    'elementVoid',
    'elementOpen',
    'elementClose',
    'text',
]

const DEFAULT_OPTIONS = {
    static_attrs: true,
}

export function parse_tree_error(message, tree) {
    let strtree = tree.toString();
    if(strtree.length > 20) {
        strtree = strtree.substr(0, 17) + '...';
    }
    return Error(message + ': ' + strtree);
}

function compile_block(block, path, opt) {
    switch(block[0]) {
        case 'view':
            return view.compile(block, path, opt);
        case 'import_names': {
            let [_import, names, module] = block;
            for(let i of names) {
                path.node.body.push(T.importDeclaration(
                    [T.importSpecifier(T.identifier(i), T.identifier(i))],
                    T.stringLiteral(module)))
                path.scope.setData('binding:' + i, T.identifier(i))
            }
            return;
        }
        default:
            throw parse_tree_error("Unknown block", block);
    }
}

export function compile(txt, opt) {
    let parse_tree = parser.parse(txt, opt);
    let ast = T.file(T.program([
        T.importDeclaration(
            DOM_FUNCTIONS.map(
                x => T.importSpecifier(T.identifier(x), T.identifier(x))),
            T.stringLiteral('incremental-dom'))
    ]));
    babel.traverse(ast, {
        Program: path => {
            parse_tree.map(block => compile_block(block, path, opt))
        },
    });
    return ast;
}

export function compile_text(txt, options) {
    let opt = Object.assign({}, DEFAULT_OPTIONS, options)
    return babel.transformFromAst(compile(txt, opt)).code
}
