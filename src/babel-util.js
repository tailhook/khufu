export function push_to_body(path, node) {
    path.pushContainer("body", [node]);
    let pbody = path.get('body')
    return pbody[pbody.length-1]
}
