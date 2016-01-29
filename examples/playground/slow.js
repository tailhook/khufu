import {applyMiddleware, createStore} from 'redux'
import {take, put} from 'redux-saga'
import middleware from 'redux-saga'
import {counter, block, unblock} from './counter'

var sleep = (num) => new Promise((accept) => setTimeout(accept, num))

function* _delayable() {
    while(true) {
        let action = yield take('count')
        yield put(block())
        for(var i = 0; i < action.num; ++i) {
            yield sleep(action.step)
            yield put(counter(1))
        }
        yield put(unblock())
    }
}

export function count(num, step) {
    return {
        type: 'count',
        num: num,
        step: step,
    }
}

export var delayable = middleware(_delayable)
