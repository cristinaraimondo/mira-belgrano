
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

cargarOrganizacion();
