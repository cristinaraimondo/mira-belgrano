const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form = document.getElementById("editarComercioForm");
const mensaje = document.getElementById("editarComercioMensaje");

let comercioActual = null;


// ========================================
// CARGAR COMERCIO
// ========================================

async function cargarComercio() {

  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data: comercio, error } = await db
    .from("comercios")
    .select("*")
    .eq("usuario_id", user.id)
    .single();

  if (error || !comercio) {

    console.error("Error al cargar comercio:", error);

    mensaje.textContent =
      "No se pudo encontrar tu comercio.";

    return;
  }

  comercioActual = comercio;

  document.getElementById("nombre").value =
    comercio.nombre || "";

  document.getElementById("categoria").value =
    comercio.categoria || "";

  document.getElementById("descripcion").value =
    comercio.descripcion || "";

  document.getElementById("whatsapp").value =
    comercio.whatsapp || "";

  document.getElementById("direccion").value =
    comercio.direccion || "";

  document.getElementById("web").value =
    comercio.web || "";
    const vistaFoto =
  document.getElementById("vistaFotoPrincipal");

if (comercio.foto_url) {
  vistaFoto.innerHTML = `
    <img
      src="${comercio.foto_url}"
      alt="Imagen principal del comercio"
      style="
        width: 100%;
        max-height: 220px;
        object-fit: cover;
        border-radius: 12px;
        margin-top: 10px;
      "
    >
  `;
}
}


// ========================================
// GUARDAR CAMBIOS
// ========================================

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (!comercioActual) {
    mensaje.textContent =
      "No se pudo identificar el comercio.";
    return;
  }

  mensaje.textContent = "Guardando cambios...";
  let fotoUrl = comercioActual.foto_url || null;

const archivoFoto =
  document.getElementById("fotoPrincipal").files[0];

if (archivoFoto) {

  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    mensaje.textContent = "No se pudo identificar el usuario.";
    return;
  }

  const extension =
    archivoFoto.name.split(".").pop().toLowerCase();

  const nombreArchivo =
    `${user.id}/principal-${Date.now()}.${extension}`;

  const { error: errorSubida } = await db.storage
    .from("comercios")
    .upload(nombreArchivo, archivoFoto);

  if (errorSubida) {
    console.error("Error subiendo imagen:", errorSubida);

    mensaje.textContent =
      "No se pudo subir la imagen.";

    return;
  }

  const { data: urlData } = db.storage
    .from("comercios")
    .getPublicUrl(nombreArchivo);

  fotoUrl = urlData.publicUrl;
}

  const { error } = await db
    .from("comercios")
    .update({
        foto_url: fotoUrl,

      nombre:
        document.getElementById("nombre").value.trim(),

      categoria:
        document.getElementById("categoria").value.trim(),

      descripcion:
        document.getElementById("descripcion").value.trim(),

      whatsapp:
        document.getElementById("whatsapp").value.trim() || null,

      direccion:
        document.getElementById("direccion").value.trim() || null,

      web:
        document.getElementById("web").value.trim() || null

    })
    .eq("id", comercioActual.id)
    .eq("usuario_id", comercioActual.usuario_id);

  if (error) {

    console.error("Error al guardar:", error);

    mensaje.textContent =
      "No se pudieron guardar los cambios.";

    return;
  }

  mensaje.textContent =
    "Cambios guardados correctamente.";
});


cargarComercio();