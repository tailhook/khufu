import {parser} from './../src/grammar.js'
import {compile_text as compile} from '../src/compiler.js'
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
