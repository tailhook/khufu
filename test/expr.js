import {compile_text as compile} from '../src/compiler.js'
import {expect} from 'chai'

describe("compiler", () => {
    const imp = 'import ' +
        '{ elementVoid, elementOpen, elementClose, text, expr }' +
        ' from "khufu-runtime";\n';
    it("compiles function call", () => {
        expect(compile('import {x} from "y"\n' +
            "view main():\n x(1)"))
            .to.equal(imp +
                'import { x } from "y";\n' +
                "export function main() {\n" +
                '  expr(x(1));\n' +
                "}")
    })
    it("compiles function call with multiple args", () => {
        expect(compile('import {x} from "y"\n' +
            "view main():\n x(1, 2, 3)"))
            .to.equal(imp +
                'import { x } from "y";\n' +
                "export function main() {\n" +
                '  expr(x(1, 2, 3));\n' +
                "}")
    })
    it("compiles a list", () => {
        expect(compile("view main():\n [1, 2, 3]"))
            .to.equal(imp +
                "export function main() {\n" +
                '  expr([1, 2, 3]);\n' +
                "}")
    })
    it("compiles math", () => {
        expect(compile("view main():\n (1+2*3)/4"))
            .to.equal(imp +
                "export function main() {\n" +
                '  expr((1 + 2 * 3) / 4);\n' +
                "}")
    })
})
