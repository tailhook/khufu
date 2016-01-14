var webpack = require('webpack')
var DEV = process.env['NODE_ENV'] != 'production';
module.exports = {
    context: __dirname,
    entry: DEV ? [
        "./index",
        "webpack-dev-server/client?http://localhost:8080",
        "webpack/hot/only-dev-server",
    ] : "./index",
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
        modulesDirectories: ["/usr/local/lib/node_modules", "../.."],
    },
    resolveLoader: {
        modulesDirectories: ["/usr/local/lib/node_modules"],
    },
    devServer: {
        contentBase: '.',
        hot: true,
    },
    khufu: {
        static_attrs: !DEV,
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
    ],
}

