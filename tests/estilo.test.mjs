import assert from "node:assert/strict";
import test from "node:test";
import { PERFIL } from "./perfil.mjs";
import { leerSite } from "./utilidades.mjs";

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("los estilos respetan la paleta, la tipografía y los media queries del perfil", () => {
  const css = leerSite("css/estilos.css");
  const bloqueRoot = css.match(/:root\s*\{([^}]*)\}/);
  assert.ok(bloqueRoot, "El CSS no define el bloque :root");

  for (const [variable, valor] of Object.entries(PERFIL.paleta)) {
    assert.match(
      bloqueRoot[1],
      new RegExp(`${escaparRegex(variable)}\\s*:\\s*${escaparRegex(valor)}`),
      `Falta ${variable}: ${valor} dentro de :root`
    );
  }

  const fueraDeRoot = css.replace(/:root\s*\{[^}]*\}/g, "");
  for (const valor of Object.values(PERFIL.paleta)) {
    assert.ok(
      !fueraDeRoot.toLowerCase().includes(valor.toLowerCase()),
      `El valor ${valor} de la paleta aparece fuera de :root`
    );
  }

  assert.match(
    css,
    /var\(\s*--color-primario\s*\)/,
    "El CSS no usa var(--color-primario)"
  );
  assert.match(
    css,
    new RegExp(escaparRegex(PERFIL.fuenteTitulos)),
    `No aparece la fuente de títulos ${PERFIL.fuenteTitulos}`
  );
  assert.match(
    css,
    new RegExp(escaparRegex(PERFIL.fuenteTexto)),
    `No aparece la fuente de texto ${PERFIL.fuenteTexto}`
  );

  const consultas = css.match(/@media[^{]*\{/g) ?? [];
  assert.ok(
    consultas.some((consulta) => consulta.includes(PERFIL.puntoRuptura)),
    `Falta un @media con el punto de ruptura ${PERFIL.puntoRuptura}`
  );

  const tieneModoOscuro = /@media[^{]*prefers-color-scheme:\s*dark/i.test(css);
  if (PERFIL.modoOscuro) {
    assert.ok(
      tieneModoOscuro,
      "Falta la media query prefers-color-scheme: dark"
    );
  } else {
    assert.ok(
      !tieneModoOscuro,
      "No debe existir prefers-color-scheme: dark si modoOscuro es false"
    );
  }
});
