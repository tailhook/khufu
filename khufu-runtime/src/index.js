import {store_handler, cleanup_stores} from './stores'
import {patch, attributes, notifications} from 'incremental-dom'
import {elementOpen, elementClose, elementVoid, text} from 'incremental-dom'
import {CANCEL} from './stores'
import {add_style} from './style'
import {item} from './dom'


export {CANCEL, add_style, item,
        elementOpen, elementClose, elementVoid, text}

function set_global_state(fun) {
    var old = {
        stores: attributes.__stores,
        deleted: notifications.nodesDeleted,
    }
    attributes.__stores = store_handler(fun)
    notifications.nodesDeleted = cleanup_stores
    return old
}

function clean_global_state(old) {
    attributes.__stores = old.stores
    notifications.nodesDeleted = old.deleted
}

export default function init(element, template) {
    let queued = false;
    function queue_render() {
        if(!queued) {
            queued = true;
            window.requestAnimationFrame(render)
        }
    }
    function render() {
        queued = false;
        let obj = set_global_state(queue_render)
        try {
            patch(element, template)
        } catch(e) {
            console.error("Render error", e)
        }
        clean_global_state(obj)
    }
    render() // Immediate render works better with hot reload
    return {
        queue_render
    }
}
