import {store_handler, cleanup_stores} from './stores'
import {patch, attributes, notifications, symbols} from 'incremental-dom'
import {elementOpen, elementClose, elementVoid, text} from 'incremental-dom'
import {applyAttr, applyProp} from 'incremental-dom'
import stores, {CANCEL} from './stores'
import {add_style} from './style'
import {item} from './dom'


export {CANCEL, add_style, item,
        elementOpen, elementClose, elementVoid, text}

/// Things that can only be assigned as properties
const PROPERTIES = {
    "value": "value",
}

// This is different from incremental-dom default, because it sets boolean
// attributes as property instead of attribute. This works better for
// properties like `checked`. May need better heuristics though.
//
// Also some things like "value" do nothing when not applied as properties
function applyAttribute(el, name, value) {
    let type = typeof value
    let prop = PROPERTIES[name]
    if(prop) {
        applyProp(el, prop, value)
    } else if (type === 'object' || type === 'function' || type == 'boolean') {
        applyProp(el, name, value)
    } else {
        applyAttr(el, name, value)
    }
}

function set_global_state(params) {
    var old = {
        stores: attributes.__stores,
        applyAttr: attributes[symbols.default],
        deleted: notifications.nodesDeleted,
    }
    attributes.__stores = store_handler(params)
    attributes[symbols.default] = applyAttribute
    notifications.nodesDeleted = cleanup_stores
    return old
}

function clean_global_state(old) {
    notifications.nodesDeleted = old.deleted
    attributes[symbols.default] = old.applyAttr
    attributes.__stores = old.stores
}

export default function init(element, template, settings) {
    if(typeof settings.store !== 'function') {
        throw Error("Third argument to khufu must be a settings object " +
                    "and has `store` function (see http://bit.ly/store_cons)")
    }

    let params = {...settings, render: queue_render }

    let queued = false;
    function queue_render() {
        if(!queued) {
            queued = true;
            window.requestAnimationFrame(render)
        }
    }
    function render() {
        queued = false;
        let obj = set_global_state(params)
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
