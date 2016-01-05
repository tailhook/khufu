var parser = require('./../src/grammar.js').parser;
var expect = require('chai').expect;

describe("styles", () => {
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
})
