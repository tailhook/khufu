import * as T from "babel-types"
import {parse_tree_error} from './compiler'
import {set_var} from './vars'


export function compile(item, path, opt) {
    switch(item[0]) {
        case 'store': case 'name': {
            let [_name, name] = item
            let ident = path.scope.generateUidIdentifier(name)
            set_var(path, name, ident)
            return ident
        }
        case 'unpack_list': {
            let [_list, items] = item
            return T.arrayPattern(
                items.map(subitem => compile(subitem, path, opt)))
        }
        case 'unpack_map': {
            let [_list, items] = item;
            return T.objectPattern(
                items.map(([name, value]) =>
                    T.objectProperty(T.identifier(name),
                                     compile(value, path, opt))))
        }
        default:
            throw parse_tree_error('Unknown expression', item)
    }
}
