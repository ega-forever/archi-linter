// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/runners/cli/index.ts', // Entry point of your application
  target: 'node',
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
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist_binaries'),
  },
  optimization: {
    minimize: false
  }
};