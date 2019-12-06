const { createConfig } = require("@jsenv/eslint-config")

const config = createConfig({
  projectDirectoryPath: __dirname,
  importResolutionMethod: "import-map",
  // importResolverFilePath: `${__dirname}/dist/commonjs/main.js`
  // importResolverOptions: { logLevel: 'debug', node: true }
})

// config.settings["import/resolver"] = {
//   [`${__dirname}/dist/commonjs/main.js`]: {
//     projectDirectoryPath: __dirname,
//     logLevel: "info",
//     node: true,
//   },
// }

module.exports = config
