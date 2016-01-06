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
})
