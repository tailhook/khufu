var parser = require('./../src/grammar.js').parser;
var expect = require('chai').expect;

describe("views", () => {
    it("empty", () => {
        expect(parser.parse("view main():"))
            .to.deep.equal([['view', 'main', [], []]])
    })
    it("with arg", () => {
        expect(parser.parse("view some(x):"))
            .to.deep.equal([['view', 'some', ['x'], []]])
    })
    it("with args", () => {
        expect(parser.parse("view some(x, y, mm):"))
            .to.deep.equal([['view', 'some', ['x', 'y', 'mm'], []]])
    })
    it("element", () => {
        expect(parser.parse("view main():\n <button>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [], []]
            ]]])
    })
    it("two elements", () => {
        expect(parser.parse("view main():\n  <button>\n  <h1>\n"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [], []],
                ['element', 'h1', [], []],
            ]]])
    })
    it("nested elements", () => {
        expect(parser.parse("view main():\n <div>\n  <h1>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'div', [], [
                    ['element', 'h1', [], []]
                ]]
            ]]])
    })
    it("store", () => {
        expect(parser.parse("view main():\n store @name = expression"))
            .to.deep.equal([['view', 'main', [], [
                ['store', 'name', ['name', 'expression']]
            ]]])
    })
})
