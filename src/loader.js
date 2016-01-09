require("babel-register")()
var compile_text = require("./compiler").compile_text;

module.exports = function(text) {
    this.cacheable();
    return compile_text(text);
}
