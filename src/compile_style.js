import * as T from "babel-types"
import {push_to_body} from './babel-util'
import {parse_tree_error} from './compiler'

export function write_line(buf, item) {
    switch(item[0]) {
        case 'property': {
            let [_property, name, value] = item;
            buf.push(`  ${name}: ${value};`);
            break;
        }
    }
}

export function compile_text(body) {
    let buf = []
    for(var item of body) {
        switch(item[0]) {
            case 'rule': {
                let [_rule, selectors, properties] = item;
                buf.push(selectors.join(', ') + ' {')
                    for(var line of properties) {
                        write_line(buf, line)
                    }
                buf.push('}')
                break;
            }
            default:
                throw parse_tree_error('Unknown element', body)
        }
    }
    return buf.join('\n')
}

export function compile(style, path, opt) {
    let [_style, body] = style;
    if(!path.scope.getData('khufu:style-imported')) {
        path.unshiftContainer("body", T.importDeclaration(
            [T.importSpecifier(
                T.identifier("add_style"), T.identifier("add_style"))],
            T.stringLiteral("khufu-runtime")))
        path.scope.setData('khufu:style-imported', true)
    }
    let data = compile_text(body)
    let id = path.scope.generateUidIdentifier('style_remover');
    push_to_body(path, T.variableDeclaration('let', [
        T.variableDeclarator(id,
            T.callExpression(T.identifier('add_style'),
                              [T.stringLiteral(data)]))
    ]));
    push_to_body(path, T.ifStatement(
        T.memberExpression(T.identifier('module'), T.identifier('hot')),
        T.blockStatement([T.expressionStatement(
            T.callExpression(
            T.memberExpression(
            T.memberExpression(T.identifier('module'), T.identifier('hot')),
            T.identifier('dispose')),
            [id]))])))
}
