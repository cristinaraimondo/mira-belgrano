
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function cargarOrganizacion() {
  const parametros = new URLSearchParams(window.location.search);
  const slug = parametros.get("slug");

  const nombre = document.getElementById("organizacionNombre");

  if (!slug) {
    nombre.textContent = "Organización no encontrada";
    return;
  }
  // Comprobar si la sesión pertenece al administrador
const { data: { user } } = await db.auth.getUser();

const esAdministrador =
  user?.id === "7de52da5-e675-4709-8e43-23c7e0a0587b";

  const { data, error } = await db
    .from("organizaciones")
  
.select(`
      id,
      publicada,
      verificada,
      nombre,
      descripcion,
      logo_url,

      telefono,
      whatsapp,
      email,
      direccion,
     sitio_web,
    enlace_donacion,
    revista_url
    `)
  .eq("slug", slug)
.maybeSingle();

if (error || !data) {
  console.error("Error al cargar organización:", error);
  nombre.textContent = "Organización no disponible";
  return;
}
  // Impedir mostrar fichas pendientes a otros usuarios
if (!esAdministrador && (!data.verificada || !data.publicada)) {
  nombre.textContent = "Organización no disponible";
  return;
}
// Mostrar aviso de vista previa al administrador
if (esAdministrador && (!data.verificada || !data.publicada)) {
  document.getElementById("etiquetaVistaPrevia").hidden = false;
}

  document.title = `${data.nombre} | Mirá Belgrano`;
  nombre.textContent = data.nombre;

  document.getElementById("organizacionDescripcion").textContent =
    data.descripcion || "";

  // Logo
  if (data.logo_url) {
    const logo = document.getElementById("organizacionLogo");
    logo.src = data.logo_url;
    logo.alt = `Logo de ${data.nombre}`;
    logo.hidden = false;
  }

  // Contacto
  const contacto = document.getElementById("organizacionContacto");

  function agregarContacto(etiqueta, valor, enlace) {
    if (!valor) return;

    const elemento = document.createElement("a");
    elemento.textContent = `${etiqueta}: ${valor}`;

    if (enlace) {
      elemento.href = enlace;
      if (enlace.startsWith("http")) {
        elemento.target = "_blank";
        elemento.rel = "noopener noreferrer";
      }
    } else {
      elemento.removeAttribute("href");
    }

    contacto.appendChild(elemento);
    contacto.hidden = false;
  }

  agregarContacto(
    "Teléfono",
    data.telefono,
    data.telefono ? `tel:${data.telefono.replace(/[^\d+]/g, "")}` : null
  );

  agregarContacto(
    "WhatsApp",
    data.whatsapp,
    data.whatsapp
      ? `https://wa.me/${data.whatsapp.replace(/\D/g, "")}`
      : null
  );

  agregarContacto(
    "Correo",
    data.email,
    data.email ? `mailto:${data.email}` : null
  );

  agregarContacto("Dirección", data.direccion, null);

  if (data.sitio_web) {
    try {
      const web = new URL(data.sitio_web);
      if (["https:", "http:"].includes(web.protocol)) {
        agregarContacto("Sitio web", data.sitio_web, web.href);
      }
    } catch {
      console.warn("Sitio web inválido");
    }
  }
  // Revista digital
if (data.revista_url) {
  try {
    const url = new URL(data.revista_url);

    if (url.protocol === "https:") {
      document.getElementById("organizacionRevistaLink").href = url.href;
      document.getElementById("organizacionRevista").hidden = false;
    }
  } catch {
    console.warn("Enlace de revista inválido");
  }
}

  // Cargar historias públicas de esta institución
  await cargarHistoriasPublicas(data.id);

  // Donaciones
  if (data.enlace_donacion) {
    try {
      const url = new URL(data.enlace_donacion);

      if (["https:", "http:"].includes(url.protocol)) {
        const boton = document.getElementById("organizacionDonar");
        boton.href = url.href;
        boton.hidden = false;
      }
    } catch {
      console.warn("Enlace de donación inválido");
    }
  }
}
async function cargarHistoriasPublicas(institucionId) {
  const seccion = document.getElementById("organizacionHistorias");
  const contenedor = document.getElementById("listaHistoriasPublicas");


const { data: historias, error } = await db
.from("historias_instituciones")
.select("titulo, descripcion, imagen_url, created_at")
.eq("organizacion_id", institucionId)
.eq("publicada", true)
.order("created_at", { ascending: false });

if (error) {
console.error("Error al cargar historias públicas:", error);
return;
}

if (!historias?.length) return;

contenedor.replaceChildren();

historias.forEach(historia => {
const tarjeta = document.createElement("article");
tarjeta.className = "historiaPublica";

if (historia.imagen_url) {
const imagen = document.createElement("img");
imagen.src = historia.imagen_url;
imagen.alt = historia.titulo;
imagen.loading = "lazy";
tarjeta.appendChild(imagen);
}

const contenido = document.createElement("div");

const titulo = document.createElement("h3");
titulo.textContent = historia.titulo;

const descripcion = document.createElement("p");
descripcion.textContent = historia.descripcion;

const fecha = document.createElement("small");
fecha.textContent = new Date(historia.created_at)
.toLocaleDateString("es-AR");

contenido.append(titulo, descripcion, fecha);
tarjeta.appendChild(contenido);
contenedor.appendChild(tarjeta);
});

seccion.hidden = false;
}
cargarOrganizacion();
