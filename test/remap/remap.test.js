import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFilePath } from "../../src/internal/urlUtils.js"
import * as resolver from "../../index.js"

const projectDirectoryUrl = import.meta.resolve("./")
const file = urlToFilePath(resolveUrl("./src/babelTest.js", projectDirectoryUrl))

{
  const actual = resolver.resolve("@babel/plugin-proposal-object-rest-spread", file, {
    projectDirectoryUrl,
  })
  const expected = {
    found: false,
    path: urlToFilePath(
      resolveUrl(
        "./node_modules/@babel/plugin-proposal-object-rest-spread/lib/index.js",
        projectDirectoryUrl,
      ),
    ),
  }
  assert({ actual, expected })
}
