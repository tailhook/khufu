import {parser} from './../src/grammar.js'
import {compile_text as compile} from '../src/compiler.js'
import {compile_text as raw_style} from '../src/compile_style.js'
import {expect} from 'chai'

describe("parses styles", () => {
    it("empty", () => {
        expect(parser.parse("style:"))
            .to.deep.equal([['style', []]])
    })
    it("element", () => {
        expect(parser.parse("style:\n  body\n    text-align: left\n"))
            .to.deep.equal([['style', [
                ['rule', ['body'], [['property', 'text-align', 'left']]]
            ]]])
    })
    it("two props", () => {
        expect(parser.parse("style:\n  body\n    text-align: left\n    x: y"))
            .to.deep.equal([['style', [
                ['rule', ['body'], [
                    ['property', 'text-align', 'left'],
                    ['property', 'x', 'y'],
                ]]
            ]]])
    })
})
describe("parses styles", () => {
    it("empty", () => {
        expect(compile("style:"))
        .to.equal('import { add_style } from "khufu-runtime";\n' +
                  '\n' +
                  'let _style_remover = add_style("");\n' +
                  '\n' +
                  'if (module.hot) {\n' +
                  '  module.hot.dispose(_style_remover);\n' +
                  '}')
    })
    it("element", () => {
        expect(raw_style(parser.parse(
            "style:\n p\n  text-align: left"
        )[0][1])).to.equal(
            'p {\n' +
            '  text-align: left;\n' +
            '}')
    })
})
