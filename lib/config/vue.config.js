const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')

const resolve = (p) => path.resolve(cwd, p)
const cwd = process.cwd()
const isProduction = process.env.NODE_ENV === 'production'
module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: resolve('./src/main.js'),
  output: {
    filename: '[name].[hash:8].js',
    path: resolve('dist')
  },
  resolve: {
    extensions: ['.js', '.jsx', '.vue', '.json'],
    alias: {
      '@': resolve('src')
    }
  },
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction
          }
        },
        extractComments: false
      }),
      new CssMinimizerPlugin()
    ]
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024
          }
        },
        generator: {
          filename: 'images/[name].[hahs:6].[ext]'
        }
      },
      {
        test: /\.(le|c)ss$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.vue$/,
        use: ['vue-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: resolve('./public/index.html'),
      title: 'Vue App'
    }),
    new CleanWebpackPlugin(),
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve('./src/assets'),
          to: resolve('./dist/assets')
        }
      ]
    }),
    new webpack.DefinePlugin({
      BASE_URL: JSON.stringify(process.env.BASE_URL || '/')
    })
  ]
}
