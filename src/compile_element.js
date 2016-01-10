import * as T from "babel-types"
import {compile_body} from "./compile_view.js"

function sort_attributes(attributes) {
    let stat = []
    let dyn = []
    for(let [name, value] of attributes) {
        let is_static = false;
        /// TODO(tailhook) maybe employ more deep analysis?
        switch(value && value[0]) {
            case undefined:
            case 'string':
            case 'number':
                is_static = true;
                break;
            default:
                break;
        }
        (is_static ? stat : dyn).push([name, value])
    }
    return [stat, dyn]
}

export function compile(element, path, opt, key) {
    let [_element, name, attributes, children] = element;

    let links = children.filter(([x]) => x == 'link')
    let stores = children.filter(([x]) => x == 'store')
    let body = children.filter(([x]) => x != 'link' && x != 'store');

    let stat, dyn
    if(opt.static_attrs) {
        [stat, dyn] = sort_attributes(attributes)
    } else {
        stat = []
        dyn = attributes
    }

    console.assert(!links.length) // notimplemented
    console.assert(!stores.length) // notimplemented
    if(body.length == 0) {
        let node = T.callExpression(T.identifier('elementVoid'), [
            T.stringLiteral(name),
            T.stringLiteral(key),
        ])
        path.node.body.push(T.expressionStatement(node))
    } else {
        path.node.body.push(T.expressionStatement(
            T.callExpression(T.identifier('elementOpen'), [
                T.stringLiteral(name),
                T.stringLiteral(key),
            ])))

        compile_body(body, path, opt);

        path.node.body.push(T.expressionStatement(
            T.callExpression(T.identifier('elementClose'),
                [T.stringLiteral(name)])))
    }
}
