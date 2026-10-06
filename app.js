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

        <p>${comercio.descripcion || ""}</p>

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
document.getElementById("tituloComercios").textContent = categoria;
  const tarjetas = document.querySelectorAll(".comercioCard");
  let encontrados = 0;

  tarjetas.forEach(tarjeta => {
    const categoriaTarjeta = tarjeta.querySelector("small").textContent.trim();

    if (categoriaTarjeta === categoria) {
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
        class="promoImagen"
        controls
        muted
        playsinline
        preload="metadata"
      ></video>
    `
    : `
      <img
        src="${promocion.imagen_url}"
        class="promoImagen"
        alt="${promocion.titulo || "Promoción"}"
      >
    `
) : ""}

<p class="promoComercio">
  ${promocion.comercios?.nombre || ""}
</p>

<h3>${promocion.titulo}</h3>

      <p>${promocion.descripcion || ""}</p>

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