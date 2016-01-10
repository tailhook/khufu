import * as T from "babel-types"
import {parse_tree_error} from './compiler'


export function compile(item, path) {
    switch(item[0]) {
        case 'string': {
            let [_string, value] = item;
            return T.stringLiteral(value);
        }
        case 'number': {
            let [_number, value] = item;
            return T.numericLiteral(Number(value));
        }
        case 'name': {
            let [_name, name] = item;
            return path.scope.getData('binding:' + name);
        }
        case 'add': {
            let [_add, left, right] = item
            return T.binaryExpression("+",
                compile(left, path), compile(right, path))
        }
        default:
            throw parse_tree_error('Unknown expression', item)
    }
}
