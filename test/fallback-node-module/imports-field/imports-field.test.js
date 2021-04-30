import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFileSystemPath } from "@jsenv/util"
import * as resolver from "@jsenv/importmap-eslint-resolver"

const projectDirectoryUrl = resolveUrl("./root/", import.meta.url)
const mainFileUrl = resolveUrl("main.js", projectDirectoryUrl)

// #env not found when fallbackOnNodeModuleResolution is false
{
  const actual = resolver.resolve("#env", urlToFileSystemPath(mainFileUrl), {
    projectDirectoryUrl,
    node: true,
    fallbackOnNodeModuleResolution: false,
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}

// #env found when fallbackOnNodeModuleResolution is true
{
  const envFileUrl = resolveUrl("env.js", projectDirectoryUrl)
  const actual = resolver.resolve("#env", urlToFileSystemPath(mainFileUrl), {
    projectDirectoryUrl,
    node: true,
    fallbackOnNodeModuleResolution: true,
  })
  const expected = {
    found: true,
    path: urlToFileSystemPath(envFileUrl),
  }
  assert({ actual, expected })
}
