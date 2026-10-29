const anio = document.querySelector("#anio");
if (anio) {
  anio.textContent = String(new Date().getFullYear());
}

const volverArriba = document.querySelector("#volver-arriba");
if (volverArriba) {
  volverArriba.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const identidad = document.querySelector(".identidad");
const menu = document.querySelector(".menu-principal");

function difuminarCabecera() {
  if (!identidad || !menu) {
    return;
  }
  const recorrido = Math.max(menu.offsetTop, 1);
  const avance = Math.min(Math.max(window.scrollY / recorrido, 0), 1);
  identidad.style.opacity = String(1 - avance);
}

if (identidad && menu) {
  difuminarCabecera();
  window.addEventListener("scroll", difuminarCabecera, { passive: true });
}
