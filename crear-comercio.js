const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form = document.getElementById("crearComercioForm");
const mensaje = document.getElementById("crearComercioMensaje");

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  mensaje.textContent = "Creando comercio...";

  // Obtener usuario conectado
  const {
    data: { user },
    error: userError
  } = await db.auth.getUser();

  if (userError || !user) {
    mensaje.textContent =
      "Tenés que iniciar sesión para crear un comercio.";
    return;
  }

  const nombre =
    document.getElementById("nombre").value.trim();

  const categoria =
    document.getElementById("categoria").value.trim();

  const descripcion =
    document.getElementById("descripcion").value.trim();

  const whatsapp =
    document.getElementById("whatsapp").value.trim();

  const direccion =
    document.getElementById("direccion").value.trim();

  // Crear un slug simple a partir del nombre
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await db
    .from("comercios")
    .insert({
      nombre: nombre,
      categoria: categoria,
      descripcion: descripcion,
      whatsapp: whatsapp || null,
      direccion: direccion || null,
      slug: slug,

      usuario_id: user.id,

      // Todavía no está publicado.
      plan: null,
      estado: "inactivo",
      destacado: false
    });

  if (error) {
    console.error("Error creando comercio:", error);

    mensaje.textContent =
      "No se pudo crear el comercio.";

    return;
  }

  // Volvemos al panel.
  // Allí podrá elegir Básico o Auspiciante.
  window.location.href = "panel.html";

});