const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
let comercioActual = null;
let promocionEditando = null;
let imagenActualEditando = null;
async function cargarPanel() {

  // Obtener usuario conectado
  const {
    data: { user }
  } = await db.auth.getUser();

  // Si no hay sesión, volver al login
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Buscar qué comercio pertenece a este usuario
  const { data: comercio, error } = await db
    .from("comercios")
    .select("*")
    .eq("usuario_id", user.id)
    .single();

 if (error || !comercio) {
  console.log("El usuario todavía no tiene comercio.");

  document.getElementById("panelTitulo").textContent =
    "Creá tu comercio";

  document.getElementById("panelPlan").innerHTML =
    `Completá los datos de tu comercio para comenzar a publicarlo en Mirá Belgrano.`;

  document.getElementById("panelSuscripcion").style.display = "none";
  document.getElementById("panelContenido").style.display = "none";

  const botonCrear = document.createElement("a");

  botonCrear.href = "crear-comercio.html";
  botonCrear.className = "btnRegistro";
  botonCrear.textContent = "Crear mi comercio";

  document.getElementById("panelPlan").after(botonCrear);

  return;
}
  comercioActual = comercio;
  const panelPromociones = document.getElementById("panelPromociones");

if (comercio.plan === "auspiciante") {
  panelPromociones.style.display = "block";
} else {
  panelPromociones.style.display = "none";
}

  console.log("Comercio del usuario:", comercio);

  document.getElementById("panelTitulo").textContent =
    comercio.nombre;

  document.getElementById("panelPlan").textContent =
    `Plan: ${comercio.plan || "Sin plan"}`;
    const estadoSuscripcion = document.getElementById("estadoSuscripcion");

if (comercio.estado === "activo") {
  estadoSuscripcion.innerHTML =
    `Estado de la suscripción: <strong>Activa</strong>`;
} else {
  estadoSuscripcion.innerHTML =
    `Estado de la suscripción: <strong>Inactiva</strong>`;
}
const panelContenido = document.getElementById("panelContenido");

if (comercio.estado !== "activo") {
  panelContenido.style.display = "none";
} else {
  panelContenido.style.display = "block";
}

if (comercio.plan) {
  document.getElementById("seleccionarPlan").value = comercio.plan;
}
    const { data: promociones, error: errorPromociones } = await db
  .from("promociones")
  .select("*")
  .eq("comercio_id", comercio.id)
  .order("created_at", { ascending: false });

if (errorPromociones) {
  console.error("Error al cargar promociones:", errorPromociones);
  return;
}

const contenedor = document.getElementById("misPromociones");

contenedor.innerHTML = "";

if (promociones.length === 0) {
  contenedor.innerHTML = `
    <p>Todavía no tenés promociones.</p>
  `;
} else {

  promociones.forEach(promocion => {

    contenedor.innerHTML += `
     <div
  class="panelPromoCard"
  data-titulo="${promocion.titulo || ""}"
  data-descripcion="${promocion.descripcion || ""}"
  data-inicio="${promocion.fecha_inicio || ""}"
  data-fin="${promocion.fecha_fin || ""}"
  data-imagen="${promocion.imagen_url || ""}"
>${promocion.imagen_url ? (
  promocion.archivo_tipo === "video"
    ? `
      <video
        src="${promocion.imagen_url}"
        class="panelPromoImagen"
        controls
        muted
        playsinline
        preload="metadata"
      ></video>
    `
    : `
      <img
        src="${promocion.imagen_url}"
        class="panelPromoImagen"
        alt="${promocion.titulo || "Promoción"}"
      >
    `
) : ""}

        <h3>${promocion.titulo}</h3>

        <p>${promocion.descripcion || ""}</p>

        <p>
          Vigencia:
          ${promocion.fecha_inicio}
          →
          ${promocion.fecha_fin}
        </p>

        <strong>
          ${promocion.activo ? "Activa" : "Inactiva"}
        </strong>
<div class="accionesPromo">

  <button
    class="btnEditarPromo"
    data-id="${promocion.id}"
  >
    Editar
  </button>

  <button
    class="btnEliminarPromo"
    data-id="${promocion.id}"
  >
    Eliminar
  </button>

</div>

      </div>
    `;

  });
}
}

cargarPanel();
document
  .getElementById("cerrarSesion")
  .addEventListener("click", async () => {

    await db.auth.signOut();

    window.location.href = "login.html";
  });
  document
  .getElementById("nuevaPromocion")
  .addEventListener("click", () => {

    const formulario = document.getElementById("formPromocion");

    formulario.style.display =
      formulario.style.display === "none" ? "block" : "none";
  });
  document
  .getElementById("publicarPromocion")
  .addEventListener("click", async () => {

    if (!comercioActual) return;

    const titulo = document.getElementById("promoTitulo").value.trim();
    const descripcion = document.getElementById("promoDescripcion").value.trim();
    const fechaInicio = document.getElementById("promoInicio").value;
    const fechaFin = document.getElementById("promoFin").value;
    const imagen = document.getElementById("promoImagen").files[0];
    const MAX_ARCHIVO = 10 * 1024 * 1024; // 10 MB

if (imagen && imagen.size > MAX_ARCHIVO) {
  alert("El archivo no puede superar los 10 MB.");
  return;
}

if (
  imagen &&
  ![
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4"
  ].includes(imagen.type)
) {
  alert("Solo podés subir JPG, PNG, WEBP o MP4.");
  return;
}

   if (!titulo || !fechaInicio || !fechaFin || (!imagen && !promocionEditando)) {
  alert("Completá el título, las fechas y seleccioná una imagen.");
  return;
}

    if (fechaFin < fechaInicio) {
      alert("La fecha de finalización no puede ser anterior a la fecha de inicio.");
      return;
    }
   

// Límite del plan Auspiciante: máximo 3 promociones activas
if (!promocionEditando && comercioActual.plan === "auspiciante") {

  const { count, error: errorConteo } = await db
    .from("promociones")
    .select("*", { count: "exact", head: true })
    .eq("comercio_id", comercioActual.id)
    .eq("activo", true);

  if (errorConteo) {
    console.error("Error al contar promociones:", errorConteo);
    alert("No se pudo verificar el límite de promociones.");
    return;
  }

  if (count >= 3) {
    alert(
      "Tu plan Auspiciante permite hasta 3 promociones activas al mismo tiempo."
    );
    return;
  }
}


    
let imagenUrl = imagenActualEditando;
let archivoTipo = "imagen";

if (imagen && imagen.type.startsWith("video/")) {
  archivoTipo = "video";
}
// Si eligió una imagen nueva, la subimos
if (imagen) {

  const extension = imagen.name.split(".").pop();

  const nombreArchivo =
    `promociones/${comercioActual.id}-${Date.now()}.${extension}`;

  const { error: errorImagen } = await db.storage
    .from("promociones")
    .upload(nombreArchivo, imagen);

  if (errorImagen) {
    console.error("Error al subir imagen:", errorImagen);
    alert("No se pudo subir la imagen.");
    return;
  }

  const { data: urlData } = db.storage
    .from("promociones")
    .getPublicUrl(nombreArchivo);

  imagenUrl = urlData.publicUrl;
}


// EDITAR PROMOCIÓN
if (promocionEditando) {

  const { error } = await db
    .from("promociones")
    .update({
      titulo: titulo,
      descripcion: descripcion,
      imagen_url: imagenUrl,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    })
    .eq("id", promocionEditando);

  if (error) {
    console.error("Error al editar promoción:", error);
    alert("No se pudo guardar la promoción.");
    return;
  }

  alert("Promoción actualizada correctamente.");

  window.location.reload();
  return;
}


// CREAR PROMOCIÓN NUEVA
const { error: errorPromo } = await db
  .from("promociones")
  .insert({
    comercio_id: comercioActual.id,
    titulo: titulo,
    descripcion: descripcion,
    imagen_url: imagenUrl,
    archivo_tipo: archivoTipo,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    activo: true
  });

if (errorPromo) {
  console.error("Error al crear promoción:", errorPromo);
  alert("No se pudo crear la promoción.");
  return;
}

alert("Promoción publicada correctamente.");

window.location.reload();
  });
 document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("btnEliminarPromo")) {
    return;
  }

  const promocionId = e.target.dataset.id;

  const confirmar = confirm(
    "¿Seguro que querés eliminar esta promoción?"
  );

  if (!confirmar) return;

  // Buscar la promoción antes de eliminarla
  const { data: promocion, error: errorBuscar } = await db
    .from("promociones")
    .select("id, imagen_url")
    .eq("id", promocionId)
    .single();

  if (errorBuscar) {
    console.error("Error al buscar promoción:", errorBuscar);
    alert("No se pudo eliminar la promoción.");
    return;
  }

  // Borrar la promoción de la base de datos
  const { error: errorEliminar } = await db
    .from("promociones")
    .delete()
    .eq("id", promocionId);

  if (errorEliminar) {
    console.error("Error al eliminar promoción:", errorEliminar);
    alert("No se pudo eliminar la promoción.");
    return;
  }

  // Si tenía imagen, eliminarla de Storage
  if (promocion.imagen_url) {

    const marcador = "/promociones/";

    const posicion = promocion.imagen_url.indexOf(marcador);

    if (posicion !== -1) {

      const rutaImagen = promocion.imagen_url
        .substring(posicion + marcador.length);

      const { error: errorImagen } = await db.storage
        .from("promociones")
        .remove([rutaImagen]);

      if (errorImagen) {
        console.error(
          "La promoción se eliminó, pero hubo un error al borrar la imagen:",
          errorImagen
        );
      }
    }
  }

  alert("Promoción eliminada correctamente.");

  window.location.reload();
});
document.addEventListener("click", (e) => {

  if (!e.target.classList.contains("btnEditarPromo")) {
    return;
  }

  const promocionId = e.target.dataset.id;

  const tarjeta = e.target.closest(".panelPromoCard");

  promocionEditando = promocionId;
  imagenActualEditando = tarjeta.dataset.imagen || null;

  document.getElementById("promoTitulo").value =
    tarjeta.dataset.titulo || "";

  document.getElementById("promoDescripcion").value =
    tarjeta.dataset.descripcion || "";

  document.getElementById("promoInicio").value =
    tarjeta.dataset.inicio || "";

  document.getElementById("promoFin").value =
    tarjeta.dataset.fin || "";

  document.getElementById("formPromocion").style.display = "block";

  document.getElementById("publicarPromocion").textContent =
    "Guardar cambios";

  document.getElementById("formPromocion").scrollIntoView({
    behavior: "smooth"
  });
});
document.getElementById("contratarPlan")
  .addEventListener("click", async () => {

    if (!comercioActual) {
      alert("No se pudo identificar el comercio.");
      return;
    }

    const {
      data: { user }
    } = await db.auth.getUser();

    if (!user || !user.email) {
      alert("No se pudo obtener el usuario.");
      return;
    }

    const plan = document.getElementById("seleccionarPlan").value;

    const { data, error } = await db.functions.invoke(
      "crear-suscripcion",
      {
        body: {
         email: "test_user_3490472990773282714@testuser.com",
          plan: plan,
          comercio_id: comercioActual.id
        }
      }
    );

    if (error) {
      console.error("Error al crear suscripción:", error);
      alert("No se pudo iniciar la suscripción.");
      return;
    }

    if (!data?.init_point) {
      console.error("Respuesta inesperada:", data);
      alert("Mercado Pago no devolvió el enlace de pago.");
      return;
    }

    window.location.href = data.init_point;
  });