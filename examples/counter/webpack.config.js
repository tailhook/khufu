module.exports = {
    context: __dirname,
    entry: "./index",
    output: {
        path: __dirname + "/../../doc/_build/html/examples/counter",
        filename: "bundle.js"
    },
    module: {
        loaders: [{
            test: /\.khufu$/,
            loaders: ['babel', '../../src/loader'],
        }, {
            test: /\.js$/,
            loaders: ['babel'],
        }],
    },
    resolve: {
        modulesDirectories: ["/usr/local/lib/node_modules"],
    },
    resolveLoader: {
        modulesDirectories: ["/usr/local/lib/node_modules"],
    },
}
