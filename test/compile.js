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
            .to.equal(imp +
                'export function main() {\n' +
                '  elementVoid("p", "0");\n}')
    })
    it("compiles static attributes", () => {
        expect(compile("view main():\n <p a='b'>"))
            .to.equal(
                'let _P_ATTRS = ["a", "b"];\n' +
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "0", _P_ATTRS);\n' +
                '}')
    })
    it("compiles dynamic attributes", () => {
        expect(compile("view main():\n let x = 'b'\n <p a=x>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  let _x = "b";\n' +
                '  elementVoid("p", "1", null, "a", _x);\n' +
                '}')
    })
    it("compiles a nested elements", () => {
        expect(compile("view main():\n <p>\n  <a>\n   'text'\n <p>"))
            .to.equal(imp +
            'export function main() {\n' +
            '  elementOpen("p", "0");\n' +
            '  elementOpen("a", "0");\n' +
            '  text("text");\n' +
            '  elementClose("a");\n' +
            '  elementClose("p");\n' +
            '  elementVoid("p", "1");\n' +
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
            '  elementOpen("p", "1");\n' +
            '  text(_x);\n' +
            '  elementClose("p");\n' +
            '  elementOpen("p", "3");\n' +
            '  text(_x2);\n' +
            '  elementClose("p");\n' +
            "}")
    })
    it("compiles let with right scope", () => {
        expect(compile("view main():\n" +
                       " let x = 1\n <p>\n  let x = 2\n  x\n" +
                       " <p>\n  x\n"))
            .to.equal(imp +
            "export function main() {\n" +
            '  let _x = 1;\n' +
            '  elementOpen("p", "1");\n' +
            '  {\n' +
            '    let _x2 = 2;\n' +
            '    text(_x2);\n' +
            '  }\n' +
            '  elementClose("p");\n' +
            '  elementOpen("p", "2");\n' +
            '  text(_x);\n' +
            '  elementClose("p");\n' +
            "}")
    })
    it("compiles a store", () => {
        expect(compile("import {mystore} from './stores'\n" +
                       "view main():\n" +
                       " <p>\n" +
                       "  store @x = mystore\n" +
                       "  @x.value\n"))
            .to.equal(imp +
            'import { mystore } from "./stores";\n' +
            "export function main() {\n" +
            '  let _p_stores = {};\n' +
            '  elementOpen("p", "0", null, "__stores", {\n' +
            '    x: mystore,\n' +
            '    ["@target"]: _p_stores\n' +
            '  });\n' +
            '  {\n' +
            '    let _x_state = _p_stores.x.getState();\n' +
            '\n' +
            '    text(_x_state.value);\n' +
            '  }\n' +
            '  elementClose("p");\n' +
            "}")
    })
})
