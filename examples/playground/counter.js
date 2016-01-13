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

export function range(start, stop, step=1) {
    let x = []
    for(let i = start; i < stop; i += step) {
        x.push(i)
    }
    return x
}
