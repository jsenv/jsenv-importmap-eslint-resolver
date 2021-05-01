import { createRequire } from "module"
import { urlToFileSystemPath, fileSystemPathToUrl } from "@jsenv/util"

export const applyCommonJsModuleResolution = (specifier, { importer }) => {
  const importerPath = urlToFileSystemPath(importer)
  const require = createRequire(importerPath)
  let specifierPath
  try {
    specifierPath = require.resolve(specifier)
  } catch (e) {
    if (e && e.code === "MODULE_NOT_FOUND") {
      return null
    }
    throw e
  }
  const specifierUrl = fileSystemPathToUrl(specifierPath)
  return specifierUrl
}
