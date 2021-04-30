import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFileSystemPath } from "@jsenv/util"
import * as resolver from "@jsenv/importmap-eslint-resolver"

const projectDirectoryUrl = resolveUrl("./root/", import.meta.url)
const mainFileUrl = resolveUrl("main.js", projectDirectoryUrl)

// not found when disableNodeModuleResolution enabled
{
  const actual = resolver.resolve("file", urlToFileSystemPath(mainFileUrl), {
    projectDirectoryUrl,
    node: true,
    disableNodeModuleResolution: true,
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}

// still not found otherwise, needs --experimental-specifier-resolution=node
// as documented in
// https://nodejs.org/docs/latest-v15.x/api/esm.html#esm_customizing_esm_specifier_resolution_algorithm
{
  const actual = resolver.resolve("file", urlToFileSystemPath(mainFileUrl), {
    projectDirectoryUrl,
    node: true,
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}
