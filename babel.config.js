const path = require("path")

module.exports = function (api) {
  api.cache(true)
  const expoRoot = path.dirname(require.resolve("expo/package.json"))
  const babelPresetExpo = require.resolve("babel-preset-expo", {
    paths: [expoRoot],
  })

  return {
    presets: [
      [babelPresetExpo, { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  }
}
