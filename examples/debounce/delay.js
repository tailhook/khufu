import {applyMiddleware, createStore} from 'redux'
import {CANCEL} from 'khufu-runtime'
import {fork, take, cancel, race, put} from 'redux-saga/effects'

var sleep = (num) => new Promise((accept) => setTimeout(accept, num))

export function delay(action) {
    return {type: 'delay', action: action}
}

function* guard(generator) {
    let task = yield fork(generator)
    yield take(CANCEL)
    yield cancel(task)
}

export function delay_saga(msec) {
    function* debounce() {
        console.log("VALUE")
        while(true) {
            let action = yield take('delay')
            let deadline = Date.now() + msec
            let diff
            while ((diff = deadline - Date.now()) > 0) {
                let {event} = yield race({
                    event: take('delay'),
                    timeout: sleep(diff),
                })
                if(event) action = event;
            }
            yield put(action.action)
        }
    }
    return {saga: debounce}
}
