const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function cargarComercio() {

  const parametros = new URLSearchParams(window.location.search);
  const slug = parametros.get("slug");

  if (!slug) {
    document.getElementById("comercioNombre").textContent =
      "Comercio no encontrado";
    return;
  }

 const { data, error } = await db
  .from("comercios")
  .select("*")
  .eq("slug", slug)
  .single();

  if (error) {
    console.error("Error al cargar comercio:", error);

    document.getElementById("comercioNombre").textContent =
      "Comercio no encontrado";

    return;
  }
  await cargarPromocionesComercio(data.id);

  console.log("Comercio cargado:", data);
  document.getElementById("comercioNombre").textContent = data.nombre;

document.getElementById("comercioCategoria").textContent =
  data.categoria || "";

document.getElementById("comercioDescripcion").textContent =
  data.descripcion || "";

const foto = document.getElementById("comercioFoto");

if (data.foto_url) {
  foto.style.backgroundImage = `url('${data.foto_url}')`;
  foto.classList.remove("sin-foto");
} else {
  foto.style.backgroundImage = "";
  foto.classList.add("sin-foto");
}
const datos = document.getElementById("comercioDatos");

datos.innerHTML = `
${data.direccion ? `
  <p>
    📍
    <a href="${data.maps_url || "#"}" target="_blank" rel="noopener noreferrer">
      Ubicación
    </a>
  </p>
` : ""}
  ${data.horarios ? `<p>🕒 ${data.horarios}</p>` : ""}
  ${data.telefono ? `<p>📞 ${data.telefono}</p>` : ""}
  ${data.whatsapp ? `<p>💬 <a href="https://wa.me/${data.whatsapp.replace(/\D/g, "")}" target="_blank" rel="noopener noreferrer">WhatsApp</a></p>` : ""}
  ${data.instagram ? `<p>📷 <a href="${data.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a></p>` : ""}
  ${data.web ? `
  <p>
    🌐 <a href="${data.web}" target="_blank" rel="noopener noreferrer">
      Sitio web
    </a>
  </p>
` : ""}
`;
const galeria = document.getElementById("comercioGaleria");

const fotosGaleria = [
  data.galeria_1,
  data.galeria_2,
  data.galeria_3
].filter(Boolean);

if (fotosGaleria.length > 0) {
  galeria.innerHTML = fotosGaleria
    .map(foto => `
      <img
        src="${foto}"
        alt="Foto de ${data.nombre}"
        loading="lazy"
      >
    `)
    .join("");
} else {
  galeria.style.display = "none";
}
}

cargarComercio();
async function cargarPromocionesComercio(comercioId) {
  const hoy = new Date().toISOString().split("T")[0];

  const { data, error } = await db
    .from("promociones")
    .select("*")
    .eq("comercio_id", comercioId)
    .eq("activo", true)
    .lte("fecha_inicio", hoy)
    .gte("fecha_fin", hoy)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar promociones:", error);
    return;
  }

  const seccion = document.getElementById("promocionesComercio");
  const lista = document.getElementById("listaPromocionesComercio");

  // Si el comercio no tiene promociones vigentes, ocultamos la sección
  if (!data || data.length === 0) {
    seccion.style.display = "none";
    return;
  }

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

        <h3>${promocion.titulo || ""}</h3>

        <p>${promocion.descripcion || ""}</p>

        <p class="promoFecha">
          Válido hasta ${promocion.fecha_fin}
        </p>

      </article>
    `;
  });
}
const visorGaleria = document.getElementById("visorGaleria");
const imagenVisor = document.getElementById("imagenVisor");
const cerrarVisor = document.getElementById("cerrarVisor");

// Abrir imagen
document.addEventListener("click", (e) => {
  if (e.target.matches("#comercioGaleria img")) {
    imagenVisor.src = e.target.src;
    imagenVisor.alt = e.target.alt;
    visorGaleria.classList.add("activo");
  }
});

// Cerrar con la X
cerrarVisor.addEventListener("click", () => {
  visorGaleria.classList.remove("activo");
});

// Cerrar haciendo clic en el fondo
visorGaleria.addEventListener("click", (e) => {
  if (e.target === visorGaleria) {
    visorGaleria.classList.remove("activo");
  }
});

// Cerrar con Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    visorGaleria.classList.remove("activo");
  }
});