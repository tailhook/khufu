import * as T from "babel-types"
import {parse_tree_error} from './compiler'


export function compile(item, path, opt) {
    switch(item[0]) {
        case 'string': {
            let [_string, value] = item;
            return T.stringLiteral(value);
        }
        case 'template': {
            let [_template, items] = item;
            let quasis = []
            let exprs = []
            for(var [kind, val] of items) {
                if(kind == 'const') {
                    quasis.push(T.templateElement({raw: val}))
                } else {
                    exprs.push(compile(val, path, opt))
                }
            }
            quasis[quasis.length-1].tail = true;
            console.log("ITEMS", items, quasis, exprs)

            return T.templateLiteral(quasis, exprs);
        }
        case 'number': {
            let [_number, value] = item;
            return T.numericLiteral(Number(value));
        }
        case 'list': {
            let [_list, expressions] = item;
            return T.arrayExpression(expressions.map(x =>
                compile(x, path, opt)))
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
        case 'binop': {
            let [_binop, oper, left, right] = item
            return T.binaryExpression(oper,
                compile(left, path, opt), compile(right, path, opt))
        }
        case 'if': {
            let [_if, cond, norm, alter] = item
            return T.conditionalExpression(
                compile(cond, path, opt),
                compile(norm, path, opt),
                compile(alter, path, opt))
        }
        default:
            throw parse_tree_error('Unknown expression', item)
    }
}
