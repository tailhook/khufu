export function Text(state="", action) {
    switch(action.type) {
        case 'update':
            return state = action.value
        default:
            return state;
    }
}

export function update(x) {
    return { type: 'update', value: x }
}
