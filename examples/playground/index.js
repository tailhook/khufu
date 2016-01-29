import {createStore, applyMiddleware} from 'redux'
import khufu from 'khufu-runtime'
import regeneratorRuntime from 'regenerator/runtime'

window.regeneratorRuntime = regeneratorRuntime

import {main} from './counter.khufu'

khufu(document.getElementById('app'), main(), {
    store(reducer, middleware, state) {
        return createStore(reducer, state,
            applyMiddleware(...middleware))
    }
})

if(module.hot) {
    module.hot.accept()
}
