import * as babel from 'babel-core'
import * as T from "babel-types"

import * as element from "./compile_element"

export function compile(view, path) {
    let [_view, name, params, body] = view;
    let node = T.functionDeclaration(T.identifier(name), [],
        T.blockStatement([]), false, false);
    if(name[0] != '_') {
        node = T.exportNamedDeclaration(node, [])
    }
    path.node.body.push(node)
    babel.traverse(node, {
        BlockStatement: path => {
            for(var item of body) {
                switch(item[0]) {
                    case 'element':
                        element.compile(item, path)
                        break;
                }
            }
        },
    }, path.scope, path)
}
