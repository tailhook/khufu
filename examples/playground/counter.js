import {combineReducers} from 'redux'

export function Counter(state=0, action) {
    switch(action.type) {
        case 'incr':
            return state + action.value;
        default:
            return state;
    }
}

export function Blocker(state=null, action) {
    console.log("Blocker", state, action)
    switch(action.type) {
        case 'block': return "blocked"
        case 'unblock': return null
        default:
            return state;
    }
}

export function counter(x) {
    return { type: 'incr', value: x }
}

export function block(x) {
    return { type: 'block'}
}

export function unblock(x) {
    return { type: 'unblock'}
}

export var blockingCounter = combineReducers({
    value: Counter,
    block: Blocker,
    })
