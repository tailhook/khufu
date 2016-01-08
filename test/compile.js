import {compile_text as compile} from '../src/compiler.js'
import {expect} from 'chai'

describe("compiler", () => {
    it("compiles empty function", () => {
        expect(compile("view main():"))
            .to.equal("export function main() {}")
    })
    it("compiles private function", () => {
        expect(compile("view _main():"))
            .to.equal("function _main() {}")
    })
})
