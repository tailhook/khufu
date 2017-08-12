module.exports = {
    context: __dirname,
    entry: "./index",
    output: {
        path: __dirname + "/../../doc/_build/html/examples/errors",
        filename: "bundle.js"
    },
    module: {
        loaders: [{
            test: /\.khufu$/,
            loaders: ['babel-loader', '../../src/loader'],
            exclude: /node_modules/,
        }, {
            test: /\.js$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/,
        }],
    },
    resolve: {
        modules: ["/usr/lib/node_modules",
                  __dirname + "/../../khufu-runtime/lib",
                  __dirname + "/../../node_modules"],
    },
    resolveLoader: {
        modules: ["/usr/lib/node_modules",
                  __dirname + "/../../node_modules"],
    },
}
