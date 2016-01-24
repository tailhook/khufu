import * as babel from 'babel-core'
import * as T from "babel-types"
import {compile_body, join_key} from "./compile_view.js"
import * as expression from "./compile_expression.js"
import {push_to_body} from "./babel-util"
import {parse_tree_error} from "./compiler"


function optimize_plus(a, b) {
    if(a[0] == 'string' && b[0] == 'string') {
        return ['string', a[1] + b[1]]
    }
    return ['binop', '+', a, b]
}


function sort_attributes(attributes, elname, opt) {
    let stat = []
    let dyn = []
    let cls_stat = []
    let cls_dyn = []
    for(let [name, value] of attributes) {
        let is_static = false;
        /// TODO(tailhook) maybe employ more deep analysis?
        switch(value && value[0]) {
            case undefined:
            case 'string':
            case 'number':
                is_static = !!opt.static_attrs;
                break;
            default:
                break;
        }
        if(name == 'class') {
            (is_static ? cls_stat : cls_dyn).push(value)
        } else {
            (is_static ? stat : dyn).push([name, value])
        }
    }
    if(opt.additional_class && (cls_stat.length || cls_dyn.length ||
        opt.always_add_class.has(elname)))
    {
        cls_stat.unshift(['string', opt.additional_class])
    }
    if(cls_stat.length && !cls_dyn.length) {
        if(opt.static_attrs) {
            stat.push(['class', ['string', cls_stat.map(x => x[1]).join(' ')]])
        } else {
            dyn.push(['class', ['string', cls_stat.map(x => x[1]).join(' ')]])
        }
    } else if(cls_stat.length && cls_dyn.length) {
        dyn.push(['class', cls_dyn.reduce((x, y) =>
            optimize_plus(optimize_plus(x, ['string', ' ']), y),
            ['string', cls_stat.map(x => x[1]).join(' ')])])
    } else if(cls_dyn.length) {
        dyn.push(['class', cls_dyn.slice(1).reduce((x, y) =>
            optimize_plus(optimize_plus(x, ['string', ' ']), y),
            cls_dyn[0])])
    }
    return [stat, dyn]
}

function insert_static(elname, attributes, path, opt) {
    let topscope = path.scope;
    while(topscope.parent) {
        topscope = topscope.parent;
    }
    let array = [];
    for(var [aname, value] of attributes) {
        array.push(T.stringLiteral(aname))
        if(value == undefined) {
            array.push(T.stringLiteral(aname))
        } else {
            array.push(expression.compile(value, path, opt))
        }
    }
    let ident = topscope.generateUidIdentifier(
        elname.toUpperCase() + '_ATTRS');
    topscope.push({
        id: ident,
        init: T.arrayExpression(array),
        kind: 'let' })
    return ident;
}

function insert_stores(elname, stores, genattrs, path, opt) {
    genattrs.push(['__stores', T.objectExpression(
        stores.map(([_store, name, value]) => {
            let [call, expr, args] = value
            if(call != 'call' || !Array.isArray(args) || args.length != 1) {
                throw parse_tree_error("Store constructor must be a function" +
                    " call with exactly one argument. " +
                    "For example: `createStore(x)`. Got", value)
            }
            return T.objectProperty(
                T.identifier(name),
                T.functionExpression(null,
                    [T.identifier('state')], T.blockStatement([
                    // TODO(tailhook) pass path to function rather than outer
                    T.returnStatement(T.callExpression(
                        expression.compile(expr, path, opt),
                        [expression.compile(args[0], path, opt),
                         T.identifier('state')]))
                ])))
        }))])
}

function insert_links(links, genattrs, path, opt) {
    for(let [_link, names, action, target] of links) {
        let fid = path.scope.generateUidIdentifier('ln_' + names.join('_'))
        let fun = T.functionDeclaration(fid, [T.identifier('event')],
            T.blockStatement([]))
        let fpath = push_to_body(path, fun).get('body');
        console.assert(target[0] == 'store');
        let store = path.scope.getData('khufu:store:raw:' + target[1]);
        if(!store) {
            throw Error("Unknown store: " + target[1]);
        }
        fpath.scope.setData('binding:this', T.identifier('this'))
        fpath.scope.setData('binding:event', T.identifier('event'))
        push_to_body(fpath, T.callExpression(
            T.memberExpression(store, T.identifier('dispatch')),
                [expression.compile(action, fpath, opt)]));

        for(let name of names) {
            // TODO(tailhook) support multiple links
            genattrs.push(['on' + name, fid]);
        }
    }
}

export function compile(element, path, opt, key) {
    let [_element, name, classes, attributes, children] = element;

    let links = children.filter(([x]) => x == 'link')
    let stores = children.filter(([x]) => x == 'store')
    let body = children.filter(([x]) => x != 'link' && x != 'store');

    if(classes.length) {
        for(let [cls, cond] of classes) {
            if(cond) {
                attributes.push(['class',
                    ['if', cond, ['string', cls], ['string', '']]]);
            } else {
                attributes.push(['class', ['string', cls]]);
            }
        }
    }
    let [stat, dyn] = sort_attributes(attributes, name, opt)
    attributes = dyn;

    let attrib_expr;
    if(stat.length) {
        attrib_expr = insert_static(name, stat, path, opt)
    }
    let genattrs = [];
    let stores_id;
    if(stores.length) {
        insert_stores(name, stores, genattrs, path, opt)
        stores_id = path.scope.generateUidIdentifier(name + '_stores');
    }
    if(links.length) {
        insert_links(links, genattrs, path, opt)
    }

    let attribs = [
        T.stringLiteral(name),
        // We need to add a tag name to the element, because incremental-dom
        // throws an exception when tag name is changed. Changing tag
        // name is is only possible with hot-reload, though.
        //
        // TODO(tailhook) should we do it only if hot-reload is enabled?
        join_key(T.stringLiteral(name), key),
    ];
    if(attributes.length || genattrs.length) {
        attribs.push(attrib_expr || T.nullLiteral())
        for(var [aname, value] of attributes) {
            attribs.push(T.stringLiteral(aname))
            if(value) {
                attribs.push(expression.compile(value, path, opt))
            } else {
                attribs.push(T.stringLiteral(aname))
            }
        }
        for(var [aname, value] of genattrs) {
            attribs.push(T.stringLiteral(aname))
            attribs.push(value)
        }
    } else if(attrib_expr) {
        attribs.push(attrib_expr)
    }
    if(body.length == 0) {
        let node = T.callExpression(T.identifier('elementVoid'), attribs)
        path.node.body.push(T.expressionStatement(node))
    } else {
        let el = T.callExpression(T.identifier('elementOpen'), attribs);
        if(stores_id) {
            el = T.variableDeclaration('let', [
                T.variableDeclarator(stores_id,
                    T.memberExpression(el, T.identifier('__stores')))])
        } else {
            el = T.expressionStatement(el)
        }
        push_to_body(path, el)

        let blockpath = push_to_body(path, T.blockStatement([]));
        if(stores_id) {
            for(let [_store, name, _] of stores) {
                blockpath.scope.setData('khufu:store:raw:' + name,
                    T.memberExpression(stores_id, T.identifier(name)));
                blockpath.scope.setData('khufu:store:state:' + name, null);
            }
        }
        compile_body(body, blockpath, opt)
        /// Optimize the scope without variables
        if(Object.keys(blockpath.scope.bindings).length == 0) {
            blockpath.replaceWithMultiple(
                blockpath.get('body').map(x => x.node))
        }

        path.node.body.push(T.expressionStatement(
            T.callExpression(T.identifier('elementClose'),
                [T.stringLiteral(name)])))
    }
}
