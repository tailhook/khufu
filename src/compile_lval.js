import * as T from "babel-types"
import {parse_tree_error} from './compiler'


export function compile(item, path, opt) {
    switch(item[0]) {
        case 'store': {
            // This may only be used in function arguments
            let [_store, name] = item;
            let ident = path.scope.generateUidIdentifier(name);
            path.scope.setData('khufu:store:raw:' + name, ident)
            path.scope.setData('khufu:store:state:' + name, null);
            return ident
        }
        case 'name': {
            let [_name, name] = item;
            let ident = path.scope.generateUidIdentifier(name);
            path.scope.setData('binding:' + name, ident)
            return ident
        }
        case 'unpack_list': {
            let [_list, items] = item;
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
