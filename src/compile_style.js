import * as T from "babel-types"
import {push_to_body} from './babel-util'
import {parse_tree_error} from './compiler'
import postcss from 'postcss'


export function to_postcss(body, opt) {
    let root = postcss.root();
    let buf = []
    let cls = opt.additional_class.replace(/^\s*|\s+/g, '.')
    for(var item of body) {
        switch(item[0]) {
            case 'rule': {
                let [_rule, selectors, properties] = item;
                if(opt.additional_class) {
                    selectors = selectors.map(sel =>
                        sel.replace(/^([a-zA-Z0-9-]*)/, '$1' + cls))
                }
                let rule = postcss.rule({'selector': selectors.join(', ')})
                for(var line of properties) {
                    switch(line[0]) {
                        case 'property': {
                            let [_property, prop, value] = line;
                            rule.push(postcss.decl({prop, value}))
                            break;
                        }
                    }
                }
                root.push(rule)
                break;
            }
            default:
                throw parse_tree_error('Unknown element', body)
        }
    }
    return root
}

function scan_for_tags(body, opt) {
    for(var item of body) {
        switch(item[0]) {
            case 'rule': {
                let [_rule, selectors, properties] = item;
                for(let sel of selectors) {
                    // add all bare tags
                    if(/^[a-zA-Z0-9]+$/.exec(sel)) {
                        opt.always_add_class.add(sel)
                    }
                }
                break;
            }
        }
    }
}

export function compile_text(body, opt) {
    scan_for_tags(body, opt)
    return postcss(opt.postcss || [])
        .process(body, {parser: body => to_postcss(body, opt)}).css;
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
    let data = compile_text(body, opt)
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
