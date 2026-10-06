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
const galerias = [
  {
    url: comercio.galeria_1,
    contenedor: "vistaGaleria1"
  },
  {
    url: comercio.galeria_2,
    contenedor: "vistaGaleria2"
  },
  {
    url: comercio.galeria_3,
    contenedor: "vistaGaleria3"
  }
];

galerias.forEach((imagen) => {

  if (!imagen.url) return;

  document.getElementById(imagen.contenedor).innerHTML = `
    <img
      src="${imagen.url}"
      alt="Imagen de la galería"
      style="
        width: 100%;
        height: 140px;
        object-fit: cover;
        border-radius: 10px;
        margin-top: 10px;
      "
    >
  `;

});
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
// ========================================
// GALERÍA
// ========================================

let galeria1Url = comercioActual.galeria_1 || null;
let galeria2Url = comercioActual.galeria_2 || null;
let galeria3Url = comercioActual.galeria_3 || null;

const {
  data: { user: usuarioGaleria }
} = await db.auth.getUser();

if (!usuarioGaleria) {
  mensaje.textContent = "No se pudo identificar el usuario.";
  return;
}

async function subirImagenGaleria(inputId, numero, urlActual) {

  const archivo =
    document.getElementById(inputId).files[0];

  if (!archivo) {
    return urlActual;
  }

  const extension =
    archivo.name.split(".").pop().toLowerCase();

  const nombreArchivo =
    `${usuarioGaleria.id}/galeria-${numero}-${Date.now()}.${extension}`;

  const { error } = await db.storage
    .from("comercios")
    .upload(nombreArchivo, archivo);

  if (error) {
    throw error;
  }

  const { data } = db.storage
    .from("comercios")
    .getPublicUrl(nombreArchivo);

  return data.publicUrl;
}

try {

  galeria1Url = await subirImagenGaleria(
    "galeria1",
    1,
    galeria1Url
  );

  galeria2Url = await subirImagenGaleria(
    "galeria2",
    2,
    galeria2Url
  );

  galeria3Url = await subirImagenGaleria(
    "galeria3",
    3,
    galeria3Url
  );

} catch (error) {

  console.error("Error subiendo galería:", error);

  mensaje.textContent =
    "No se pudieron subir las imágenes de la galería.";

  return;
}

  const { error } = await db
    .from("comercios")
    .update({
        foto_url: fotoUrl,
        foto_url: fotoUrl,
galeria_1: galeria1Url,
galeria_2: galeria2Url,
galeria_3: galeria3Url,

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
// ========================================
// ELIMINAR IMÁGENES DE GALERÍA
// ========================================

async function eliminarImagenGaleria(numero) {

  if (!comercioActual) {
    return;
  }

  const columna = `galeria_${numero}`;
  const urlActual = comercioActual[columna];

  if (!urlActual) {
    alert("No hay ninguna imagen para eliminar.");
    return;
  }

  const confirmar = confirm(
    "¿Querés eliminar esta imagen de la galería?"
  );

  if (!confirmar) {
    return;
  }

  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    alert("No se pudo identificar el usuario.");
    return;
  }

  try {

    // Obtener la ruta del archivo a partir de la URL pública
    const marcador = "/storage/v1/object/public/comercios/";
    const partes = urlActual.split(marcador);

    if (partes.length === 2) {

      const rutaArchivo = decodeURIComponent(partes[1]);

      const { error: errorStorage } = await db.storage
        .from("comercios")
        .remove([rutaArchivo]);

      if (errorStorage) {
        throw errorStorage;
      }
    }

    // Borrar la URL de la base de datos
    const { error: errorBD } = await db
      .from("comercios")
      .update({
        [columna]: null
      })
      .eq("id", comercioActual.id)
      .eq("usuario_id", user.id);

    if (errorBD) {
      throw errorBD;
    }

    comercioActual[columna] = null;

    document.getElementById(
      `vistaGaleria${numero}`
    ).innerHTML = "";

    alert("Imagen eliminada correctamente.");

  } catch (error) {

    console.error(
      "Error eliminando imagen:",
      error
    );

    alert("No se pudo eliminar la imagen.");
  }
}


document
  .getElementById("eliminarGaleria1")
  .addEventListener("click", () => eliminarImagenGaleria(1));

document
  .getElementById("eliminarGaleria2")
  .addEventListener("click", () => eliminarImagenGaleria(2));

document
  .getElementById("eliminarGaleria3")
  .addEventListener("click", () => eliminarImagenGaleria(3));


cargarComercio();