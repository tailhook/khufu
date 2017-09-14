var parser = require('./../src/grammar.js').parser;
var expect = require('chai').expect;

describe("views", () => {
    it("empty", () => {
        expect(parser.parse("view main():"))
            .to.deep.equal([['view', 'main', [], [], []]])
    })
    it("with arg", () => {
        expect(parser.parse("view some(x):"))
            .to.deep.equal([['view', 'some', [['name', 'x']], [], []]])
    })
    it("with args", () => {
        expect(parser.parse("view some(x, y, mm):"))
            .to.deep.equal([['view', 'some',
                [['name', 'x'], ['name', 'y'], ['name', 'mm']], [], []]])
    })
    it("with complex args", () => {
        expect(parser.parse("view some(@s, x, [y, z], {k, l: [a, b]}):"))
            .to.deep.equal([['view', 'some',
                [['store', 's'],
                 ['name', 'x'],
                 ['unpack_list', [['name', 'y'], ['name', 'z']]],
                 ['unpack_map', [['k', ['name', 'k']], ['l',
                    ['unpack_list', [['name', 'a'], ['name', 'b']]]]]]],
                [],
                []]])
    })
    it("element", () => {
        expect(parser.parse("view main():\n <button>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [], []]
            ]]])
    })
    it("attribute string", () => {
        expect(parser.parse("view main():\n <button a='x'>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [['a', ['string', 'x']]], []]
            ]]])
    })
    it("attribute int", () => {
        expect(parser.parse("view main():\n <button a=123>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [['a', ['number', '123']]], []]
            ]]])
    })
    it("attribute var", () => {
        expect(parser.parse("view main():\n <button a=xx>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [['a', ['name', 'xx']]], []]
            ]]])
    })
    it("attribute dotname", () => {
        expect(parser.parse("view main():\n <button a=xx.yy>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [
                    ['a', ['attr', ['name', 'xx'], 'yy']],
                ], []]
            ]]])
    })
    it("attribute store", () => {
        expect(parser.parse("view main():\n <button a=@s>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [['a', ['store', 's']]], []]
            ]]])
    })
    it("attribute store attr", () => {
        expect(parser.parse("view main():\n <button a=@s.val>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [
                    ['a', ['attr', ['store', 's'], 'val']]
                ], []]
            ]]])
    })
    it("attribute obj", () => {
        expect(parser.parse("view main():\n <button a={}>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [['a', ['object', []]]], []]
            ]]])
    })
    it("attribute -1", () => {
        expect(parser.parse("view main():\n <button a=-1>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [['a', ['number', '-1']]], []]
            ]]])
    })
    it("text", () => {
        expect(parser.parse("view main():\n <button>\n  'x'"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [],
                    [['expression', ['string', 'x']]]]
            ]]])
    })
    it("number", () => {
        expect(parser.parse("view main():\n <button>\n  153"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [],
                    [['expression', ['number', '153']]]]
            ]]])
    })
    it("two elements", () => {
        expect(parser.parse("view main():\n  <button>\n //x\n  <h1>\n"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [], []],
                ['element', 'h1', [], [], []],
            ]]])
    })
    it("two elements with a comment", () => {
        expect(parser.parse("view main():\n  <button>\n //x\n  <h1>\n"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [], []],
                ['element', 'h1', [], [], []],
            ]]])
    })
    it("nested elements", () => {
        expect(parser.parse("view main():\n <div>\n  <h1>"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'div', [], [], [
                    ['element', 'h1', [], [], []]
                ]]
            ]]])
    })
    it("store", () => {
        expect(parser.parse("view main():\n <p>\n  store @name = expression"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'p', [], [], [
                    ['store', 'name', ['name', 'expression'], []]]]
            ]]])
    })
    it("store with pipe", () => {
        expect(parser.parse("view main():\n <p>\n" +
                            "  store @name = expression\n   | x"))
            .to.deep.equal([['view', 'main', [], [], [
                ['element', 'p', [], [], [
                    ['store', 'name', ['name', 'expression'], [['name', 'x']]]]]
            ]]])
    })
    it("link", () => {
        expect(parser.parse(
                "view main():\n <button>\n" +
                "  link {click} f(x) -> @y"
            )).to.deep.equal([['view', 'main', [], [], [
                ['element', 'button', [], [], [
                    ['link', ['click'],
                        ['call', ['name', 'f'], [['name', 'x']]],
                        ['store', 'y']]
            ]]]]])
    })
    it("empty not precedence", () => {
        expect(parser.parse("view main(x):\n not x.y"))
            .to.deep.equal([['view', 'main', [['name', 'x']], [], [
                ['expression', ['unary', '!', ['attr', ['name', 'x'], 'y']]]
            ]]])
    })
    it("empty template", () => {
        expect(parser.parse("view main():\n ``"))
            .to.deep.equal([['view', 'main', [], [], [
                ['expression', ['template', [["const", ""]]]]
            ]]])
    })
    it("const template", () => {
        expect(parser.parse("view main():\n `hello`"))
            .to.deep.equal([['view', 'main', [], [], [
                ['expression', ['template', [['const', "hello"]]]]
            ]]])
    })
    it("var in template", () => {
        expect(parser.parse("view main(x):\n\n `${x}`"))
            .to.deep.equal([['view', 'main', [['name', 'x']], [], [
                ['expression', ['template', [
                    ['const', ''], ['expr', ['name', "x"]], ['const', '']
                ]]]
            ]]])
    })
    it("operator in template", () => {
        expect(parser.parse("view main(x):\n\n `${x+1}`"))
            .to.deep.equal([['view', 'main', [['name', 'x']], [], [
                ['expression', ['template', [
                    ['const', ''], ['expr', ['binop', '+',
                        ['name', "x"], ['number', '1']]], ['const', '']
                ]]]
            ]]])
    })
    it("template in attr", () => {
        expect(parser.parse("view main(x):\n <a href=`${x}`>"))
            .to.deep.equal([['view', 'main', [['name', 'x']], [], [
                ['element', 'a', [], [['href',
                    ['template', [
                        ['const', ''], ['expr', ['name', "x"]], ['const', '']
                    ]]
                ]], []]
            ]]])
    })
})
