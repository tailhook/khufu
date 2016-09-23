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
    let local_stores = new Map()
    let stores_id = path.scope.generateUidIdentifier(elname + '_stores');
    genattrs.push(['__stores', T.objectExpression(
        stores.map(([_store, name, value, middlewares]) => {
            local_stores.set(name,
                T.memberExpression(stores_id, T.identifier(name)));
            return T.objectProperty(
                T.identifier(name),
                T.functionExpression(null,
                    [], T.blockStatement([
                        // TODO(tailhook) pass path to inner function
                        T.returnStatement(T.arrayExpression([
                            expression.compile(value, path, opt),
                            T.arrayExpression(middlewares.map(m =>
                                expression.compile(m, path, opt)))]))
                ])))
        }))])
    return [stores_id, local_stores]
}

function insert_links(links, genattrs, local_stores, path, opt) {
    let map = new Map()
    for(let [_link, names, action, target] of links) {
        for(let name of names) {
            if(map.has(name)) {
                map.get(name).push([action, target])
            } else {
                map.set(name, [[action, target]])
            }
        }
    }
    /// First visiting single-handler events
    for(let [_link, names, action, target] of links) {
        let single_refcnt_names = names.filter(x => map.get(x).length == 1);
        if(single_refcnt_names.length == 0)
            continue;

        let fid = path.scope.generateUidIdentifier(
            'ln_' + single_refcnt_names.join('_'))
        let fun = T.functionDeclaration(fid, [T.identifier('event')],
            T.blockStatement([]))
        let fpath = push_to_body(path, fun).get('body');
        console.assert(target[0] == 'store');
        let store = path.scope.getData('khufu:store:raw:' + target[1]);
        if(!store) {
            store = local_stores.get(target[1]);
            if(!store) {
                throw parse_tree_error("Unknown store: " + target[1], target);
            }
        }
        fpath.scope.setData('binding:this', T.identifier('this'))
        fpath.scope.setData('binding:event', T.identifier('event'))
        push_to_body(fpath, T.callExpression(
            T.memberExpression(store, T.identifier('dispatch')),
                [expression.compile(action, fpath, opt)]));

        for(let name of single_refcnt_names) {
            genattrs.push(['on' + name, fid]);
        }
    }
    /// For now multiple handler events we create for each event separately
    for(let [name, handlers] of map.entries()) {
        if(handlers.length == 1)
            continue;

        let fid = path.scope.generateUidIdentifier('ln_' + name)
        let fun = T.functionDeclaration(fid, [T.identifier('event')],
            T.blockStatement([]))
        let fpath = push_to_body(path, fun).get('body');

        for(let [action, target] of handlers) {
            console.assert(target[0] == 'store');
            let store = path.scope.getData('khufu:store:raw:' + target[1]);
            if(!store) {
                throw parse_tree_error("Unknown store: " + target[1], handlers);
            }
            fpath.scope.setData('binding:this', T.identifier('this'))
            fpath.scope.setData('binding:event', T.identifier('event'))
            push_to_body(fpath, T.callExpression(
                T.memberExpression(store, T.identifier('dispatch')),
                    [expression.compile(action, fpath, opt)]));
        }

        genattrs.push(['on' + name, fid]);
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
    let genattrs = []
    let local_stores = {}
    let stores_id;
    if(stores.length) {
        [stores_id, local_stores] = insert_stores(name, stores, genattrs, path, opt)
    }
    if(links.length) {
        insert_links(links, genattrs, local_stores, path, opt)
    }

    let attribs = [
        T.stringLiteral(name),
        // We need to add a tag name to the element, because incremental-dom
        // throws an exception when tag name is changed. Changing tag
        // name is is only possible with hot-reload, though.
        //
        // TODO(tailhook) should we do it only if hot-reload is enabled?
        join_key(key, T.stringLiteral('-'+name)),
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
    if(body.length == 0 && stores.length == 0) {
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
            for(let [name, expr] of local_stores) {
                blockpath.scope.setData('khufu:store:raw:' + name, expr);
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
