module.exports = {
    entry: "./src/index.js",
    output: {
        path: __dirname + 'public',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    }
};
