export function Flag(state=false, action) {
    switch(action.type) {
        case 'set':
            return action.value;
        default:
            return state;
    }
}

export function set_true() {
    return { type: 'set', value: true }
}

export function set_false() {
    return { type: 'set', value: false }
}

export function Fruits(state={"banana": {"price": 17}}, action) {
    switch(action.type) {
        case 'set':
            return action.value;
        default:
            return state;
    }
}

export function good_value() {
    return { type: 'set', value: {"banana": {"price": 10}} }
}

export function bad_value() {
    return { type: 'set', value: {} }
}
