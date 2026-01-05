import { $, Glob } from "bun"

await $`rm -rf dist`

const files = new Glob("./source/**/*.ts").scan() as AsyncIterable<string>
const entrypoints: string[] = []
for await (const file of files) {
  entrypoints.push(file)
}

await Bun.build({
  format: "esm",
  outdir: "dist/esm",
  external: ["*"],
  root: "source",
  entrypoints,
})

await $`./node_modules/.bin/tsc --outDir dist/types --declaration --emitDeclarationOnly --declarationMap`
