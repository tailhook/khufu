import {store_handler} from './stores'
import {patch, attributes} from 'incremental-dom'
import {REMOVED} from './stores'
import {add_style} from './style'

export {REMOVED, add_style}

function set_global_state(fun) {
    attributes.__stores = store_handler(fun)
}

function clean_global_state(old) {
    // probably we don't need to clean attributes.__stores
}

export default function init(element, template) {
    function render() {
        let obj = set_global_state(render)
        try {
            patch(element, template)
        } catch(e) {
            console.error("Render error", e)
        }
        clean_global_state(obj)
    }
    render()
    return render
}
