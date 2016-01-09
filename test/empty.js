var khufu = require('./../src/compiler.js');

var assert = require('assert');
var expect = require('chai').expect;

describe("simple test", () => {
    const imp = 'import { elementVoid, elementOpen, elementClose, text } ' +
                'from "incremental-dom";';
    it("compiles empty string", () => {
        expect(khufu.compile_text("")).to.equal(imp)
    })
    it("skips comments", () => {
        expect(khufu.compile_text("/// something")).to.equal(imp)
    })
})
