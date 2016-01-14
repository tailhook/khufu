import {createStore} from 'redux'
import {attributes} from 'incremental-dom'

export const REMOVED = '@khufu/removed'

export function store_handler(do_render, unsubscriptions) {
    return function(element, name, defs) {
        let old = element.__stores || {};
        let value = defs.__target;
        delete defs.__target;
        for(let k in defs) {
            let store = old[k];
            if(store) {
                if(module.hot) {
                    store.__redraw_unsubscr()
                    store.replaceReducer(defs[k])
                    store.__redraw_unsubscr = store.subscribe(do_render)
                }
                delete old[k];
            } else {
                store = createStore(defs[k]);
                store.__redraw_unsubscr = store.subscribe(do_render)
            }
            value[k] = store;
        }
        for(let k in old) {
            let store = old[k]
            store.dispatch({'type': REMOVED})
            store.__redraw_unsubscr()
        }
        element.__stores = value
    }
}
