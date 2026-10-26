
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const ADMIN_ID = "7de52da5-e675-4709-8e43-23c7e0a0587b";

async function verificarAdministrador() {
  const estado = document.getElementById("adminEstado");
  const contenido = document.getElementById("adminContenido");

  const { data: { user }, error } = await db.auth.getUser();

  if (error || !user) {
    estado.textContent = "Necesitás iniciar sesión para acceder.";
    return;
  }

  if (user.id !== ADMIN_ID) {
    estado.textContent = "⛔ Acceso exclusivo para administración.";
    return;
  }

  estado.hidden = true;
  contenido.hidden = false;
}


async function cargarInstitucionesAdmin() {
  const contenedor = document.getElementById("listaInstitucionesAdmin");

  const { data: instituciones, error } = await db
    .from("organizaciones")
    .select("id, nombre, slug, verificada, publicada, usuario_id")
    .order("nombre");

  if (error) {
    console.error("Error al cargar instituciones:", error);
    contenedor.textContent = "No se pudieron cargar las instituciones.";
    return;
  }

  contenedor.replaceChildren();

  if (!instituciones.length) {
    contenedor.textContent = "Todavía no hay instituciones registradas.";
    return;
  }

  instituciones.forEach(institucion => {
    const tarjeta = document.createElement("div");
    tarjeta.style.cssText =
      "padding:15px 0;border-bottom:1px solid #eee5f6;";

    const nombre = document.createElement("strong");
    nombre.textContent = institucion.nombre;

    const estado = document.createElement("p");
    estado.textContent =
      `Verificada: ${institucion.verificada ? "✅ Sí" : "❌ No"} | ` +
      `Publicada: ${institucion.publicada ? "✅ Sí" : "❌ No"}`;

    const responsable = document.createElement("p");
    responsable.textContent = institucion.usuario_id
      ? "👤 Tiene una cuenta vinculada"
      : "⚠️ Sin representante vinculado";

    tarjeta.append(nombre, estado, responsable);
    const boton = document.createElement("button");
boton.className = "adminBoton";
boton.type = "button";

boton.textContent = institucion.verificada
  ? "Quitar verificación y publicación"
  : "Verificar y publicar";

boton.addEventListener("click", async () => {
  const activar = !institucion.verificada;

  const confirmar = confirm(
    activar
      ? `¿Verificar y publicar "${institucion.nombre}"?`
      : `¿Quitar la verificación y publicación de "${institucion.nombre}"?`
  );

  if (!confirmar) return;

  boton.disabled = true;
  boton.textContent = "Guardando...";

  const { error } = await db.rpc(
    "admin_actualizar_estado_organizacion",
    {
      p_organizacion_id: institucion.id,
      p_verificada: activar,
      p_publicada: activar
    }
  );

  if (error) {
    console.error(error);
    alert("No se pudo actualizar la institución.");
    boton.disabled = false;
    boton.textContent = activar
      ? "Verificar y publicar"
      : "Quitar verificación y publicación";
    return;
  }

  await cargarInstitucionesAdmin();
});

tarjeta.appendChild(boton);

    if (institucion.slug) {
      const enlace = document.createElement("a");
      enlace.href =
        `organizacion.html?slug=${encodeURIComponent(institucion.slug)}`;
      enlace.textContent = "Ver ficha pública";
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";

      tarjeta.appendChild(enlace);
    }

    contenedor.appendChild(tarjeta);
  });
}

async function iniciarPanelAdmin() {
  await verificarAdministrador();

  if (!document.getElementById("adminContenido").hidden) {
    await cargarInstitucionesAdmin();
  }
}

iniciarPanelAdmin();

