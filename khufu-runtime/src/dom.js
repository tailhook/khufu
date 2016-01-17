import {text} from 'incremental-dom'

export function expr(value) {
    if(value != null) { // Yes I mean null or undefined, hence `!=`
        text(value)
    }
}
