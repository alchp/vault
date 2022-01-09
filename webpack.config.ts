//webpack.config.js
import path from 'path'
import TerserPlugin from 'terser-webpack-plugin'

module.exports = {
  mode: 'production',
  target: 'node',
  entry: {
    main: './src/index.ts'
  },
  output: {
    path: path.resolve(__dirname),
    filename: 'index.js', // <--- Will be compiled to this single file
    library: {
      type: 'commonjs2'
    }
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
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
    ]
  }
}
