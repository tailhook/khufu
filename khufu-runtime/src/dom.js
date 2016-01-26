import {text} from 'incremental-dom'

export function item(value, key) {
    if(typeof value == 'function') {
        value(key)
    } else {
        text(value)
    }
}
