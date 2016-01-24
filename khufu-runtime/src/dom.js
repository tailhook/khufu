import {text} from 'incremental-dom'

export function item(value) {
    if(typeof value == 'function') {
        value()
    } else {
        text(value)
    }
}
