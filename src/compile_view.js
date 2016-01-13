import * as babel from 'babel-core'
import * as T from "babel-types"

import * as element from "./compile_element"
import {compile as compile_expression} from "./compile_expression"
import {parse_tree_error} from "./compiler"
import {push_to_body} from "./babel-util"

export function compile_string(item, path, opt) {
    let [_expression, value] = item;
    path.node.body.push(T.expressionStatement(
        T.callExpression(T.identifier('text'), [
            compile_expression(value, path, opt)
        ])))
}

export function compile_body(body, path, opt, key='') {
    let elements = 0;
    for(var item of body) {
        switch(item[0]) {
            case 'element': {
                elements += 1;
                element.compile(item, path, opt, key + String(elements))
                break;
            }
            case 'expression': {
                compile_string(item, path, opt)
                break;
            }
            case 'assign': {
                let [_assign, name, value] = item;
                let expr = compile_expression(value, path, opt);
                let ident = path.scope.generateUidIdentifier(name);
                path.scope.push({ id: ident, init: expr, kind: 'let' })
                path.scope.setData('binding:' + name, ident);
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
                    key + String(elements) + 'if0-')
                for(var [idx, [cond, blk]] of elifblocks.entries()) {
                    console.log("BLOCK", cond, blk)
                    ifblock = ifblock.get('alternate');
                    ifblock.replaceWith(T.ifStatement(
                        compile_expression(cond, path, opt),
                        T.blockStatement([]),
                        null))
                    compile_body(blk, ifblock.get('consequent'), opt,
                        key + String(elements) + `if${idx+1}-`)
                }
                if(elseblk) {
                    let elseblock = ifblock.get('alternate');
                    elseblock.replaceWith(T.blockStatement([]))
                    compile_body(elseblk, elseblock, opt,
                        key + String(elements) + 'els-')
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
    let node = T.functionDeclaration(T.identifier(name), [],
        T.blockStatement([]), false, false);
    let child_path
    if(name[0] != '_') {
        node = T.exportNamedDeclaration(node, [])
        child_path = push_to_body(path, node).get('declaration.body')
    } else {
        child_path = push_to_body(path, node).get('body')
    }
    compile_body(body, child_path, opt)
}
