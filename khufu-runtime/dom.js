import {elementOpen, elementClose, elementVoid, text} from 'incremental-dom'
export {elementOpen, elementClose, elementVoid, text}

export function expr(value) {
    if(value != null) { // Yes I mean null or undefined, hence `!=`
        text(value)
    }
}
