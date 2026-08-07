import { writeFileSync } from "node:fs";

// El package.json raíz declara "type": "module" (para el web, bundleado por
// Next). El worker se compila a CommonJS (ver tsconfig.worker.json) para que
// las importaciones relativas sin extensión resuelvan con `require` normal.
// Este package.json local le dice a Node que trate dist-worker/**/*.js como
// CommonJS, no ESM.
writeFileSync("dist-worker/package.json", JSON.stringify({ type: "commonjs" }, null, 2) + "\n");
