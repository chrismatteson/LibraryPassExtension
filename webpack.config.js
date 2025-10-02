const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup.ts',
    options: './src/options.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup.html', to: 'popup.html' },
        { from: 'src/options.html', to: 'options.html' },
        { from: 'src/content.css', to: 'content.css' },
        // Copy icons (will need to create these)
        {
          from: 'icons',
          to: 'icons',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  optimization: {
    minimize: false // Easier debugging; set to true for production
  }
};
