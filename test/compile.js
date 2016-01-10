import {compile_text as compile} from '../src/compiler.js'
import {expect} from 'chai'

describe("compiler", () => {
    const imp = 'import { elementVoid, elementOpen, elementClose, text } ' +
                'from "incremental-dom";\n';
    it("compiles empty function", () => {
        expect(compile("view main():"))
            .to.equal(imp + "export function main() {}")
    })
    it("compiles private function", () => {
        expect(compile("view _main():"))
            .to.equal(imp + "\nfunction _main() {}")
    })
    it("compiles an element", () => {
        expect(compile("view main():\n <p>"))
            .to.equal(imp + 'export function main() {\n  elementVoid("p");\n}')
    })
    it("compiles a nested elements", () => {
        expect(compile("view main():\n <p>\n  <a>\n   'text'\n <p>"))
            .to.equal(imp +
            'export function main() {\n' +
            '  elementOpen("p");\n' +
            '  elementOpen("a");\n' +
            '  text("text");\n' +
            '  elementClose("a");\n' +
            '  elementClose("p");\n' +
            '  elementVoid("p");\n' +
            '}')
    })
    it("compiles let", () => {
        expect(compile("view main():\n" +
                       " let x = 1\n <p>\n  x\n" +
                       " let x = x + 1\n <p>\n  x\n"))
            .to.equal(imp +
            "export function main() {\n" +
            '  let _x = 1,\n' +
            '      _x2 = _x + 1;\n' +
            '\n' +
            '  elementOpen("p");\n' +
            '  text(_x);\n' +
            '  elementClose("p");\n' +
            '  elementOpen("p");\n' +
            '  text(_x2);\n' +
            '  elementClose("p");\n' +
            "}")
    })
})
