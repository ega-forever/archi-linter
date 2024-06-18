// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/runners/archi/index.ts', // Entry point of your application
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true
        }
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: 'bundle.ajs',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: false
  }
};