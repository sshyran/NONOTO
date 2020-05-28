let webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    plugins: [
        new webpack.DefinePlugin({
            'COMPILE_ELECTRON': true,
            'DISABLE_SERVER_INPUT': false,
            'SPECTROGRAM_ONLY': false,
            'DEFAULT_SERVER_IP': 'window.location.hostname',
            'DEFAULT_SERVER_PORT': 'window.location.port',
            'INSERT_RECAPTCCHA': false,
            'RECAPTCHA_SITEKEY': null,
            'RECAPTCHA_VERIFICATION_ADRESS': null
        }),

        new webpack.ProvidePlugin({
        // this allows to use JQuery plugin by calling `require('plugin-name')`
        // as it provides a global JQuery
        // TODO(theis, maybe): alternative method
        // http://reactkungfu.com/2015/10/integrating-jquery-chosen-with-webpack-using-imports-loader/
            $: 'jquery',
            jQuery: 'jquery'
        }),
    ],
  };
