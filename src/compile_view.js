import * as T from "babel-types"

import * as element from "./compile_element"
import {compile as compile_expression} from "./compile_expression"
import * as lval from "./compile_lval"
import {parse_tree_error} from "./compiler"
import {push_to_body} from "./babel-util"


const DOM_FUNCTIONS = [
    'elementVoid',
    'elementOpen',
    'elementClose',
    'text',
    'item',
]

export function compile_string(item, path, opt, key) {
    let [_expression, value] = item;
    let expr = compile_expression(value, path, opt);
    if(value[0] == 'call') {
        push_to_body(path, T.expressionStatement(
            T.callExpression(T.identifier('item'), [expr, key])))
    } else {
        push_to_body(path, T.expressionStatement(
            T.callExpression(T.identifier('text'), [expr])))
    }
}

export function join_key(x, y) {
    if(T.isStringLiteral(x) && T.isStringLiteral(y)) {
        return T.stringLiteral(x.value + y.value)
    }
    if(x.value === '') return y;
    if(y.value === '') return x;
    if(T.isBinaryExpression(x) && T.isStringLiteral(x.right)) {
        return T.binaryExpression("+", x.left,
            T.stringLiteral(x.right.value + y.value))
    }
    return T.binaryExpression("+", x, y)
}

export function compile_body(body, path, opt, key=T.stringLiteral('')) {
    let elements = 0;
    for(var item of body) {
        switch(item[0]) {
            case 'element': {
                elements += 1;
                element.compile(item, path, opt,
                    join_key(key, T.stringLiteral('-' + elements)))
                break;
            }
            case 'expression': {
                elements += 1;
                compile_string(item, path, opt,
                    join_key(key, T.stringLiteral('-' + elements)))
                break;
            }
            case 'assign': {
                let [_assign, target, value] = item;
                let expr = compile_expression(value, path, opt);
                let decl = lval.compile(target, path, opt)
                path.scope.push({ id: decl, init: expr, kind: 'let' })
                break;
            }
            case 'for': {
                elements += 1;
                let [_for, assign, source, loopkey, block] = item;
                let stmt = T.forOfStatement(
                    T.variableDeclaration("let", []),
                    compile_expression(source, path, opt),
                    T.blockStatement([]))
                let npath = push_to_body(path, stmt);
                let decl = lval.compile(assign, npath, opt)
                npath.get('left').replaceWith(
                    T.variableDeclaration("let", [T.variableDeclarator(decl)]))
                compile_body(block, npath.get('body'), opt,
                    join_key(join_key(key, T.stringLiteral('-' + elements)),
                        compile_expression(loopkey, npath, opt)))
                break;
            }
            case 'if': {
                elements += 1;
                let [_if, [condition, block], elifblocks, elseblk] = item;
                let con = T.ifStatement(
                    compile_expression(condition, path, opt),
                    T.blockStatement([]), null)
                let ifblock = push_to_body(path, con);
                compile_body(block, ifblock.get('consequent'), opt,
                    join_key(key, T.stringLiteral(`-${elements}if0`)))
                for(var [idx, [cond, blk]] of elifblocks.entries()) {
                    ifblock = ifblock.get('alternate');
                    ifblock.replaceWith(T.ifStatement(
                        compile_expression(cond, path, opt),
                        T.blockStatement([]),
                        null))
                    compile_body(blk, ifblock.get('consequent'), opt,
                        join_key(key,
                            T.stringLiteral(`-${elements}if${idx+1}`)))
                }
                if(elseblk) {
                    let elseblock = ifblock.get('alternate');
                    elseblock.replaceWith(T.blockStatement([]))
                    compile_body(elseblk, elseblock, opt,
                        join_key(key,
                            T.StringLiteral(`-${elements}els`)))
                }
                break;
            }
            default:
                throw parse_tree_error("Bad element", item);
        }
    }
}

export function compile(view, path, opt) {
    let [_view, name, params, body] = view;

    if(!path.scope.getData('khufu:dom-imported')) {
        path.unshiftContainer("body",
            T.importDeclaration(
                DOM_FUNCTIONS.map(
                    x => T.importSpecifier(T.identifier(x), T.identifier(x))),
                T.stringLiteral('khufu-runtime')))
        path.scope.setData('khufu:dom-imported', true)
    }

    let ext_node = T.functionDeclaration(T.identifier(name), [],
        T.blockStatement([
            T.returnStatement(T.functionExpression(T.identifier(name + '$'),
                [T.identifier('key')],
                T.blockStatement([]), false, false)),
        ]), false, false);
    let ext_fun
    if(name[0] != '_') {
        ext_node = T.exportNamedDeclaration(ext_node, [])
        ext_fun = push_to_body(path, ext_node).get('declaration')
    } else {
        ext_fun = push_to_body(path, ext_node)
    }
    let child_path = ext_fun.get('body.body')[0].get('argument.body')
    for(let param of params) {
        ext_fun.node.params.push(lval.compile(param, child_path, opt))
    }

    // bind itself
    path.scope.setData('binding:' + name, T.identifier(name))

    compile_body(body, child_path, opt, T.identifier('key'))
}
