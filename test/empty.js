var khufu = require('./../src/compiler.js');

var assert = require('assert');
var expect = require('chai').expect;

describe("simple test", () => {
    it("compiles empty string", () => {
        expect(khufu.compile_text("")).to.equal('')
    })
    it("skips comments", () => {
        expect(khufu.compile_text("/// something")).to.equal('')
    })
})
