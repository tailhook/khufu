import Lexer from '../src/lexer.js'
import {expect} from 'chai'

function lex(str) {
    let x = new Lexer();
    let tok
    let res = []
    x.setInput(str);
    while((tok = x.lex()) != undefined) {
        res.push(tok)
    }
    return res
}

describe("lexes", () => {
    it("default imports", () => {
        expect(lex("import x from 'y'"))
            .to.deep.equal(['import', 'IDENT', 'from', 'STRING', 'NL', 'EOF'])
    })
})
