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

export function cleanup_stores(nodes) {
    for(let n of nodes) {
        let stores = n.__stores;
        if(stores) {
            for(var k in stores) {
                let store = stores[k]
                store.__redraw_unsubscr()
                store.dispatch({type: CANCEL, reason: 'element-removed'})
            }
        }
    }
}
