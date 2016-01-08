import * as T from "babel-types"

export function compile(element, path) {
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

        console.assert(!"not implemented")

        path.node.body.push(T.expressionStatement(
            T.callExpression(T.identifier('elementClose'), [])))
    }
}
