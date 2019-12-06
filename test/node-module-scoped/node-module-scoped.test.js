import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFilePath } from "../../src/internal/urlUtils.js"
import * as resolver from "../../index.js"

const testDirectoryUrl = import.meta.resolve("./")
const file = urlToFilePath(resolveUrl("./node_modules/use-scoped-foo/index.js", testDirectoryUrl))

{
  const actual = resolver.resolve("foo", file, {
    projectDirectoryUrl: testDirectoryUrl,
  })
  const expected = {
    found: false,
    path: urlToFilePath(
      resolveUrl("./node_modules/use-scoped-foo/node_modules/foo/index.js", testDirectoryUrl),
    ),
  }
  assert({ actual, expected })
}
