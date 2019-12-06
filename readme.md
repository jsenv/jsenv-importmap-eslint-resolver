# jsenv-eslint-import-resolver

[![github package](https://img.shields.io/github/package-json/v/jsenv/jsenv-eslint-import-resolver.svg?logo=github&label=package)](https://github.com/jsenv/jsenv-eslint-import-resolver/packages)
[![npm package](https://img.shields.io/npm/v/@jsenv/eslint-import-resolver.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/eslint-import-resolver)
[![github ci](https://github.com/jsenv/jsenv-eslint-import-resolver/workflows/ci/badge.svg)](https://github.com/jsenv/jsenv-eslint-import-resolver/actions?workflow=ci)
[![codecov coverage](https://codecov.io/gh/jsenv/jsenv-eslint-import-resolver/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-eslint-import-resolver)

importMap resolution for eslint.

## Table of contents

- [Presentation](#Presentation)
- [Installation](#installation)
  - [Step 1 - Install eslint plugin import](#step-1---install-eslint-plugin-import-package)
  - [Step 2 - Install jsenv import resolver](#step-2---install-jsenv-import-resolver-package)
  - [Step 3 - Configure eslint](#step-3---configure-eslint)

## Presentation

`@jsenv/eslint-import-resolver` enables importMap resolution for eslint.

— see [importMap spec on github](https://github.com/WICG/import-maps)<br />

## Installation

Follow the steps below to install `@jsenv/eslint-import-resolver` in your project.

### Step 1 - Install eslint plugin import package

```console
npm install --save-dev eslint-plugin-import@2.18.2
```

— see [eslint-plugin-import on github](https://github.com/benmosher/eslint-plugin-import)

### Step 2 - Install jsenv import resolver package

If you never installed a jsenv package, read [Installing a jsenv package](https://github.com/jsenv/jsenv-core/blob/master/docs/installing-jsenv-package.md#installing-a-jsenv-package) before going further.

This documentation is up-to-date with a specific version so prefer any of the following commands

```console
npm install --save-dev @jsenv/eslint-import-resolver@7.0.0
```

```console
yarn add --dev @jsenv/eslint-import-resolver@7.0.0
```

### Step 3 - Configure eslint

- Your eslint config must enable `eslint-plugin-import`
- Your eslint config must use `@jsenv/eslint-import-resolver` resolver

It means your minimal `.eslintrc.js` file looks like this:

```js
module.exports = {
  plugins: ["import"],
  settings: {
    "import/resolver": {
      [`${__dirname}/node_modules/@jsenv/eslint-import-resolver/dist/commonjs/main.js`]: {
        projectDirectoryPath: __dirname,
      },
    },
  },
}
```
