import { createRequire } from "module"
import { urlToFileSystemPath, fileSystemPathToUrl } from "@jsenv/util"

export const applyNodeModuleResolution = (specifier, { importer }) => {
  const importerPath = urlToFileSystemPath(importer)
  const require = createRequire(importerPath)
  const specifierPath = require.resolve(specifier)
  const specifierUrl = fileSystemPathToUrl(specifierPath)
  return specifierUrl
}
