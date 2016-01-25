import {store_handler, cleanup_stores} from './stores'
import {patch, attributes, notifications, symbols} from 'incremental-dom'
import {elementOpen, elementClose, elementVoid, text} from 'incremental-dom'
import {CANCEL} from './stores'
import {add_style} from './style'
import {item} from './dom'


export {CANCEL, add_style, item,
        elementOpen, elementClose, elementVoid, text}

// This is different from incrementa-dom default, because it sets boolean
// attributes as property instead of attribute. This works better for
// properties like `checked`. May need better heuristics though.
function applyAttribute(el, name, value) {
   var type = typeof value;
   if (type === 'object' || type === 'function' || type == 'boolean') {
       applyProp(el, name, value);
   } else {
       applyAttr(el, name, value);
   }
}

function set_global_state(fun) {
    var old = {
        stores: attributes.__stores,
        applyAttr: attributes[symbols.default],
        deleted: notifications.nodesDeleted,
    }
    attributes.__stores = store_handler(fun)
    attributes[symbols.default] = applyAttribute
    notifications.nodesDeleted = cleanup_stores
    return old
}

function clean_global_state(old) {
    notifications.nodesDeleted = old.deleted
    attributes[symbols.default] = old.applyAttr
    attributes.__stores = old.stores
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
