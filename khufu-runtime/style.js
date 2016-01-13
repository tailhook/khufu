export function add_style(text) {
    let style = document.createElement('style');
    let txnode = document.createTextNode(text)
    style.appendChild(txnode)
    document.head.appendChild(style)
    // Similar to subscribe/unsubscribe pattern
    return function remove() {
        document.head.removeChild(style)
    }
}

