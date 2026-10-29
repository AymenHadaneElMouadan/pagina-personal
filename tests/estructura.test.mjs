import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ficheros = [
  "site/index.html",
  "site/proyectos.html",
  "site/css/estilos.css",
  "site/js/main.js",
  "site/img/avatar.svg",
  ".github/workflows/pages.yml",
];

test("existen los ficheros del sitio y el workflow de Pages", () => {
  for (const relativo of ficheros) {
    assert.ok(
      existsSync(path.join(raiz, relativo)),
      `Falta el fichero ${relativo}`
    );
  }
});

test("el .gitignore contiene node_modules", () => {
  const gitignore = readFileSync(path.join(raiz, ".gitignore"), "utf8");
  assert.match(
    gitignore,
    /node_modules/,
    "El .gitignore no contiene node_modules"
  );
});
