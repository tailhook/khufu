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
            loaders: ['babel-loader', '../../src/loader'],
            exclude: /node_modules/,
        }, {
            test: /\.js$/,
            loaders: [],
            exclude: /node_modules/,
        }],
    },
    resolve: {
        modules: ["/usr/lib/node_modules", "node_modules",
                  __dirname + "/../../khufu-runtime/lib",
                  __dirname + "/../../node_modules"],
    },
    resolveLoader: {
        modules: ["/usr/lib/node_modules"],
    },
    devServer: {
        contentBase: '.',
        hot: true,
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.LoaderOptionsPlugin({
            options: {
                khufu: {
                    static_attrs: !DEV,
                },
            },
        }),
    ],
}

