
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";
const ADMIN_ID = "7de52da5-e675-4709-8e43-23c7e0a0587b";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
let eventos = [];
let imagenActual = null;

async function verificarAcceso() {
  const { data: { user }, error } = await db.auth.getUser();

  if (error || !user || user.id !== ADMIN_ID) {
    $("estado").textContent = "⛔ Acceso exclusivo para administración.";
    return false;
  }

  $("estado").hidden = true;
  $("adminContenido").hidden = false;
  return true;
}

function convertirWebP(archivo) {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    const url = URL.createObjectURL(archivo);

    imagen.onload = () => {
      const escala = Math.min(1, 1400 / Math.max(imagen.width, imagen.height));
      const ancho = Math.round(imagen.width * escala);
      const alto = Math.round(imagen.height * escala);

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(imagen, 0, 0, ancho, alto);

      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);

        if (!blob) {
          reject(new Error("No se pudo convertir la imagen."));
          return;
        }

        if (blob.type !== "image/webp") {
          reject(new Error("Este navegador no permite generar WebP."));
          return;
        }

        resolve(blob);
      }, "image/webp", 0.8);
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo abrir la imagen."));
    };

    imagen.src = url;
  });
}

async function subirImagen(archivo) {
  const blob = await convertirWebP(archivo);
  const path = `${crypto.randomUUID()}.webp`;

  const { error } = await db.storage
    .from("eventos")
    .upload(path, blob, {
      contentType: "image/webp",
      upsert: false
    });

  if (error) throw error;

  const { data } = db.storage.from("eventos").getPublicUrl(path);

  return { path, url: data.publicUrl };
}

async function eliminarImagen(path) {
  if (!path) return;

  const { error } = await db.storage
    .from("eventos")
    .remove([path]);

  if (error) throw error;
}

function limpiarFormulario() {
  $("formEvento").reset();
  $("eventoId").value = "";
  $("tituloFormulario").textContent = "Publicar evento";
  $("guardar").textContent = "Publicar evento";
  $("cancelar").hidden = true;
  imagenActual = null;
}

async function cargarEventos() {
  const { data, error } = await db
    .from("eventos")
    .select("*")
    .order("fecha_inicio", { ascending: true });

  if (error) {
    console.error(error);
    $("listaEventosAdmin").textContent = "No se pudieron cargar los eventos.";
    return;
  }

  eventos = data || [];
  const lista = $("listaEventosAdmin");
  lista.replaceChildren();

  if (!eventos.length) {
    lista.textContent = "Todavía no hay eventos cargados.";
    return;
  }

  eventos.forEach(evento => {
    const item = document.createElement("div");
    item.className = "eventoItem";

    const titulo = document.createElement("h3");
    titulo.textContent = evento.titulo;

    const datos = document.createElement("p");
    datos.textContent =
      `${evento.fecha_inicio} | ${evento.horario || "Horario a confirmar"} | ${evento.lugar || ""}`;

    item.append(titulo, datos);

    if (evento.imagen_url) {
      const img = document.createElement("img");
      img.src = evento.imagen_url;
      img.alt = evento.titulo;
      img.loading = "lazy";
      item.appendChild(img);
    }

    const acciones = document.createElement("div");
    acciones.style.marginTop = "12px";

    const editar = document.createElement("button");
    editar.className = "boton";
    editar.textContent = "Editar";
    editar.type = "button";
    editar.addEventListener("click", () => editarEvento(evento));

    const eliminar = document.createElement("button");
    eliminar.className = "boton secundario";
    eliminar.textContent = "Eliminar";
    eliminar.type = "button";
    eliminar.style.marginLeft = "10px";
    eliminar.addEventListener("click", () => eliminarEvento(evento));

    acciones.append(editar, eliminar);
    item.appendChild(acciones);
    lista.appendChild(item);
  });
}

function editarEvento(evento) {
  $("eventoId").value = evento.id;
  $("titulo").value = evento.titulo;
  $("fechaInicio").value = evento.fecha_inicio;
  $("fechaFin").value = evento.fecha_fin;
  $("horario").value = evento.horario || "";
  $("lugar").value = evento.lugar || "";
  $("descripcion").value = evento.descripcion || "";
  $("enlace").value = evento.enlace || "";
  $("imagen").value = "";

  imagenActual = evento.imagen_path;

  $("tituloFormulario").textContent = "Editar evento";
  $("guardar").textContent = "Guardar cambios";
  $("cancelar").hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarEvento(evento) {
  if (!confirm(`¿Eliminar definitivamente "${evento.titulo}"?`)) return;

  const { error } = await db
    .from("eventos")
    .delete()
    .eq("id", evento.id);

  if (error) {
    alert("No se pudo eliminar el evento.");
    console.error(error);
    return;
  }

  try {
    await eliminarImagen(evento.imagen_path);
  } catch (errorImagen) {
    console.error(errorImagen);
    alert("El evento se eliminó, pero no se pudo borrar su imagen.");
  }

  limpiarFormulario();
  await cargarEventos();
}

$("formEvento").addEventListener("submit", async e => {
  e.preventDefault();

  const boton = $("guardar");
  boton.disabled = true;
  boton.textContent = "Guardando...";

  let nuevaImagen = null;

  try {
    const id = $("eventoId").value;
    const archivo = $("imagen").files[0];

    if ($("fechaFin").value < $("fechaInicio").value) {
      throw new Error("La fecha de finalización no puede ser anterior al inicio.");
    }

    if (archivo) {
      nuevaImagen = await subirImagen(archivo);
    }

    const datos = {
      titulo: $("titulo").value.trim(),
      fecha_inicio: $("fechaInicio").value,
      fecha_fin: $("fechaFin").value,
      horario: $("horario").value.trim(),
      lugar: $("lugar").value.trim(),
      descripcion: $("descripcion").value.trim(),
      enlace: $("enlace").value.trim() || null
    };

    if (nuevaImagen) {
      datos.imagen_url = nuevaImagen.url;
      datos.imagen_path = nuevaImagen.path;
    }

    let error;

    if (id) {
      ({ error } = await db.from("eventos").update(datos).eq("id", id));
    } else {
      ({ error } = await db.from("eventos").insert(datos));
    }

    if (error) throw error;

    if (nuevaImagen && imagenActual) {
      try {
        await eliminarImagen(imagenActual);
      } catch (errorImagen) {
        console.error("No se pudo borrar la imagen anterior:", errorImagen);
      }
    }

    alert(id ? "Evento actualizado." : "Evento publicado.");
    limpiarFormulario();
    await cargarEventos();

  } catch (error) {
    console.error(error);

    if (nuevaImagen) {
      try {
        await eliminarImagen(nuevaImagen.path);
      } catch (errorLimpieza) {
        console.error(errorLimpieza);
      }
    }

    alert(error.message || "No se pudo guardar el evento.");

  } finally {
    boton.disabled = false;
    boton.textContent = $("eventoId").value
      ? "Guardar cambios"
      : "Publicar evento";
  }
});

$("cancelar").addEventListener("click", limpiarFormulario);

async function iniciar() {
  if (await verificarAcceso()) {
    await cargarEventos();
  }
}

iniciar();
