import 'babel-polyfill'
import * as babel from 'babel-core'
import * as T from 'babel-types'
import {parser} from './grammar'
import * as view from './compile_view'
import * as style from './compile_style'


const DEFAULT_OPTIONS = {
    static_attrs: true,
    additional_class: function(wpack) {
        // by default it's `b-${basename}` if in webpack
        if(wpack) {
            let items = wpack.resourcePath.split('/');
            let blockname = items[items.length - 1].split('.')[0]
            if(blockname) {
                return 'b-' + blockname;
            }
        }
    },
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
        case 'style':
            return style.compile(block, path, opt);
        case 'import_names': {
            let [_import, names, module] = block;
            path.pushContainer("body", T.importDeclaration(
                names.map(i =>
                    T.importSpecifier(T.identifier(i), T.identifier(i))),
                T.stringLiteral(module)))
            for(var i of names) {
                path.scope.setData('binding:' + i, T.identifier(i))
            }
            return;
        }
        case 'import_default': {
            let [_import, name, module] = block;
            path.pushContainer("body", T.importDeclaration(
                [T.importDefaultSpecifier(T.identifier(name))],
                T.stringLiteral(module)))
            path.scope.setData('binding:' + name, T.identifier(name))
            return;
        }
        default:
            throw parse_tree_error("Unknown block", block);
    }
}

export function compile(txt, options, wpack) {
    let opt = Object.assign({}, DEFAULT_OPTIONS, options)
    if(typeof opt.additional_class == 'function') {
        opt.additional_class = opt.additional_class(wpack)
    }
    opt.always_add_class = new Set(opt.always_add_class || []);
    let parse_tree = parser.parse(txt, opt);
    let ast = T.file(T.program([]));
    babel.traverse(ast, {
        Program: path => {
            parse_tree.map(block => compile_block(block, path, opt))
        },
    });
    return ast;
}

export function compile_text(txt, options, wpack) {
    return babel.transformFromAst(compile(txt, options, wpack)).code
}
