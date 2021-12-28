//webpack.config.js
const path = require('path')

module.exports = {
  mode: 'production',
  target: 'node',
  devtool: 'inline-source-map',
  entry: {
    main: './src/vault.ts'
  },
  output: {
    path: path.resolve(__dirname),
    filename: './index.js' // <--- Will be compiled to this single file
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }
    ]
  }
}
