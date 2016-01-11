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

export function compile_body(body, path, opt) {
    for(var [idx, item] of body.entries()) {
        switch(item[0]) {
            case 'element':
                element.compile(item, path, opt, String(idx))
                break;
            case 'expression':
                compile_string(item, path, opt)
                break;
            case 'assign':
                let [_assign, name, value] = item;
                let expr = compile_expression(value, path, opt);
                let ident = path.scope.generateUidIdentifier(name);
                path.scope.push({ id: ident, init: expr, kind: 'let' })
                path.scope.setData('binding:' + name, ident);
                break;
            default:
                throw parse_tree_error("Bad element", body);
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
