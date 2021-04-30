import { resolveImport } from "@jsenv/import-map"
import { readImportMapFromFile } from "./readImportMapFromFile.js"

export const applyImportMapResolution = (
  specifier,
  { importer, logger, projectDirectoryUrl, importMapFileRelativeUrl, defaultExtension },
) => {
  const importMap = readImportMapFromFile({
    projectDirectoryUrl,
    importMapFileRelativeUrl,
  })

  try {
    return resolveImport({
      specifier,
      importer,
      importMap,
      defaultExtension,
    })
  } catch (e) {
    if (e.message.includes("bare specifier")) {
      // this is an expected error and the file cannot be found
      logger.debug("unmapped bare specifier")
      return null
    }
    // this is an unexpected error
    throw e
  }
}
