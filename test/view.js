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
    it("attribute string", () => {
        expect(parser.parse("view main():\n <button a='x'>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [['a', ['string', 'x']]], []]
            ]]])
    })
    it("attribute int", () => {
        expect(parser.parse("view main():\n <button a=123>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [['a', ['number', '123']]], []]
            ]]])
    })
    it("attribute var", () => {
        expect(parser.parse("view main():\n <button a=xx>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [['a', ['name', 'xx']]], []]
            ]]])
    })
    it("attribute dotname", () => {
        expect(parser.parse("view main():\n <button a=xx.yy>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [
                    ['a', ['attr', ['name', 'xx'], 'yy']],
                ], []]
            ]]])
    })
    it("attribute store", () => {
        expect(parser.parse("view main():\n <button a=@s>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [['a', ['store', 's']]], []]
            ]]])
    })
    it("attribute store attr", () => {
        expect(parser.parse("view main():\n <button a=@s.val>"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [
                    ['a', ['attr', ['store', 's'], 'val']]
                ], []]
            ]]])
    })
    it("text", () => {
        expect(parser.parse("view main():\n <button>\n  'x'"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [], [['string', 'x']]]
            ]]])
    })
    it("number", () => {
        expect(parser.parse("view main():\n <button>\n  153"))
            .to.deep.equal([['view', 'main', [], [
                ['element', 'button', [], [['number', '153']]]
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
    it("link", () => {
        expect(parser.parse(
                "view main():\n <button>\n" +
                "  link {click} f(x) -> @y"
            )).to.deep.equal([['view', 'main', [], [
                ['element', 'button', [], [
                    ['link', ['click'],
                        ['call', ['name', 'f'], ['name', 'x']],
                        ['store', 'y']]
            ]]]]])
    })
})
