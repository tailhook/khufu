import {parse_tree_error} from "./compiler"


export function set_var(path, name, expr) {
    path.scope.setData('khufu:binding:' + name, expr)
    path.scope.setData('khufu:store:state:' + name, null)
}

export function get_var(path, name, anchor=null) {
    let binding = path.scope.getData('khufu:binding:' + name);
    if(!binding && anchor) {
        throw parse_tree_error("Unknown variable: " + name, anchor);
    }
    return binding
}

