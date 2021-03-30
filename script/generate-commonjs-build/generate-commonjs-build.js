import { buildProject, getBabelPluginMapForNode } from "@jsenv/core"
import * as jsenvConfig from "../../jsenv.config.js"

buildProject({
  ...jsenvConfig,
  format: "commonjs",
  babelPluginMap: getBabelPluginMapForNode(),
  buildDirectoryClean: true,
  externalImportUrlPatterns: {
    "node_modules/": true,
    // ensure this specific file is inlined
    // otherhwise a .js would be required when would throw
    // 'require() of ES modules is not supported'
    "node_modules/@jsenv/import-map/src/isSpecifierForNodeCoreModule.js": false,
  },
})
