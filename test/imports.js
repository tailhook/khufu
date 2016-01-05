var parser = require('./../src/grammar.js').parser;
var expect = require('chai').expect;

describe("imports", () => {
    it("default", () => {
        expect(parser.parse("import x from 'y'"))
            .to.deep.equal([['import_default', 'x', 'y']])
    })
    it("two defaults", () => {
        expect(parser.parse("import x from 'y'\nimport kk from 'vv'"))
            .to.deep.equal([
                ['import_default', 'x', 'y'],
                ['import_default', 'kk', 'vv']
                ])
    })
    it("names", () => {
        expect(parser.parse("import {x, y, z} from 'aaa'"))
            .to.deep.equal([['import_names', ['x', 'y', 'z'], 'aaa']])
    })
    it("names with newline", () => {
        expect(parser.parse("import { \n x, \n y, \n z } from 'aaa'"))
            .to.deep.equal([['import_names', ['x', 'y', 'z'], 'aaa']])
    })
})
