import { generateBundle } from "@jsenv/core"
import * as jsenvConfig from "../../jsenv.config.js"

generateBundle({
  ...jsenvConfig,
  format: "commonjs",
  bundleDirectoryClean: true,
})
