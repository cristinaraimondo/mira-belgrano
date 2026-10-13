const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
async function cargarComercios() {
  const { data, error } = await db
  .from("comercios")
  .select("*")
  .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al cargar comercios:", error);
    return;
  }

  console.log("Comercios cargados:", data);

const lista = document.getElementById("listaComercios");

lista.innerHTML = "";

data.forEach(comercio => {
  if (comercio.estado === "inactivo") {
  return;
}

  const oculto = comercio.destacado ? "" : "display: none;";

  lista.innerHTML += `
   <article
  class="comercioCard"
  data-destacado="${comercio.destacado}"
   data-categoria="${comercio.categoria || ''}"
  style="${oculto}"
>

      <div
        class="comercioImagen"
      style="
  background-image: url('${comercio.foto_url || "logo.png"}');
  background-size: ${comercio.foto_url ? "cover" : "contain"};
  background-repeat: no-repeat;
  background-position: center;
"
      >
       ${comercio.destacado ? `<span>DESTACADO</span>` : ""}
      </div>

      <div class="comercioInfo">

        <small>${comercio.categoria || ""}</small>

        <h3>${comercio.nombre}</h3>

       <p class="descripcionComercio">${comercio.descripcion || ""}</p>

${(comercio.descripcion || "").length > 100 ? `
  <button
    type="button"
    class="btnLeerMas"
    onclick="
      const descripcion = this.previousElementSibling;
      descripcion.classList.toggle('expandido');
      this.textContent = descripcion.classList.contains('expandido')
        ? 'Leer menos'
        : 'Leer más';
    "
  >Leer más</button>
` : ""}

       <a href="comercio.html?slug=${comercio.slug}" class="btnComercio">
  Ver comercio
</a>

      </div>

    </article>
  `;
});
}

cargarComercios();
function filtrarCategoria(categoria) {

  const normalizar = (texto) =>
    (texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const categoriaBuscada = normalizar(categoria);
const destinoEspecial = seccionesEspeciales.find(seccion =>
  seccion.palabras.some(palabra =>
    texto === palabra || texto.includes(palabra)
  )
);

if (destinoEspecial) {
  window.location.href = destinoEspecial.pagina;
  return;
}

  const tarjetas = document.querySelectorAll(".comercioCard");
  console.log("BUSCADOR EJECUTADO:", texto);

  let encontrados = 0;

  tarjetas.forEach(tarjeta => {

    const categoriaTarjeta =
      normalizar(tarjeta.dataset.categoria);

    if (categoriaTarjeta === categoriaBuscada) {
      tarjeta.style.display = "";
      encontrados++;
    } else {
      tarjeta.style.display = "none";
    }

  });

  let mensaje = document.getElementById("sinResultados");

  if (!mensaje) {
    mensaje = document.createElement("p");
    mensaje.id = "sinResultados";
    document.getElementById("listaComercios").after(mensaje);
  }

  mensaje.textContent =
    encontrados === 0
      ? "Todavía no hay comercios en esta categoría."
      : "";
}
function buscarComercios() {
 const texto = document
  .getElementById("buscador")
  .value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim();
  if (texto === "") {
  document.getElementById("tituloComercios").textContent = "Comercios destacados";
} else {
  document.getElementById("tituloComercios").textContent = "Resultados de búsqueda";
}
// BÚSQUEDAS ESPECIALES DE MIRÁBELGRANO

const seccionesEspeciales = [
  {
    palabras: ["farmacia", "farmacias", "farmacia de turno", "farmacias de turno", "guardia"],
    pagina: "farmacias.html"
  },
  {
    palabras: ["evento", "eventos", "fiesta", "fiestas", "feria", "ferias", "agenda"],
    pagina: "eventos.html"
  },
  {
    palabras: ["turismo", "que visitar", "lugares para visitar", "atractivos"],
    pagina: "turismo.html"
  },
  {
    palabras: ["como llegar", "rutas", "accesos"],
    pagina: "como-llegar.html"
  }
];

const destinoEspecial = seccionesEspeciales.find(seccion =>
  seccion.palabras.some(palabra => texto === palabra)
);

if (destinoEspecial) {
  window.location.href = destinoEspecial.pagina;
  return;
}
  const tarjetas = document.querySelectorAll(".comercioCard");
  let encontrados = 0;

  tarjetas.forEach(tarjeta => {
    const contenido = tarjeta.textContent
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

    if (contenido.includes(texto)) {
      tarjeta.style.display = "";
      encontrados++;
    } else {
      tarjeta.style.display = "none";
    }
  });

  let mensaje = document.getElementById("sinResultados");

  if (!mensaje) {
    mensaje = document.createElement("p");
    mensaje.id = "sinResultados";
    document.getElementById("listaComercios").after(mensaje);
  }

  mensaje.textContent =
    encontrados === 0
      ? "No encontramos comercios con esa búsqueda."
      : "";
      // Desplazar automáticamente hacia los resultados
const seccionResultados = document.getElementById("tituloComercios");

if (seccionResultados) {
  seccionResultados.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}
}
function mostrarTodos() {
  const tarjetas = document.querySelectorAll(".comercioCard");

  tarjetas.forEach(tarjeta => {
    const esDestacado = tarjeta.dataset.destacado === "true";

    tarjeta.style.display = esDestacado ? "" : "none";
  });

  const mensaje = document.getElementById("sinResultados");

  if (mensaje) {
    mensaje.textContent = "";
  }

  document.getElementById("buscador").value = "";
  document.getElementById("tituloComercios").textContent = "Comercios destacados";
}
async function cargarPromociones() {
  const hoy = new Date().toISOString().split("T")[0];

const { data, error } = await db
  .from("promociones")
  .select(`
    *,
   comercios!inner (
  nombre,
  slug,
  estado
)
`)
.eq("activo", true)
.eq("comercios.estado", "activo")
.lte("fecha_inicio", hoy)
.gte("fecha_fin", hoy);
  if (error) {
    console.error("Error al cargar promociones:", error);
    return;
  }

  console.log("Promociones cargadas:", data);
  const lista = document.getElementById("listaPromociones");

lista.innerHTML = "";

data.forEach(promocion => {
  lista.innerHTML += `
    <article class="promocionCard">
      <small>OFERTA</small>
      ${promocion.imagen_url ? (
  promocion.archivo_tipo === "video"
    ? `
      <video
        src="${promocion.imagen_url}"
        class="promoImagen promoAmpliable"
        controls
        muted
        playsinline
        preload="metadata"
      ></video>
    `
    : `
      <img
        src="${promocion.imagen_url}"
       class="promoImagen promoAmpliable"
        alt="${promocion.titulo || "Promoción"}"
      >
    `
) : ""}

<p class="promoComercio">
  ${promocion.comercios?.nombre || ""}
</p>

<h3>${promocion.titulo}</h3>

      <p class="descripcionPromo">${promocion.descripcion || ""}</p>

${(promocion.descripcion || "").length > 100 ? `
  <button
    type="button"
    class="btnLeerMas"
    onclick="
      const descripcion = this.previousElementSibling;
      descripcion.classList.toggle('expandido');
      this.textContent = descripcion.classList.contains('expandido')
        ? 'Leer menos'
        : 'Leer más';
    "
  >Leer más</button>
` : ""}

      <p class="promoFecha">
        Válido hasta ${promocion.fecha_fin}
      </p>
      <a
  class="promoBoton"
  href="comercio.html?slug=${promocion.comercios?.slug}"
>
  Ver comercio
</a>
    </article>
  `;
});
}

cargarPromociones();
// ========================================
// VISOR AMPLIADO DE PROMOCIONES
// ========================================

const visorPromocion = document.getElementById("visorPromocion");
const contenidoVisor = document.getElementById("contenidoVisorPromocion");
const cerrarVisorPromocion = document.getElementById("cerrarVisorPromocion");

document.addEventListener("click", (e) => {
  const elemento = e.target.closest(".promoAmpliable");

  if (!elemento) return;

  const url = elemento.currentSrc || elemento.src;
  const esVideo = elemento.tagName === "VIDEO";

  contenidoVisor.innerHTML = "";

  if (esVideo) {
    const video = document.createElement("video");
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    contenidoVisor.appendChild(video);
  } else {
    const imagen = document.createElement("img");
    imagen.src = url;
    imagen.alt = "Promoción ampliada";
    contenidoVisor.appendChild(imagen);
  }

  visorPromocion.classList.add("activo");
});

function cerrarPromocionAmpliada() {
  visorPromocion.classList.remove("activo");
  contenidoVisor.innerHTML = "";
}

cerrarVisorPromocion.addEventListener("click", cerrarPromocionAmpliada);

visorPromocion.addEventListener("click", (e) => {
  if (e.target === visorPromocion) {
    cerrarPromocionAmpliada();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarPromocionAmpliada();
  }
});