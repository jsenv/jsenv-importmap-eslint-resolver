import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFileSystemPath } from "@jsenv/util"
import * as resolver from "@jsenv/importmap-eslint-resolver"

const projectDirectoryUrl = resolveUrl("./root/", import.meta.url)
const mainFileUrl = resolveUrl("main.js", projectDirectoryUrl)

// #env not found by default
{
  const actual = resolver.resolve("#env", urlToFileSystemPath(mainFileUrl), {
    projectDirectoryUrl,
    node: true,
  })
  const expected = {
    found: false,
    path: null,
  }
  assert({ actual, expected })
}

// #env found when commonJsModuleResolution is enabled
{
  const envFileUrl = resolveUrl("env.cjs", projectDirectoryUrl)
  const actual = resolver.resolve("#env", urlToFileSystemPath(mainFileUrl), {
    projectDirectoryUrl,
    node: true,
    commonJsModuleResolution: true,
  })
  const expected = {
    found: true,
    path: urlToFileSystemPath(envFileUrl),
  }
  assert({ actual, expected })
}
