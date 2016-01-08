import * as t from "babel-types"

export function compile(view, path) {
    let node = t.functionDeclaration(t.identifier(view[1]), [],
        t.blockStatement([]), false, false);
    if(view[1][0] != '_') {
        node = t.exportNamedDeclaration(node, [])
    }
    path.node.body.push(node)
}
