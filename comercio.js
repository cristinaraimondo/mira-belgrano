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
  // SEO automático para cada comercio

const nombreSEO = data.nombre || "Comercio";
const descripcionSEO = data.descripcion
  ? data.descripcion.replace(/\s+/g, " ").trim().slice(0, 155)
  : `Conocé ${nombreSEO} en General Belgrano, Buenos Aires. Encontrá información y datos de contacto en MiráBelgrano.`;

// Título individual
document.title = `${nombreSEO} | MiráBelgrano`;
// Datos estructurados automáticos para Google
const datosEstructurados = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": nombreSEO,
  "description": data.descripcion || `Comercio en General Belgrano, Buenos Aires`,
  "url": `${window.location.origin}/comercio.html?slug=${encodeURIComponent(slug)}`,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "General Belgrano",
    "addressRegion": "Buenos Aires",
    "addressCountry": "AR"
  }
};

if (data.direccion) {
  datosEstructurados.address.streetAddress = data.direccion;
}

if (data.telefono) {
  datosEstructurados.telephone = data.telefono;
}

if (data.foto_url) {
  datosEstructurados.image = data.foto_url;
}

let scriptSEO = document.getElementById("datosEstructuradosComercio");

if (!scriptSEO) {
  scriptSEO = document.createElement("script");
  scriptSEO.id = "datosEstructuradosComercio";
  scriptSEO.type = "application/ld+json";
  document.head.appendChild(scriptSEO);
}

scriptSEO.textContent = JSON.stringify(datosEstructurados);

// Descripción individual
let metaDescripcion = document.querySelector('meta[name="description"]');

if (!metaDescripcion) {
  metaDescripcion = document.createElement("meta");
  metaDescripcion.name = "description";
  document.head.appendChild(metaDescripcion);
}

metaDescripcion.content = descripcionSEO;

// Dirección canónica individual
let canonical = document.querySelector('link[rel="canonical"]');

if (!canonical) {
  canonical = document.createElement("link");
  canonical.rel = "canonical";
  document.head.appendChild(canonical);
}

canonical.href =
  `${window.location.origin}/comercio.html?slug=${encodeURIComponent(slug)}`;
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

        <h3>${promocion.titulo || ""}</h3>

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
// VISOR AMPLIADO DE PROMOCIONES

const visorPromo = document.getElementById("visorPromocion");
const contenidoPromo = document.getElementById("contenidoVisorPromocion");
const cerrarPromo = document.getElementById("cerrarVisorPromocion");

document.addEventListener("click", (e) => {
  const elemento = e.target.closest(".promoAmpliable");
  if (!elemento) return;

  contenidoPromo.innerHTML = "";

  const ampliado = elemento.cloneNode(true);

  ampliado.classList.remove("promoAmpliable");
  ampliado.removeAttribute("id");

  if (ampliado.tagName === "VIDEO") {
    ampliado.controls = true;
    ampliado.muted = false;
  }

  contenidoPromo.appendChild(ampliado);
  visorPromo.classList.add("activo");
});

function cerrarVisorPromo() {
  visorPromo.classList.remove("activo");
  contenidoPromo.innerHTML = "";
}

cerrarPromo.addEventListener("click", cerrarVisorPromo);

visorPromo.addEventListener("click", (e) => {
  if (e.target === visorPromo) cerrarVisorPromo();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarVisorPromo();
});