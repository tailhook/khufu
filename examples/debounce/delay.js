import {applyMiddleware, createStore} from 'redux'
import {REMOVED} from 'khufu-runtime'
import {fork, take, cancel, race, put, delay} from 'redux-saga'
import middleware from 'redux-saga'
import regeneratorRuntime from 'regenerator/runtime'

export function delay_saga(sec) {
    function* debounce() {
        while(true) {
            let action = yield take('update')
            let deadline = Date.now() - sec
            let diff
            while ((diff = deadline - Date.now()) > 0) {
                let {event} = race({
                    event: take('update'),
                    timeout: delay(diff),
                })
                if(event) action = event;
            }
            yield put(event)
        }
    }
    function* guard() {
        let task = yield fork(debounce)
        yield take(REMOVED)
        yield cancel(task)
    }
    return applyMiddleware(middleware(guard))(createStore)
}
