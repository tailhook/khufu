import {createStore, applyMiddleware} from 'redux'
import {attach} from 'khufu-runtime'
import {main} from './components.khufu'

attach(document.getElementById('app'), main(), {
    store(reducer, middleware, state) {
        return createStore(reducer, state,
            applyMiddleware(...middleware))
    }
})
