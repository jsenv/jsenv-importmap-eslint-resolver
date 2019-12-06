import { assert } from "@jsenv/assert"
import { resolveUrl, urlToFilePath } from "../../src/internal/urlUtils.js"
import * as resolver from "../../index.js"

const projectDirectoryUrl = import.meta.resolve("./root/project/")
const abstractFile = urlToFilePath(resolveUrl("./abstractFile.js", projectDirectoryUrl))
const abstractFileInsideFolder = urlToFilePath(
  resolveUrl("./abstractFolder/abstractFile.js", projectDirectoryUrl),
)

{
  const actual = resolver.resolve("./project-file.js", abstractFile, {
    projectDirectoryUrl,
  })
  const expected = {
    found: true,
    path: urlToFilePath(resolveUrl(`./project-file.js`, projectDirectoryUrl)),
  }
  assert({ actual, expected })
}

{
  const actual = resolver.resolve("../project-file.js", abstractFileInsideFolder, {
    projectDirectoryUrl,
  })
  const expected = {
    found: true,
    path: urlToFilePath(resolveUrl(`./project-file.js`, projectDirectoryUrl)),
  }
  assert({ actual, expected })
}

{
  const actual = resolver.resolve("../root-file.js", abstractFile, {
    projectDirectoryUrl,
  })
  const expected = {
    found: true,
    path: urlToFilePath(resolveUrl(`./root/root-file.js`, projectDirectoryUrl)),
  }
  assert({ actual, expected })
}

{
  const actual = resolver.resolve("../root-file.js", abstractFile, {
    projectDirectoryUrl,
    insideProjectAssertion: true,
  })
  const expected = {
    found: false,
    path: urlToFilePath(resolveUrl(`./root/root-file.js`, projectDirectoryUrl)),
  }
  assert({ actual, expected })
}
