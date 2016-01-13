var webpack = require('webpack')
module.exports = {
    context: __dirname,
    entry: [
        "./index",
        "webpack-dev-server/client?http://localhost:8080",
        "webpack/hot/only-dev-server",
    ],
    output: {
        path: __dirname + "/public",
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
        modulesDirectories: ["/usr/local/lib/node_modules"],
    },
    resolveLoader: {
        modulesDirectories: ["/usr/local/lib/node_modules"],
    },
    devServer: {
        contentBase: '.',
        hot: true,
    },
    khufu: {
        static_attrs: false, // for normal hot reload
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
    ],
}

