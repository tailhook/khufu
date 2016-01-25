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

function lextxt(str) {
    let x = new Lexer();
    let tok
    let res = []
    x.setInput(str);
    while((tok = x.lex()) != undefined) {
        res.push(x.yytext)
    }
    return res
}

describe("lexes", () => {
    it("default imports", () => {
        expect(lex("import x from 'y'"))
            .to.deep.equal(['import', 'IDENT', 'from', 'STRING', 'NL', 'EOF'])
    })
    it("unescape string", () => {
        expect(lextxt("'y\\ny'"))
            .to.deep.equal(['y\ny', ''/*NL*/, ''/*EOF*/])
    })
    it("unescape unicode", () => {
        expect(lextxt("'snowman -> \u2603'"))
            .to.deep.equal(['snowman -> ☃', ''/*NL*/, ''/*EOF*/])
    })
    it("comparison operators", () => {
        expect(lex("view\n == != >= <= > < === !=="))
            .to.deep.equal(['view', 'NL', 'INDENT',
                '==', '!=', '>=', '<=', '>', '<', '===', '!==',
                'NL', 'DEDENT', 'EOF'])
    })
})
