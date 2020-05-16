/* eslint-disable global-require */
import merge from 'webpack-merge'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import Dotenv from 'dotenv-webpack'
import common, { commonCSSLoader, commonSassLoader, commonCSSModuleLoader } from './webpack.config.common'

const postCSSLoader = {
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    sourceMap: true,
    plugins: () => [require('autoprefixer')],
  },
}

export default merge(common, {
  devtool: 'cheap-module-eval-source-map', // more info:https://webpack.js.org/guides/development/#using-source-maps and https://webpack.js.org/configuration/devtool/
  entry: [
    // must be first entry to properly set public path
    './webpack-public-path',
    'react-hot-loader/patch',
    'webpack-hot-middleware/client?reload=true',
    path.resolve(__dirname, 'src/index.js'), // Defining path seems necessary for this to work consistently on Windows machines.
  ],
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'), // Note: Physical files are only output by the production build task `npm run build`.
    publicPath: '/',
    filename: 'bundle.js',
  },
  plugins: [
    new Dotenv({
      systemvars: true,
      path: './.env.dev',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      // Create HTML file that includes references to bundled CSS and JS.
      template: 'src/index.ejs',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
      inject: true,
      scriptLoading: 'defer',
      favicon: 'src/assets/favicon/favicon-32x32.png',
    }),
  ],
  module: {
    rules: [
      {
        test: /(\.css|\.scss|\.sass)$/,
        exclude: /\.module(\.css|\.scss|\.sass)$/,
        use: ['style-loader', commonCSSLoader, postCSSLoader, commonSassLoader],
      },
      {
        test: /\.module(\.css|\.scss|\.sass)$/,
        use: [
          'style-loader',
          commonCSSModuleLoader,
          postCSSLoader,
          commonSassLoader,
        ],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.eot(\?v=\d+.\d+.\d+)?$/,
        use: ['file-loader'],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/font-woff',
            },
          },
        ],
      },
      {
        test: /\.[ot]tf(\?v=\d+.\d+.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'application/octet-stream',
            },
          },
        ],
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              mimetype: 'image/svg+xml',
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|png|gif|ico)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
    ],
  },
})
