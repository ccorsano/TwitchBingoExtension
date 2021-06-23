const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { config } = require('webpack');

module.exports = (_env, argv) => {
    const bundlePath = path.resolve(__dirname, "dist/");
    const mode = _env.WEBPACK_SERVE ? 'development' : 'production';

    console.log("Mode = " + mode);

    let plugins = [
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
        new ForkTsCheckerWebpackPlugin(),
    ];

    let entryPoints = {
        VideoOverlay:{
            path:"./src/VideoOverlay.tsx",
            outputHtml: "video_overlay.html",
        },
        Config:{
            path:"./src/Config.tsx",
            outputHtml: "config.html",
        },
        LiveConfig:{
            path:"./src/LiveConfig.tsx",
            outputHtml: "live_config.html",
        },
        Mobile:{
            path:"./src/Mobile.tsx",
            outputHtml: "mobile.html",
        }
    };

    let entry = {};

    for (const entryName in entryPoints) {
        entry[entryName] = entryPoints[entryName].path
        // if (mode === 'production'){
            plugins.push(new HtmlWebpackPlugin({
                inject:true,
                chunks:[entryName],
                template:'./template.html',
                filename:entryPoints[entryName].outputHtml,
                minify: false,
            }));
        // }
    }

    let config = {
        entry: entry,
        mode: mode,
        optimization: {
            minimize: true,
        },
        devtool: 'source-map',
        module:{
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_module/,
                },
                {
                    test: /\.(png|jpe?g|svg|webp)$/i,
                    use: 'file-loader',
                    exclude: /node_module/,
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options:{
                                publicPath: '/dist',
                            },
                        },
                        'css-loader'
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options:{
                                publicPath: '/dist',
                            },
                        },
                        // "style-loader",
                        "css-loader",
                        {
                            loader: "sass-loader",
                            options: {
                              implementation: require("sass"),
                              sourceMap: true,
                            },
                        }
                    ]
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.css', '.scss']
        },
        output: {
            filename: '[name].bundle.js',
            path: bundlePath,
        },
        plugins: plugins
    }

    if (mode === 'development'){
        config.devServer = {
            contentBase: path.join(__dirname, 'public'),
            host: argv.devrig ? 'localhost.rig.twitch.tv' : 'localhost',
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            port: 8180,
            https: true,
            hot: true,
        }
        config.watchOptions = {
            aggregateTimeout: 1000
        };
        config.cache = {
            type: 'filesystem'
        };
        plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    if (mode === 'production'){
        config.optimization.splitChunks = {
            name:false,
            cacheGroups:{
                default:false,
                vendors:false,
                vendor:{
                    chunks: 'all',
                    test: /node_module/,
                    name: false
                }
            }
        }
    }

    return config;
}