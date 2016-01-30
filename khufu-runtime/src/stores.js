import {attributes} from 'incremental-dom'

export var store_constructor
export const CANCEL = '@@khufu/CANCEL'

export function store_handler(params, unsubscriptions) {
    return function(element, name, defs) {
        let old = element.__stores || {};
        let value = {};
        for(let k in defs) {
            let store = old[k];
            if(store) {
                if(module.hot && module.hot.status() == 'apply') {
                    // Let's get state before cancel in case cancel destructs
                    // the state
                    let old_state = store.getState()
                    store.__redraw_unsubscr()
                    store.dispatch({type: CANCEL, reason: 'hot-reload'})
                    let [reducer, middleware] = defs[k]();
                    store = params.store(reducer, middleware, old_state)
                    store.__redraw_unsubscr = store.subscribe(params.render)
                }
                delete old[k];
            } else {
                let [reducer, middleware] = defs[k]();
                store = params.store(reducer, middleware)
                store.__redraw_unsubscr = store.subscribe(params.render)
            }
            value[k] = store;
        }
        for(let k in old) {
            let store = old[k]
            store.__redraw_unsubscr()
            store.dispatch({type: CANCEL, reason: 'store-removed'})
        }
        element.__stores = value
    }
}

function cleanup_stores_from(node) {
    let stores = node.__stores;
    if(stores) {
        for(var k in stores) {
            let store = stores[k]
            store.__redraw_unsubscr()
            store.dispatch({type: CANCEL, reason: 'element-removed'})
        }
    }
}

export function cleanup_stores(nodes) {
    for(let n of nodes) {
        if(n.nodeType == 1) {
            // The elements are in preorder, but we should do depth first
            // cleanup of stores. So we iterate in reverse order
            let children = n.getElementsByTagName('*');
            for(let i = children.length-1; i >= 0; --i) {
                cleanup_stores_from(children[i])
            }
            cleanup_stores_from(n)
        }
    }
}
