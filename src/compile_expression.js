import * as T from "babel-types"
import {parse_tree_error} from './compiler'


export function compile(item, path, opt) {
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
            let binding = path.scope.getData('binding:' + name);
            if(!binding) {
                throw Error("Unknown variable: " + name);
            }
            return binding;
        }
        case 'store': {
            let [_store, name] = item
            let store = path.scope.getData('khufu:store:raw:' +name);
            if(!store) {
                throw Error("Unknown store: " + name);
            }
            let state = path.scope.getData('khufu:store:state:' +name);
            if(!state) {
                state = path.scope.generateUidIdentifier(name + '_state');
                path.scope.push({
                    id: state,
                    init: T.callExpression(T.memberExpression(
                        store, T.identifier('getState')), []),
                    kind: 'let',
                })
                path.scope.setData('khufu:store:state:' + name, state);
            }
            return state;
        }
        case 'attr': {
            let [_attr, object, name] = item
            return T.memberExpression(compile(object, path, opt),
                T.identifier(name))
        }
        case 'call': {
            let [_call, fun, args] = item
            return T.callExpression(compile(fun, path, opt),
                args.map(x => compile(x, path, opt)))
        }
        case 'add': {
            let [_add, left, right] = item
            return T.binaryExpression("+",
                compile(left, path, opt), compile(right, path, opt))
        }
        default:
            throw parse_tree_error('Unknown expression', item)
    }
}
