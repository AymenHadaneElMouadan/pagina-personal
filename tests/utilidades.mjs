import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raizProyecto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function rutaSite(...segmentos) {
  return path.join(raizProyecto, "site", ...segmentos);
}

export function leerSite(relativo) {
  return readFileSync(rutaSite(relativo), "utf8");
}

export function extraerAtributos(html, etiqueta) {
  const etiquetaSegura = etiqueta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const aperturas = html.matchAll(new RegExp(`<${etiquetaSegura}\\b([^>]*)>`, "gi"));
  return [...aperturas].map((coincidencia) => leerAtributos(coincidencia[1] ?? ""));
}

export function esRutaInterna(url) {
  if (!url || url.startsWith("//")) {
    return false;
  }
  return !/^[a-z][a-z\d+.-]*:/i.test(url);
}

export function existeDestinoRelativo(url, pagina) {
  const ruta = url.split("#")[0].split("?")[0];
  if (ruta === "") {
    return true;
  }
  const destino = path.resolve(path.dirname(rutaSite(pagina)), ruta);
  return existsSync(destino);
}

function leerAtributos(declaracion) {
  const atributos = {};
  const pares = declaracion.matchAll(
    /([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  );
  for (const par of pares) {
    atributos[par[1].toLowerCase()] = par[2] ?? par[3] ?? par[4] ?? "";
  }
  return atributos;
}
