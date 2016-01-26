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
    it("class", () => {
        expect(parser.parse("style:\n  .left\n    text-align: left\n"))
            .to.deep.equal([['style', [
                ['rule', ['.left'], [['property', 'text-align', 'left']]]
            ]]])
    })
    it("two elements", () => {
        expect(parser.parse("style:\n  .left, a\n    text-align: left\n"))
            .to.deep.equal([['style', [
                ['rule', ['.left', 'a'], [['property', 'text-align', 'left']]]
            ]]])
    })
    it("two classes", () => {
        expect(parser.parse("style:\n  .a.left\n    text-align: left\n"))
            .to.deep.equal([['style', [
                ['rule', ['.a.left'], [['property', 'text-align', 'left']]]
            ]]])
    })
    it("element + class", () => {
        expect(parser.parse("style:\n  p.a.left\n    text-align: left\n"))
            .to.deep.equal([['style', [
                ['rule', ['p.a.left'], [['property', 'text-align', 'left']]]
            ]]])
    })
    it("two dimensions", () => {
        expect(parser.parse("style:\n  body\n    margin: 2px 4px\n"))
            .to.deep.equal([['style', [
                ['rule', ['body'], [['property', 'margin', '2px 4px']]]
            ]]])
    })
    it("two indented", () => {
        expect(parser.parse('style:\n body\n  margin:\n' +
            '   2px // vert\n' +
            '   4px // horizon\n'))
        .to.deep.equal([['style', [
            ['rule', ['body'], [['property', 'margin', '2px 4px']]]
        ]]])
    })
    it('url', () => {
        expect(parser.parse('style:\n body\n  background: url(google.com)'))
        .to.deep.equal([['style', [
            ['rule', ['body'], [['property', 'background', 'url(google.com)']]]
        ]]])
    })
    it('url quoted', () => {
        expect(parser.parse('style:\n body\n  background: url("a)b")'))
        .to.deep.equal([['style', [
            ['rule', ['body'], [['property', 'background', 'url("a)b")']]]
        ]]])
    })
    it('color', () => {
        expect(parser.parse('style:\n body\n  background: #FFF'))
        .to.deep.equal([['style', [
            ['rule', ['body'], [['property', 'background', '#FFF']]]
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
    it("percent value", () => {
        expect(parser.parse("style:\n  body\n    width: 75%\n"))
            .to.deep.equal([['style', [
                ['rule', ['body'], [['property', 'width', '75%']]]
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
        )[0][1], {always_add_class: new Set()})).to.equal(
            'p {\n' +
            '    text-align: left\n' +
            '}')
    })
})
