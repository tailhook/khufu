export function value(value='', action) {
    switch(action.type) {
        case 'set':
            return action.value
    }
}

export function set(value) {
    return {
        type: 'set',
        value: value,
    }
}
