import {compile_text as compile} from '../src/compiler.js'
import {expect} from 'chai'

describe("compiler", () => {
    const imp = 'import ' +
        '{ elementVoid, elementOpen, elementClose, '
        + 'text, item, SuppressedError }' +
        ' from "khufu-runtime";\n';
    it("compiles empty function", () => {
        expect(compile("view main():"))
            .to.equal(imp + "export function main() {\n" +
                "  return function main$(key) {};\n" +
                "}")
    })
    it("compiles private function", () => {
        expect(compile("view _main():"))
            .to.equal(imp + "\nfunction _main() {\n" +
            "  return function _main$(key) {};\n" +
            "}")
    })
    it("compiles exported dict with functions", () => {
        expect(compile("view x.y():"))
            .to.equal(
            "let _x = {};\n" +
            imp +
            "export { _x as x };\n" +
            "\nx.y = function x_y() {\n" +
            "  return function x_y$(key) {};\n" +
            "};")
    })
    it("compiles unexported dict with functions", () => {
        expect(compile("view _x.y():"))
            .to.equal(
            "let _x = {};\n" +
            imp +
            "\n_x.y = function _x_y() {\n" +
            "  return function _x_y$(key) {};\n" +
            "};")
    })
    it("compiles an element", () => {
        expect(compile("view main():\n <p>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p");\n  };\n}')
    })
    it("compiles static attributes", () => {
        expect(compile("view main():\n <p a='b'>"))
            .to.equal(
                'let _P_ATTRS = ["a", "b"];\n' +
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p", _P_ATTRS);\n' +
                '  };\n}')
    })
    it("compiles dynamic attributes", () => {
        expect(compile("view main():\n let x = 'b'\n <p a=x>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    let _x = "b";\n' +
                '    elementVoid("p", key + "-1-p", null, "a", _x);\n' +
                '  };\n' +
                '}')
    })
    it("compiles all dynamic attributes", () => {
        expect(compile("view main():\n <p a='b' c>", {static_attrs: false}))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p", null, ' +
                                '"a", "b", "c", "c");\n' +
                '  };\n' +
                '}')
    })
    it("compiles element with class", () => {
        expect(compile("view main():\n <p.hello>"))
            .to.equal(
                'let _P_ATTRS = ["class", "hello"];\n' +
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p", _P_ATTRS);\n  };\n}')
    })
    it("compiles element with two classes", () => {
        expect(compile("view main():\n <p.hello.world>"))
            .to.equal(
                'let _P_ATTRS = ["class", "hello world"];\n' +
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p", _P_ATTRS);\n  };\n}')
    })
    it("compiles element with optional class", () => {
        expect(compile("view main():\n <p.a.b.world?(0)>"))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p", null, ' +
                    '"class", "a b " + (0 ? "world" : ""));\n  };\n}')
    })
    it("compiles element with base class", () => {
        expect(compile("view main():\n <p.a.b.world?(0)>\n <a>",
            {'additional_class': 'base'}))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p", null, ' +
                    '"class", "base a b " + (0 ? "world" : ""));\n' +
                '    elementVoid("a", key + "-2-a");\n' +
                '  };\n' +
                '}')
    })
    it("compiles element with two classes (no static)", () => {
        expect(compile("view main():\n <p.hello.world>",
                       {static_attrs: false}))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p", null, ' +
                                '"class", "hello world");\n'+
                '  };\n' +
                '}')
    })
    it("compiles a nested elements", () => {
        expect(compile("view main():\n <p>\n  <a>\n   'text'\n <p>"))
            .to.equal(imp +
            'export function main() {\n' +
            '  return function main$(key) {\n' +
            '    elementOpen("p", key + "-1-p");\n' +
            '    elementOpen("a", "-1-a");\n' +
            '    text("text");\n' +
            '    elementClose("a");\n' +
            '    elementClose("p");\n' +
            '    elementVoid("p", key + "-2-p");\n' +
            '  };\n' +
            '}')
    })
    it("compiles let", () => {
        expect(compile("view main():\n" +
                       " let x = 1\n <p>\n  x\n" +
                       " let {y,z:a} = {}\n <p>\n  y + a\n" +
                       " let x = x + 1\n <p>\n  x\n"))
            .to.equal(imp +
            "export function main() {\n" +
            '  return function main$(key) {\n' +
            '    let _x = 1,\n' +
            '        {\n' +
            '      y: _y,\n' +
            '      z: _a\n' +
            '    } = {},\n' +
            '        _x2 = _x + 1;\n' +
            '\n' +
            '    elementOpen("p", key + "-1-p");\n' +
            '    text(_x);\n' +
            '    elementClose("p");\n' +
            '    elementOpen("p", key + "-2-p");\n' +
            '    text(_y + _a);\n' +
            '    elementClose("p");\n' +
            '    elementOpen("p", key + "-3-p");\n' +
            '    text(_x2);\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            "}")
    })
    it("compiles let with right scope", () => {
        expect(compile("view main():\n" +
                       " let x = 1\n <p>\n  let x = 2\n  x\n" +
                       " <p>\n  x\n"))
            .to.equal(imp +
            "export function main() {\n" +
            '  return function main$(key) {\n' +
            '    let _x = 1;\n' +
            '    elementOpen("p", key + "-1-p");\n' +
            '    {\n' +
            '      let _x2 = 2;\n' +
            '      text(_x2);\n' +
            '    }\n' +
            '    elementClose("p");\n' +
            '    elementOpen("p", key + "-2-p");\n' +
            '    text(_x);\n' +
            '    elementClose("p");\n' +
            '  };\n' +
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
            '  return function main$(key) {\n' +
            '    let _p_stores = elementOpen("p", key + "-1-p", null, ' +
                                            '"__stores", {\n' +
            '      x: function () {\n' +
            '        return [mystore, []];\n' +
            '      }\n' +
            '    }).__stores;\n' +
            '\n' +
            '    {\n' +
            '      let _x_state = _p_stores.x.getState();\n' +
            '\n' +
            '      text(_x_state.value);\n' +
            '    }\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            "}")
    })
    it("compiles a store with init", () => {
        expect(compile("import {mystore, init} from './stores'\n" +
                       "view main():\n" +
                       " <p>\n" +
                       "  store @x = mystore | init(1)\n" +
                       "  @x.value\n"))
        .to.equal(imp +
            'import { mystore, init } from "./stores";\n' +
            "export function main() {\n" +
            '  return function main$(key) {\n' +
            '    let _p_stores = elementOpen("p", key + "-1-p", null, ' +
                                            '"__stores", {\n' +
            '      x: function () {\n' +
            '        return [mystore, [init(1)]];\n' +
            '      }\n' +
            '    }).__stores;\n' +
            '\n' +
            '    {\n' +
            '      let _x_state = _p_stores.x.getState();\n' +
            '\n' +
            '      text(_x_state.value);\n' +
            '    }\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            "}")
    })
    it("accesses a store as a variable", () => {
        expect(compile("import {mystore} from './stores'\n" +
                       "view main():\n" +
                       " <p>\n" +
                       "  store @x = mystore\n" +
                       "  x.getState().value\n"))
        .to.equal(imp +
            'import { mystore } from "./stores";\n' +
            "export function main() {\n" +
            '  return function main$(key) {\n' +
            '    let _p_stores = elementOpen("p", key + "-1-p", null, ' +
                                            '"__stores", {\n' +
            '      x: function () {\n' +
            '        return [mystore, []];\n' +
            '      }\n' +
            '    }).__stores;\n' +
            '\n' +
            '    text(_p_stores.x.getState().value);\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            "}")
    })
    it("compiles a link", () => {
        expect(compile(
            "import {mystore, action} from './stores'\n" +
            "view main():\n" +
            " <p>\n" +
            "  store @x = mystore\n" +
            "  @x.value\n" +
            "  <button>\n" +
            "    link {click} action(1) -> @x\n"
            ))
        .to.equal(imp +
            'import { mystore, action } from "./stores";\n' +
            "export function main() {\n" +
            '  return function main$(key) {\n' +
            '    let _p_stores = elementOpen("p", key + "-1-p", null, ' +
                                            '"__stores", {\n' +
            '      x: function () {\n' +
            '        return [mystore, []];\n' +
            '      }\n' +
            '    }).__stores;\n' +
            '\n' +
            '    {\n' +
            '      let _x_state = _p_stores.x.getState();\n' +
            '\n' +
            '      text(_x_state.value);\n' +
            '\n' +
            '      function _ln_click(event) {\n' +
            '        _p_stores.x.dispatch(action(1))\n' +
            '      }\n' +
            '\n' +
            '      elementVoid("button", "-2-button", null,' +
                              ' "onclick", _ln_click);\n' +
            '    }\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            "}")
    })
    it("two links", () => {
        expect(compile(
            "import {action} from './stores'\n" +
            "view main(@x):\n" +
            "  <button>\n" +
            "    link {click, touch} action(1) -> @x\n" +
            "    link {hover, click} action(2) -> @x\n"
            ))
        .to.equal(imp +
            'import { action } from "./stores";\n' +
            "export function main(_x) {\n" +
            '  return function main$(key) {\n' +
            '    function _ln_touch(event) {\n' +
            '      _x.dispatch(action(1))\n' +
            '    }\n' +
            '\n' +
            '    function _ln_hover(event) {\n' +
            '      _x.dispatch(action(2))\n' +
            '    }\n' +
            '\n' +
            '    function _ln_click(event) {\n' +
            '      _x.dispatch(action(1))\n' +
            '\n' +
            '      _x.dispatch(action(2))\n' +
            '    }\n' +
            '\n' +
            '    elementVoid("button", key + "-1-button", null,' +
                              ' "ontouch", _ln_touch,' +
                              ' "onhover", _ln_hover,' +
                              ' "onclick", _ln_click);\n' +
            '  };\n' +
            "}")
    })
    it("compiles a link with store in single element", () => {
        expect(compile(
            "import {mystore, action} from './stores'\n" +
            "view main():\n" +
            " <p>\n" +
            "  store @x = mystore\n" +
            "  link {click} action(1) -> @x\n"
            ))
        .to.equal(imp +
            'import { mystore, action } from "./stores";\n' +
            "export function main() {\n" +
            '  return function main$(key) {\n' +
            '    function _ln_click(event) {\n' +
            '      _p_stores.x.dispatch(action(1))\n' +
            '    }\n' +
            '\n' +
            '    let _p_stores = elementOpen("p", key + "-1-p", null, ' +
                                            '"__stores", {\n' +
            '      x: function () {\n' +
            '        return [mystore, []];\n' +
            '      }\n' +
            '    }, "onclick", _ln_click).__stores;\n' +
            '\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            "}")
    })
    it("compiles an if statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p");\n' +
                '\n' +
                '    if (0) {\n' +
                '      elementVoid("a", key + "-2if0-1-a");\n' +
                '    }\n' +
                '  };\n' +
                '}')
    })
    it("compiles an if else statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>\n else:\n  <b>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p");\n' +
                '\n' +
                '    if (0) {\n' +
                '      elementVoid("a", key + "-2if0-1-a");\n' +
                '    } else {\n' +
                '      elementVoid("b", key + "-2els-1-b");\n' +
                '    }\n' +
                '  };\n' +
                '}')
    })
    it("compiles an elif statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>\n" +
                       ' elif 1:\n  <div>'))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p");\n' +
                '\n' +
                '    if (0) {\n' +
                '      elementVoid("a", key + "-2if0-1-a");\n' +
                '    } else if (1) {\n' +
                '      elementVoid("div", key + "-2if1-1-div");\n' +
                '    }\n' +
                '  };\n' +
                '}')
    })
    it("compiles an elif-let statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>\n" +
                       ' elif let a = 1:\n  <div>'))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    let _if_let_cond;\n' +
                '\n' +
                '    elementVoid("p", key + "-1-p");\n' +
                '\n' +
                '    if (0) {\n' +
                '      elementVoid("a", key + "-2if0-1-a");\n' +
                '    } else if (_if_let_cond = 1) {\n' +
                '      let _a = _if_let_cond;\n' +
                '      elementVoid("div", key + "-2if1-1-div");\n' +
                '    }\n' +
                '  };\n' +
                '}')
    })
    it("compiles an elif-else statement", () => {
        expect(compile("view main():\n <p>\n if 0:\n  <a>\n" +
                       ' elif 1:\n  <div>\n else:\n  <b>'))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p");\n' +
                '\n' +
                '    if (0) {\n' +
                '      elementVoid("a", key + "-2if0-1-a");\n' +
                '    } else if (1) {\n' +
                '      elementVoid("div", key + "-2if1-1-div");\n' +
                '    } else {\n' +
                '      elementVoid("b", key + "-2els-1-b");\n' +
                '    }\n' +
                '  };\n' +
                '}')
    })
    it("compiles an if-let statement", () => {
        expect(compile("view main():\n <p>\n if let x = 1:\n  <a>"))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    let _if_let_cond;\n' +
                '\n' +
                '    elementVoid("p", key + "-1-p");\n' +
                '\n' +
                '    if (_if_let_cond = 1) {\n' +
                '      let _x = _if_let_cond;\n' +
                '      elementVoid("a", key + "-2if0-1-a");\n' +
                '    }\n' +
                '  };\n' +
                '}')
    })
    it("compiles a loop", () => {
        expect(compile("view main():\n <ul>\n  for a of []:\n   <li>\n    a"))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementOpen("ul", key + "-1-ul");\n' +
                '\n' +
                '    for (let _a of []) {\n' +
                // TODO(tailhook) probably better serialization could be done
                '      elementOpen("li", "-1" + _a + "-1-li");\n' +
                '      text(_a);\n' +
                '      elementClose("li");\n' +
                '    }\n' +
                '\n' +
                '    elementClose("ul");\n' +
                '  };\n' +
                '}')
    })
    it("compiles a nested loop", () => {
        expect(compile("view main():\n <ul>\n"
            + "  for a of []:\n"
            + "    for b of a:\n"
            + "      <li>\n"
            + "        b"))
            .to.equal(imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    elementOpen("ul", key + "-1-ul");\n' +
                '\n' +
                '    for (let _a of []) {\n' +
                '      for (let _b of _a) {\n' +
                '        elementOpen("li", "-1" + _a + "-1" + _b + "-1-li");\n'
                +
                '        text(_b);\n' +
                '        elementClose("li");\n' +
                '      }\n' +
                '    }\n' +
                '\n' +
                '    elementClose("ul");\n' +
                '  };\n' +
                '}')
    })

    it("compiles a loop over a pair", () => {
        expect(() => compile(
            "view main():\n <ul>\n  for [a,b] of []:\n   <li>\n    a"))
            .to.throw(/Parse error[\s\S]*Expecting.*'key'.*got ':'/)
    })

    it("compiles multiple view functions", () => {
        expect(compile(
            "view _other(txt):\n txt\n" +
            "view main(x):\n _other(x)"))
        .to.equal(imp +
            '\n' +
            'function _other(_txt) {\n' +
            '  return function _other$(key) {\n' +
            '    text(_txt);\n' +
            '  };\n' +
            '}\n' +
            '\n' +
            'export function main(_x) {\n' +
            '  return function main$(key) {\n' +
            '    item(_other(_x), key + "-1");\n' +
            '  };\n}')
    })
    it("compiles multiple view functions in reverse order", () => {
        expect(compile(
            "view main(x):\n _other(x)\n" +
            "view _other(txt):\n txt"))
        .to.equal(imp +
            'export function main(_x) {\n' +
            '  return function main$(key) {\n' +
            '    item(_other(_x), key + "-1");\n' +
            '  };\n' +
            '}\n' +
            '\n' +
            'function _other(_txt) {\n' +
            '  return function _other$(key) {\n' +
            '    text(_txt);\n' +
            '  };\n' +
            '}')
    })
    it("compiles an import", () => {
        expect(compile("import {a} from 'module'"))
        .to.equal('import { a } from "module";')
    })
    it("compiles an aliased import", () => {
        expect(compile("import {a as b, c} from 'module'\n"))
        .to.equal('import { a as b, c } from "module";')
    })
    it("compiles an import default", () => {
        expect(compile("import mod from 'module'"))
        .to.equal('import mod from "module";')
    })
    it("compiles an import module", () => {
        expect(compile("import * as mod from 'module'\n"))
        .to.equal('import * as mod from "module";')
    })
    it("compiles template attribute", () => {
        expect(compile("view main():\n let x=1\n <p a=`a${x}b${x+1}`>"))
            .to.equal(
                imp +
                'export function main() {\n' +
                '  return function main$(key) {\n' +
                '    let _x = 1;\n' +
                '    elementVoid("p", key + "-1-p", null, "a",' +
                              ' `a${_x}b${_x + 1}`);\n' +
                '  };\n}')
    })
    it("compiles text inline", () => {
        expect(compile("view main():\n <p>'text'\n"))
            .to.equal(imp +
            'export function main() {\n' +
            '  return function main$(key) {\n' +
            '    elementOpen("p", key + "-1-p");\n' +
            '    text("text");\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            '}')
    })
    it("compiles inline ES6 template", () => {
        expect(compile("view main(x):\n <p>`text: ${x}`\n"))
            .to.equal(imp +
            'export function main(_x) {\n' +
            '  return function main$(key) {\n' +
            '    elementOpen("p", key + "-1-p");\n' +
            '    text(`text: ${_x}`);\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            '}')
    })
    it("compiles custom template", () => {
        expect(compile("import {gql} from 'graphql-tag'\n" +
                       "view main(x):\n let x = gql`query { field }`\n"))
            .to.equal(imp +
            'import { gql } from "graphql-tag";\n' +
            'export function main(_x) {\n' +
            '  return function main$(key) {\n' +
            '    let _x2 = gql`query { field }`;\n' +
            '  };\n' +
            '}')
    })
    it("compiles inline attr access", () => {
        expect(compile("view main(x):\n <p> x.a\n"))
            .to.equal(imp +
            'export function main(_x) {\n' +
            '  return function main$(key) {\n' +
            '    elementOpen("p", key + "-1-p");\n' +
            '    text(_x.a);\n' +
            '    elementClose("p");\n' +
            '  };\n' +
            '}')
    })
    it("compiles simple call with body", () => {
        expect(compile("view wrap(x){body}:\n <p>\n x()\n  body()"))
            .to.equal(imp +
            'export function wrap(_x) {\n' +
            '  return function wrap$(key, {\n' +
            '    body: body\n' +
            '  }) {\n' +
            '    elementVoid("p", key + "-1-p");\n' +
            '\n' +
            '    _x()(key + "-2", {\n' +
            '      body: function () {\n' +
            '        return function (key) {\n' +
            '          item(body(), key + "-1");\n' +
            '        };\n' +
            '      }\n' +
            '    });\n' +
            '  };\n' +
            '}')
    })
    it("compiles simple call with kwargs", () => {
        expect(compile("view wrap(x):\n <p>\n x():\n  y:\n   'y'\n  z: 'z'"))
            .to.equal(imp +
            'export function wrap(_x) {\n' +
            '  return function wrap$(key) {\n' +
            '    elementVoid("p", key + "-1-p");\n' +
            '\n' +
            '    _x()(key + "-2", {\n' +
            '      y: function () {\n' +
            '        return function (key) {\n' +
            '          text("y");\n' +
            '        };\n' +
            '      },\n' +
            '      z: function () {\n' +
            '        return function (key) {\n' +
            '          text("z");\n' +
            '        };\n' +
            '      }\n' +
            '    });\n' +
            '  };\n' +
            '}')
    })
    it("compiles array unpacking", () => {
        expect(compile("view main([a, b]):"))
            .to.equal(imp + "export function main([_a, _b]) {\n" +
                "  return function main$(key) {};\n" +
                "}")
    })
    it("compiles an catch statement", () => {
        expect(compile("view main(@a):\n <p>\n catch * error -> @a:\n  <a>"))
            .to.equal(imp +
                'export function main(_a) {\n' +
                '  return function main$(key) {\n' +
                '    elementVoid("p", key + "-1-p");\n' +
                '\n' +
                '    try {\n' +
                '      elementVoid("a", key + "-2catch-1-a");\n' +
                '    } catch (_error) {\n' +
                '      if (!(_error instanceof SuppressedError)) {\n' +
                '        _a.dispatch(_error)\n' +
                '\n' +
                '        throw new SuppressedError(_error);\n' +
                '      }\n' +
                '\n' +
                '      throw _error;\n' +
                '    }\n' +
                '  };\n' +
                '}')
    })
    it("compiles an import that clash builtin", () => {
        expect(compile("import {text} from './anywhere'\n" +
                       "view main():\n" +
                       " text()\n"))
        .to.equal(imp +
            'import { text as _text } from "./anywhere";\n' +
            "export function main() {\n" +
            '  return function main$(key) {\n' +
            '    item(_text(), key + "-1");\n' +
            '  };\n' +
            "}")
    })
    it("compiles object literal with just names", () => {
        expect(compile("view main(a, b):\n let x={a, b}"))
            .to.equal(
                imp +
                'export function main(_a, _b) {\n' +
                '  return function main$(key) {\n' +
                '    let _x = {\n' +
                '      a: _a,\n' +
                '      b: _b\n' +
                '    };\n' +
                '  };\n}')
    })
})
