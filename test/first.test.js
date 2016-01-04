var khufu = require('./../src/index.js');

var assert = require('assert');
var expect = require('chai').expect;

describe("simple test", () => {
    it("compiles empty string", () => {
        assert.equal(khufu.compile(""), "")
        expect(khufu.compile("")).to.equal("")
    })
})
