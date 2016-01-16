import {attributes} from 'incremental-dom'

export const REMOVED = '@@khufu/REMOVED'

export function store_handler(do_render, unsubscriptions) {
    return function(element, name, defs) {
        let old = element.__stores || {};
        let value = {};
        for(let k in defs) {
            let store = old[k];
            if(store) {
                if(module.hot && module.hot.status() == 'apply') {
                    store.__redraw_unsubscr()
                    store = defs[k](store.getState())
                    store.__redraw_unsubscr = store.subscribe(do_render)
                }
                delete old[k];
            } else {
                store = defs[k]();
                store.__redraw_unsubscr = store.subscribe(do_render)
            }
            value[k] = store;
        }
        for(let k in old) {
            let store = old[k]
            store.__redraw_unsubscr()
            store.dispatch({'type': REMOVED})
        }
        element.__stores = value
    }
}
