import 'babel-polyfill'
import * as babel from 'babel-core'
import * as T from 'babel-types'
import {parser} from './grammar'
import * as view from './compile_view'
import * as style from './compile_style'
import {set_var} from './vars'


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
    let loc = tree._location
    return Error(message + ' at ' +
        (loc ? loc.first_line + ':' + loc.first_column : 'unknown') +
        ' (' + strtree + ')');
}

function compile_block(block, path, opt) {
    switch(block[0]) {
        case 'view':
            return view.compile(block, path, opt);
        case 'style':
            return style.compile(block, path, opt);
        case 'import_names': {
            let [_import, original_names, module] = block;
            let names = original_names.map(([name, alias]) => {
                let real_alias = alias
                if(alias.substr(0, 1) == '@') {
                    real_alias = alias.substr(1)
                }
                if(view.BUILTINS.indexOf(real_alias) >= 0) {
                    real_alias = path.scope.generateUidIdentifier(real_alias)
                } else {
                    real_alias = T.identifier(real_alias)
                }
                return [name, alias, real_alias]
            })
            path.pushContainer("body", T.importDeclaration(
                names.map(([n, a, r]) => {
                    if(n.substr(0, 1) == '@') {
                        return T.importSpecifier(r, T.identifier(n.substr(1)))
                    } else {
                        return T.importSpecifier(r, T.identifier(n))
                    }
                }),
                T.stringLiteral(module)))
            for(var [name, alias, real_alias] of names) {
                if(name.substr(0, 1) == '@') {
                    set_var(path, alias.substr(1), real_alias)
                } else {
                    set_var(path, alias, real_alias)
                }
            }
            return;
        }
        case 'import_default': {
            let [_import, name, module] = block;
            path.pushContainer("body", T.importDeclaration(
                [T.importDefaultSpecifier(T.identifier(name))],
                T.stringLiteral(module)))
            set_var(path, name, T.identifier(name))
            return;
        }
        case 'import_namespace': {
            let [_import, name, module] = block;
            path.pushContainer("body", T.importDeclaration(
                [T.importNamespaceSpecifier(T.identifier(name))],
                T.stringLiteral(module)))
            set_var(path, name, T.identifier(name))
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
            parse_tree
                .filter(block => block[0] == 'view')
                .map(([_block, name]) => {
                    // Bind all views in scope, so they can call each other
                    // (including recursively)
                    set_var(path, name, T.identifier(name))
                })

            parse_tree.map(block => compile_block(block, path, opt))
        },
    });
    return ast;
}

export function compile_text(txt, options, wpack) {
    return babel.transformFromAst(compile(txt, options, wpack)).code
}
