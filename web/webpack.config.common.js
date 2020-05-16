/* eslint-disable global-require */
import path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'

export default {
  resolve: {
    extensions: ['*', '.js', '.jsx', '.json'],
    // To support react-hot-loader
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
  },
  target: 'web',
  plugins: [new CopyWebpackPlugin([{ from: 'src/assets/favicon' }])],
}

export const commonCSSModuleLoader = {
  loader: 'css-loader',
  options: {
    sourceMap: true,
    modules: {
      localIdentName: '[local]__[hash:base64:5]',
    },
  },
}

export const commonCSSLoader = {
  loader: 'css-loader',
  options: {
    modules: false,
    sourceMap: true,
  },
}

export const commonSassLoader = {
  loader: 'sass-loader',
  options: {
    sassOptions: {
      includePaths: [path.resolve(__dirname, 'src')],
    },
  },
}
