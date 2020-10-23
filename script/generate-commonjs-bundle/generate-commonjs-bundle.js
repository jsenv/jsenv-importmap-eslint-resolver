import { generateBundle, getBabelPluginMapForNode } from "@jsenv/core"
import * as jsenvConfig from "../../jsenv.config.js"

generateBundle({
  ...jsenvConfig,
  babelPluginMap: getBabelPluginMapForNode(),
  format: "commonjs",
  bundleDirectoryClean: true,
})
