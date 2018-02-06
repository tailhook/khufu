import * as T from "babel-types"

import * as element from "./compile_element"
import * as expression from "./compile_expression.js"
import {compile as compile_expression} from "./compile_expression"
import * as lval from "./compile_lval"
import {parse_tree_error} from "./compiler"
import {push_to_body} from "./babel-util"
import {get_var, set_var} from './vars'


const DOM_FUNCTIONS = [
    'elementVoid',
    'elementOpen',
    'elementClose',
    'text',
    'item',
]
export const BUILTINS = DOM_FUNCTIONS.concat([
    'SuppressedError',
])

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
    // Optimizes "a" + "b" -> "ab"
    if(T.isStringLiteral(x) && T.isStringLiteral(y)) {
        return T.stringLiteral(x.value + y.value)
    }
    // Optimizes "" + "b" -> "b"
    if(x.value === '') return y;
    // Optimizes "a" + "" -> "a"
    if(y.value === '') return x;
    // Optimizes (N + "a") + "b" -> N + "ab"
    if(T.isBinaryExpression(x) &&
        T.isStringLiteral(x.right) &&
        T.isStringLiteral(y))
    {
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
            case 'block_call': {
                elements += 1;
                let subkey = join_key(key, T.stringLiteral('-' + elements));
                let [_block_call, expression, kwargs] = item;
                let expr = compile_expression(expression, path, opt)
                let kwarg_items = []
                for(let [name, block] of kwargs) {
                    kwarg_items.push(T.objectProperty(T.identifier(name),
                        T.functionExpression(null, [], T.blockStatement([
                            T.returnStatement(
                                T.functionExpression(null,
                                        [T.identifier('key')],
                                        T.blockStatement([]), false, false))
                        ]))))
                }
                let callpath = push_to_body(path, T.expressionStatement(
                    T.callExpression(
                        expr,
                        [subkey, T.objectExpression(kwarg_items)],
                    )))
                let argpath = callpath.get('expression.arguments')[1]
                    .get('properties')
                for(var i = 0; i < kwargs.length; ++i) {
                    compile_body(kwargs[i][1], argpath[i]
                            .get('value.body.body')[0].get('argument.body'),
                        opt, T.identifier('key'))
                }
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
                elements += 1
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
                elements += 1
                let [_if, [condition, block], elifblocks, elseblk] = item
                let ifblock
                if(condition[0] == 'let') {
                    let decl = path.scope.generateUidIdentifier('if_let_cond');
                    let expr = compile_expression(condition[2], path, opt)
                    path.scope.push({ id: decl, kind: 'let' })

                    let cond = T.assignmentExpression('=', decl, expr)
                    let con = T.ifStatement(cond, T.blockStatement([]), null)
                    ifblock = push_to_body(path, con);

                    let inner_path = ifblock.get('consequent')
                    let in_decl = lval.compile(condition[1], inner_path, opt)
                    inner_path.scope
                        .push({ id: in_decl, init: decl, kind: 'let' })
                } else {
                    let con = T.ifStatement(
                        compile_expression(condition, path, opt),
                        T.blockStatement([]),
                        null)
                    ifblock = push_to_body(path, con);
                }
                compile_body(block, ifblock.get('consequent'), opt,
                    join_key(key, T.stringLiteral(`-${elements}if0`)))
                for(var [idx, [cond, blk]] of elifblocks.entries()) {
                    if(cond[0] == 'let') {
                        let decl = path.scope.generateUidIdentifier(
                            'if_let_cond');
                        let expr = compile_expression(cond[2], path, opt)
                        path.scope.push({ id: decl, kind: 'let' })

                        let stmt = T.ifStatement(
                            T.assignmentExpression('=', decl, expr),
                            T.blockStatement([]), null)

                        ifblock = ifblock.get('alternate');
                        ifblock.replaceWith(stmt)
                        let inner_path = ifblock.get('consequent');
                        let in_decl = lval.compile(cond[1], inner_path, opt)
                        inner_path.scope
                            .push({ id: in_decl, init: decl, kind: 'let' })
                    } else {
                        ifblock = ifblock.get('alternate');
                        ifblock.replaceWith(T.ifStatement(
                            compile_expression(cond, path, opt),
                            T.blockStatement([]),
                            null))
                    }
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
            case 'catch': {
                elements += 1
                let [_catch, pattern, action, target, block] = item
                let name = path.scope.generateUidIdentifier('error');
                let stmt = push_to_body(path, T.tryStatement(
                    T.blockStatement([]),
                    T.catchClause(name, T.blockStatement([]))))
                let handler = stmt.get("handler").get("body")
                let if_stmt = push_to_body(handler, T.ifStatement(
                    T.unaryExpression('!',
                        T.binaryExpression('instanceof',
                            name,
                            T.identifier("SuppressedError")), true),
                    T.blockStatement([])))
                    .get("consequent")

                let store = get_var(path, target[1], target);
                set_var(if_stmt, 'this', T.identifier('this'))
                set_var(if_stmt, 'error', name)
                push_to_body(if_stmt, T.callExpression(
                    T.memberExpression(store, T.identifier('dispatch')),
                        [expression.compile(action, if_stmt, opt)]));
                push_to_body(if_stmt,
                    T.throwStatement(T.newExpression(
                        T.identifier("SuppressedError"),
                        [name])))

                push_to_body(handler,
                    T.throwStatement(name))
                compile_body(block, stmt.get("block"), opt,
                    join_key(key,
                        T.StringLiteral(`-${elements}catch`)))
                break;
            }
            default:
                throw parse_tree_error("Bad element", item);
        }
    }
}

export function compile(view, path, opt) {
    let [_view, name, params, kwargs, body] = view;

    if(!path.scope.getData('khufu:dom-imported')) {
        path.unshiftContainer("body",
            T.importDeclaration(
                BUILTINS.map(
                    x => T.importSpecifier(T.identifier(x), T.identifier(x))),
                T.stringLiteral('khufu-runtime')))
        path.scope.setData('khufu:dom-imported', true)
    }

    let ident = name.replace(/\./g, '_');
    let block_node = T.blockStatement([
            T.returnStatement(T.functionExpression(T.identifier(ident + '$'),
                [T.identifier('key')].concat(
                    kwargs.length == 0 ? [] :
                         [T.assignmentPattern(
                            T.identifier('children'), T.objectExpression([]))]
                ),
                T.blockStatement(kwargs.length ? [
                    T.variableDeclaration('let', [T.variableDeclarator(
                        T.objectPattern(
                            kwargs.map(([_name, name]) =>
                                T.objectProperty(T.identifier(name),
                                                 T.identifier(name)))),
                        T.identifier('children'),
                    )])
                ]:[]), false, false))
        ])
    let ext_fun
    if(name.indexOf('.') >= 0) {
        let [varname, key] = name.split('.');
        let binding = get_var(path, varname);
        if(!binding) {
            binding = path.scope.generateUidIdentifier(varname);
            set_var(path, varname, binding);
            path.scope.push({
                id: binding,
                init: T.objectExpression([]),
                kind: 'let',
            })
            if(varname[0] != '_') {
                push_to_body(path, T.exportNamedDeclaration(null,
                    [T.exportSpecifier(binding, T.identifier(varname))],
                    null))
            }
        }
        let assign = T.assignmentExpression('=',
            T.memberExpression(binding, T.identifier(key), false),
            T.functionExpression(T.identifier(ident), [],
                block_node, false, false));
        let ext_node = T.expressionStatement(assign);
        ext_fun = push_to_body(path, ext_node)
            .get('expression.right')
    } else if(name[0] != '_') {
        let func_decl = T.functionDeclaration(T.identifier(ident), [],
            block_node, false, false);
        let ext_node = T.exportNamedDeclaration(func_decl, [])
        ext_fun = push_to_body(path, ext_node).get('declaration')
    } else {
        let ext_node = T.functionDeclaration(T.identifier(ident), [],
            block_node, false, false);
        ext_fun = push_to_body(path, ext_node)
    }
    let child_path = ext_fun.get('body.body')[0].get('argument.body')
    for(let param of params) {
        ext_fun.node.params.push(lval.compile(param, child_path, opt))
    }
    for(let [_name, kwarg] of kwargs) {
        set_var(child_path, kwarg, T.identifier(kwarg));
    }
    compile_body(body, child_path, opt, T.identifier('key'))
}
