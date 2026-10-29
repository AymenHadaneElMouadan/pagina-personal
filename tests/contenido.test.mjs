import assert from "node:assert/strict";
import test from "node:test";
import { PERFIL } from "./perfil.mjs";
import {
  esRutaInterna,
  existeDestinoRelativo,
  extraerAtributos,
  leerSite,
} from "./utilidades.mjs";

const PAGINAS = ["index.html", "proyectos.html"];

function referencias(html) {
  return [...html.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map(
    (coincidencia) => coincidencia[1] ?? coincidencia[2] ?? ""
  );
}

function seccion(html, id) {
  const coincidencia = html.match(
    new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i")
  );
  return coincidencia ? coincidencia[1] : "";
}

for (const pagina of PAGINAS) {
  test(`${pagina} cumple la estructura común`, () => {
    const html = leerSite(pagina);
    const etiquetaHtml = extraerAtributos(html, "html")[0];
    assert.ok(etiquetaHtml, `${pagina} no tiene la etiqueta html`);
    assert.equal(etiquetaHtml.lang, "es", `${pagina} debe usar lang="es"`);

    const metas = extraerAtributos(html, "meta");
    assert.ok(
      metas.some((meta) => meta.name === "viewport" && meta.content),
      `${pagina} no tiene meta viewport`
    );
    const descripcion = metas.find((meta) => meta.name === "description");
    assert.ok(descripcion?.content, `${pagina} no tiene meta description`);
    assert.ok(
      descripcion.content.length > 20,
      `${pagina} necesita una meta description de más de 20 caracteres`
    );

    const titulares = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    assert.equal(titulares.length, 1, `${pagina} debe tener un único h1`);
    assert.ok(
      titulares[0][1].includes(PERFIL.nombre),
      `${pagina}: el h1 no contiene el nombre`
    );
    assert.ok(
      titulares[0][1].includes(PERFIL.titulo),
      `${pagina}: el h1 no contiene el titular`
    );

    for (const etiqueta of ["header", "nav", "main", "footer"]) {
      assert.match(
        html,
        new RegExp(`<${etiqueta}\\b`, "i"),
        `${pagina} no contiene <${etiqueta}>`
      );
    }

    const imagenes = extraerAtributos(html, "img");
    assert.ok(imagenes.length > 0, `${pagina} no incluye el avatar`);
    for (const imagen of imagenes) {
      assert.ok(
        (imagen.alt ?? "").trim().length >= 3,
        `${pagina} tiene una imagen con alt de menos de 3 caracteres`
      );
      assert.ok(imagen.width, `${pagina} tiene una imagen sin width`);
      assert.ok(imagen.height, `${pagina} tiene una imagen sin height`);
    }

    for (const url of referencias(html)) {
      assert.ok(
        !url.startsWith("/"),
        `${pagina} usa una ruta que empieza por /: ${url}`
      );
      if (esRutaInterna(url)) {
        assert.ok(
          existeDestinoRelativo(url, pagina),
          `${pagina}: el enlace interno ${url} no apunta a un fichero existente`
        );
      }
    }

    for (const enlace of extraerAtributos(html, "a")) {
      const href = enlace.href ?? "";
      if (!/^https?:\/\//i.test(href)) {
        continue;
      }
      assert.equal(
        enlace.target,
        "_blank",
        `${pagina}: el enlace externo ${href} no tiene target="_blank"`
      );
      assert.match(
        enlace.rel ?? "",
        /(^|\s)noopener(\s|$)/,
        `${pagina}: el enlace externo ${href} no incluye rel con noopener`
      );
    }
  });
}

test("index.html muestra el título, las secciones, las habilidades y el contacto del perfil", () => {
  const html = leerSite("index.html");
  const title = html.match(/<title>([^<]*)<\/title>/i);
  assert.ok(title, "index.html no tiene <title>");
  assert.equal(
    title[1].trim(),
    PERFIL.tituloDocumento,
    "El <title> de index.html no coincide con el del perfil"
  );

  for (const id of PERFIL.secciones) {
    const contenido = seccion(html, id);
    assert.ok(contenido, `Falta la sección #${id} en index.html`);
    assert.match(
      contenido,
      /<h2\b/i,
      `La sección #${id} de index.html no tiene un h2`
    );
  }

  const habilidades = seccion(html, "habilidades");
  const cantidad = (habilidades.match(/<li\b/gi) ?? []).length;
  assert.ok(
    cantidad >= PERFIL.minimoHabilidades,
    `La sección #habilidades debe tener al menos ${PERFIL.minimoHabilidades} elementos li y tiene ${cantidad}`
  );

  const contacto = seccion(html, "contacto");
  assert.match(
    contacto,
    new RegExp(`mailto:${PERFIL.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
    "La sección #contacto no contiene el mailto del perfil"
  );
  assert.match(
    contacto,
    new RegExp(`https://github\\.com/${PERFIL.usuarioGithub}(?![\\w-])`),
    "La sección #contacto no contiene el enlace de GitHub del perfil"
  );
});

test("proyectos.html lista los proyectos con descripción, tecnologías y enlace", () => {
  const html = leerSite("proyectos.html");
  const articulos = [
    ...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi),
  ].filter((coincidencia) =>
    /(?:^|\s)proyecto(?:\s|$)/.test(
      (coincidencia[1].match(/\bclass\s*=\s*"([^"]*)"/i) ?? [])[1] ?? ""
    )
  );

  assert.ok(
    articulos.length >= PERFIL.minimoProyectos,
    `proyectos.html debe tener al menos ${PERFIL.minimoProyectos} article.proyecto y tiene ${articulos.length}`
  );

  for (const articulo of articulos) {
    const cuerpo = articulo[2];
    assert.match(
      cuerpo,
      /<h[23]\b/i,
      "Hay un article.proyecto sin h2 ni h3"
    );
    assert.match(cuerpo, /<p\b/i, "Hay un article.proyecto sin párrafo de descripción");
    assert.match(
      cuerpo,
      /<ul\b[^>]*class="[^"]*\btecnologias\b[^"]*"/i,
      "Hay un article.proyecto sin ul.tecnologias"
    );
  }
});
