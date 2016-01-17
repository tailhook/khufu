module.exports = {
    context: __dirname,
    entry: [
        "babel-polyfill",
        "./index",
    ],
    output: {
        path: __dirname + "/../../doc/_build/html/examples/debounce",
        filename: "bundle.js"
    },
    module: {
        loaders: [{
            test: /\.khufu$/,
            loaders: ['babel', '../../src/loader'],
            exclude: /node_modules/,
        }, {
            test: /\.js$/,
            loaders: ['babel'],
            exclude: /node_modules/,
        }],
    },
    resolve: {
        modulesDirectories: ["/usr/local/lib/node_modules",
                             __dirname + "/../../khufu-runtime/lib",
                             __dirname + "/../../node_modules"],
    },
    resolveLoader: {
        modulesDirectories: ["/usr/local/lib/node_modules",
                             __dirname + "/../../node_modules"],
    },
}
