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

  const { error } = await db
    .from("comercios")
    .update({

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