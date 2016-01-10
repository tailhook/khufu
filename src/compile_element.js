import * as T from "babel-types"
import {compile_body} from "./compile_view.js"


export function compile(element, path, opt) {
    let [_element, name, attributes, children] = element;
    let links = children.filter(([x]) => x == 'link')
    let stores = children.filter(([x]) => x == 'store')
    let body = children.filter(([x]) => x != 'link' && x != 'store');
    console.assert(!links.length) // notimplemented
    console.assert(!stores.length) // notimplemented
    if(body.length == 0) {
        let node = T.callExpression(T.identifier('elementVoid'), [
            T.stringLiteral(name),
        ])
        path.node.body.push(T.expressionStatement(node))
    } else {
        path.node.body.push(T.expressionStatement(
            T.callExpression(T.identifier('elementOpen'), [
                T.stringLiteral(name),
            ])))

        compile_body(body, path, opt);

        path.node.body.push(T.expressionStatement(
            T.callExpression(T.identifier('elementClose'),
                [T.stringLiteral(name)])))
    }
}
