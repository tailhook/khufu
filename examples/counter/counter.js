export function Counter(state=0, action) {
    switch(action.type) {
        case 'incr':
            return state + action.value;
        default:
            return state;
    }
}

export function counter(x) {
    return { type: 'incr', value: x }
}
