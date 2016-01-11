import {createStore} from 'redux'
import {main} from './counter.khufu'
import {patch, attributes} from 'incremental-dom'

attributes.__stores = function(element, name, defs) {
    let old = element.__stores || {};
    let value = defs.__target;
    delete defs.__target;
    for(let k in defs) {
        let store = old[k];
        if(store) {
            delete old[k];
        } else {
            store = createStore(defs[k]);
            store.subscribe(redraw)
        }
        value[k] = store;
    }
    for(let k in old) {
        old[k].dispatch({'type': 'cleanup'})
    }
    console.log("STORES", value,
        ...Object.keys(value).map(x => [x, value[x].getState()]));
    element.__stores = value
}

function redraw() {
    patch(document.getElementById('app'), main)
}

redraw()
