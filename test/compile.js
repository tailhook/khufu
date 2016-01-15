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
                '  elementVoid("p", "p-1");\n}')
    })
    it("compiles static attributes", () => {
        expect(compile("view main():\n <p a='b'>"))
            .to.equal(
                'let _P_ATTRS = ["a", "b"];\n' +
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1", _P_ATTRS);\n' +
                '}')
    })
    it("compiles dynamic attributes", () => {
        expect(compile("view main():\n let x = 'b'\n <p a=x>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  let _x = "b";\n' +
                '  elementVoid("p", "p-1", null, "a", _x);\n' +
                '}')
    })
    it("compiles all dynamic attributes", () => {
        expect(compile("view main():\n <p a='b' c>", {static_attrs: false}))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1", null, "a", "b", "c", "c");\n' +
                '}')
    })
    it("compiles element with class", () => {
        expect(compile("view main():\n <p.hello>"))
            .to.equal(
                'let _P_ATTRS = ["class", "hello"];\n' +
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1", _P_ATTRS);\n}')
    })
    it("compiles element with two classes", () => {
        expect(compile("view main():\n <p.hello.world>"))
            .to.equal(
                'let _P_ATTRS = ["class", "hello world"];\n' +
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1", _P_ATTRS);\n}')
    })
    it("compiles element with optional class", () => {
        expect(compile("view main():\n <p.a.b.world?(0)>"))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1", null, ' +
                    '"class", "a b " + (0 ? "world" : ""));\n}')
    })
    it("compiles element with base class", () => {
        expect(compile("view main():\n <p.a.b.world?(0)>\n <a>",
            {'additional_class': 'base'}))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1", null, ' +
                    '"class", "base a b " + (0 ? "world" : ""));\n' +
                '  elementVoid("a", "a-2");\n' +
                '}')
    })
    it("compiles element with two classes (no static)", () => {
        expect(compile("view main():\n <p.hello.world>",
                       {static_attrs: false}))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1", null, "class", "hello world");\n}')
    })
    it("compiles a nested elements", () => {
        expect(compile("view main():\n <p>\n  <a>\n   'text'\n <p>"))
            .to.equal(imp +
            'export function main() {\n' +
            '  elementOpen("p", "p-1");\n' +
            '  elementOpen("a", "a-1");\n' +
            '  text("text");\n' +
            '  elementClose("a");\n' +
            '  elementClose("p");\n' +
            '  elementVoid("p", "p-2");\n' +
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
            '  elementOpen("p", "p-1");\n' +
            '  text(_x);\n' +
            '  elementClose("p");\n' +
            '  elementOpen("p", "p-2");\n' +
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
            '  elementOpen("p", "p-1");\n' +
            '  {\n' +
            '    let _x2 = 2;\n' +
            '    text(_x2);\n' +
            '  }\n' +
            '  elementClose("p");\n' +
            '  elementOpen("p", "p-2");\n' +
            '  text(_x);\n' +
            '  elementClose("p");\n' +
            "}")
    })
    it("compiles a store", () => {
        expect(compile("import {createStore, mystore} from './stores'\n" +
                       "view main():\n" +
                       " <p>\n" +
                       "  store @x = createStore(mystore)\n" +
                       "  @x.value\n"))
        .to.equal(imp +
            'import { createStore, mystore } from "./stores";\n' +
            "export function main() {\n" +
            '  let _p_stores = {};\n' +
            '  elementOpen("p", "p-1", null, "__stores", {\n' +
            '    x: function (state) {\n' +
            '      return createStore(mystore, state);\n' +
            '    },\n' +
            '    __target: _p_stores\n' +
            '  });\n' +
            '  {\n' +
            '    let _x_state = _p_stores.x.getState();\n' +
            '\n' +
            '    text(_x_state.value);\n' +
            '  }\n' +
            '  elementClose("p");\n' +
            "}")
    })
    it("compiles a link", () => {
        expect(compile(
            "import {createStore, mystore, action} from './stores'\n" +
            "view main():\n" +
            " <p>\n" +
            "  store @x = createStore(mystore)\n" +
            "  @x.value\n" +
            "  <button>\n" +
            "    link {click} action(1) -> @x\n"
            ))
        .to.equal(imp +
            'import { createStore, mystore, action } from "./stores";\n' +
            "export function main() {\n" +
            '  let _p_stores = {};\n' +
            '  elementOpen("p", "p-1", null, "__stores", {\n' +
            '    x: function (state) {\n' +
            '      return createStore(mystore, state);\n' +
            '    },\n' +
            '    __target: _p_stores\n' +
            '  });\n' +
            '  {\n' +
            '    let _x_state = _p_stores.x.getState();\n' +
            '\n' +
            '    text(_x_state.value);\n' +
            '\n' +
            '    function _ln_click(event) {\n' +
            '      _p_stores.x.dispatch(action(1))\n' +
            '    }\n' +
            '\n' +
            '    elementVoid("button", "button-1", null,' +
                            ' "onclick", _ln_click);\n' +
            '  }\n' +
            '  elementClose("p");\n' +
            "}")
    })
    it("compiles an if statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1");\n' +
                '\n' +
                '  if (0) {\n' +
                '    elementVoid("a", "a-2if0-1");\n' +
                '  }\n' +
                '}')
    })
    it("compiles an if else statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>\n else:\n  <b>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1");\n' +
                '\n' +
                '  if (0) {\n' +
                '    elementVoid("a", "a-2if0-1");\n' +
                '  } else {\n' +
                '    elementVoid("b", "b-2els-1");\n' +
                '  }\n' +
                '}')
    })
    it("compiles an elif statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>\n" +
                       ' elif 1:\n  <div>'))
            .to.equal(imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1");\n' +
                '\n' +
                '  if (0) {\n' +
                '    elementVoid("a", "a-2if0-1");\n' +
                '  } else if (1) {\n' +
                '    elementVoid("div", "div-2if1-1");\n' +
                '  }\n' +
                '}')
    })
    it("compiles an elif-else statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>\n" +
                       ' elif 1:\n  <div>\n else:\n  <b>'))
            .to.equal(imp +
                'export function main() {\n' +
                '  elementVoid("p", "p-1");\n' +
                '\n' +
                '  if (0) {\n' +
                '    elementVoid("a", "a-2if0-1");\n' +
                '  } else if (1) {\n' +
                '    elementVoid("div", "div-2if1-1");\n' +
                '  } else {\n' +
                '    elementVoid("b", "b-2els-1");\n' +
                '  }\n' +
                '}')
    })
    it("compiles a loop", () => {
        expect(compile("view main():\n <ul>\n  for a of []:\n   <li>\n    a"))
            .to.equal(imp +
                'export function main() {\n' +
                '  elementOpen("ul", "ul-1");\n' +
                '\n' +
                '  for (let _a of []) {\n' +
                // TODO(tailhook) probably better serialization could be done
                '    elementOpen("li", "li" + (_a + "-1"));\n' +
                '    text(_a);\n' +
                '    elementClose("li");\n' +
                '  }\n' +
                '\n' +
                '  elementClose("ul");\n' +
                '}')
    })

    it("compiles function with args", () => {
        expect(compile("view main(x, y):\n x\n y"))
            .to.equal(imp + "export function main(x, y) {\n" +
            '  text(x);\n' +
            '  text(y);\n' +
            "}")
    })
})
