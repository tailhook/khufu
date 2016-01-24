import {compile_text as compile} from '../src/compiler.js'
import {expect} from 'chai'

describe("compiler", () => {
    const imp = 'import ' +
        '{ elementVoid, elementOpen, elementClose, text, item }' +
        ' from "khufu-runtime";\n';
    it("compiles function call", () => {
        expect(compile('import {x} from "y"\n' +
            "view main():\n x(1)"))
            .to.equal(imp +
                'import { x } from "y";\n' +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    item(x(1), key + "-1");\n' +
                '  };\n' +
                "}")
    })
    it("compiles function call with multiple args", () => {
        expect(compile('import {x} from "y"\n' +
            "view main():\n x(1, 2, 3)"))
            .to.equal(imp +
                'import { x } from "y";\n' +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    item(x(1, 2, 3), key + "-1");\n' +
                '  };\n' +
                "}")
    })
    it("compiles a list", () => {
        expect(compile("view main():\n [1, 2, 3]"))
            .to.equal(imp +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    text([1, 2, 3]);\n' +
                '  };\n' +
                "}")
    })
    it("compiles math", () => {
        expect(compile("view main():\n (1+2*3)/4"))
            .to.equal(imp +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    text((1 + 2 * 3) / 4);\n' +
                '  };\n' +
                "}")
    })
    it("compiles global names", () => {
        expect(compile('import {x} from "y"\n' +
            "view main():\n x(true, false, null)"))
            .to.equal(imp +
                'import { x } from "y";\n' +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    item(x(true, false, null), key + "-1");\n' +
                '  };\n' +
                "}")
    })
    it("compiles boolean", () => {
        expect(compile(
            "view main():\n 1 and 2\n 3 or 4\n not 0\n 1 and 2 or 3"))
            .to.equal(imp +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    text(1 && 2);\n' +
                '    text(3 || 4);\n' +
                '    text(!0);\n' +
                '    text(1 && 2 || 3);\n' +
                '  };\n' +
                "}")
    })

    it("compiles ternary", () => {
        expect(compile(
            "view main():\n 1 and 2 ? 3 : 4"))
            .to.equal(imp +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    text(1 && 2 ? 3 : 4);\n' +
                '  };\n' +
                "}")
    })

    it("compiles object expression", () => {
        expect(compile(
            "view main():\n {key1: 2+2, 'key2': 3*3}"))
            .to.equal(imp +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    text({\n' +
                '      key1: 2 + 2,\n' +
                '      key2: 3 * 3\n' +
                '    });\n' +
                '  };\n' +
                "}")
    })
    it("compiles raw store", () => {
        expect(compile('import {a, b, x} from "y"\n' +
            "view main():\n <p>\n  store @x = a(b)\n  x(@x, ->@x)"))
            .to.equal(imp +
                'import { a, b, x } from "y";\n' +
                "export function main() {\n" +
                '  return function main(key) {\n' +
                '    let _p_stores = elementOpen("p", key + "-1-p", ' +
                                                'null, "__stores", {\n' +
                '      x: function (state) {\n' +
                '        return a(b, state);\n' +
                '      }\n' +
                '    }).__stores;\n' +
                '\n' +
                '    {\n' +
                '      let _x_state = _p_stores.x.getState();\n' +
                '\n' +
                '      item(x(_x_state, _p_stores.x), "-1");\n' +
                '    }\n' +
                '    elementClose("p");\n' +
                '  };\n' +
                "}")
    })
})
