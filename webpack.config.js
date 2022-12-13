const path = require('path');

const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

const TerserPlugin = require("terser-webpack-plugin");

const tsConfigPath = path.join(__dirname, "tsconfig.json");


module.exports = {
  mode: "development",

  target: 'web',

  entry: {
    index: path.resolve(__dirname, './src', './index.ts')
  },

  module: {
    rules: [
      {
        test: /.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          configFile: tsConfigPath
        }
      },

      {
        test: /.mp3$/,
        loader: 'file-loader'
      }
    ]
  },

  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    globalObject: 'this',
    library: 'IosUi',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  resolve: {
    modules: ["node_modules"],
    
    extensions: [".ts", ".js"],

    plugins: [
      new TsconfigPathsPlugin({
        configFile: tsConfigPath
      })
    ]
  },

  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      include: /\.min\.js$/
    })],
  },
}