import * as T from "babel-types"
import {parse_tree_error} from './compiler'


export function compile(item, path, opt) {
    switch(item[0]) {
        case 'name': {
            let ident = path.scope.generateUidIdentifier(item[1]);
            return [
                T.variableDeclaration("let", [T.variableDeclarator(ident)]),
                {[item[1]]: ident},
            ]
        }
        default:
            throw parse_tree_error('Unknown expression', item)
    }
}
