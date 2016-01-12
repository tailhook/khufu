import {createStore} from 'redux'
import {patch, attributes} from 'incremental-dom'
var main = require('./counter.khufu').main

export function redraw() {
    patch(document.getElementById('app'), main)
}

attributes.__stores = function(element, name, defs) {
    let old = element.__stores || {};
    let value = defs.__target;
    delete defs.__target;
    for(let k in defs) {
        let store = old[k];
        if(store) {
            if(module.hot) {
                store.__redraw_unsubscr(redraw)
                store.replaceReducer(defs[k])
                store.__redraw_unsubscr = store.subscribe(redraw)
            }
            delete old[k];
        } else {
            store = createStore(defs[k]);
            store.__redraw_unsubscr = store.subscribe(redraw)
        }
        value[k] = store;
    }
    for(let k in old) {
        old[k].dispatch({'type': 'cleanup'})
    }
    element.__stores = value
}

redraw()

if(module.hot) {
    module.hot.accept(function(err) {
        console.error("Error on hot-reload:", this, err)
    })
    module.hot.accept("./counter.khufu", function() {
        main = require('./counter.khufu').main || main
        redraw()
    })
}
