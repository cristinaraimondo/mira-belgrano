
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

// Usá la misma clave pública que tenés en organizacion.js
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function iniciarPanelInstitucion() {
  const bienvenida = document.querySelector(".panelBienvenida");
  const opciones = document.querySelector(".panelOpciones");

  // Ocultar las opciones hasta verificar el acceso
  opciones.hidden = true;

  const { data: { user }, error: authError } =
    await db.auth.getUser();

  if (authError || !user) {
    bienvenida.textContent =
      "Iniciá sesión para acceder al panel de tu institución.";
    return;
  }

  const { data: institucion, error } = await db
    .from("organizaciones")
    .select("id, nombre, usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error al consultar la institución:", error);
    bienvenida.textContent =
      "No se pudo verificar el acceso a tu institución.";
    return;
  }

  if (!institucion) {
    bienvenida.textContent =
      "Tu cuenta todavía no tiene una institución asignada.";
    return;
  }

  bienvenida.textContent =
    `Bienvenido al panel de ${institucion.nombre}`;

  opciones.hidden = false;
  crearRifa(institucion, user);
  cargarHistorialCobros(institucion.id);
  cargarRifasInstitucion(institucion.id);
  // Mostrar y cargar los datos de cobro de la institución
const seccionCobros = document.getElementById("seccionCobros");
const formularioCobros = document.getElementById("formularioCobros");
const mensajeCobros = document.getElementById("mensajeCobros");
const guardarCobros = document.getElementById("guardarCobros");

const { data: cobros, error: errorCobros } = await db
  .from("organizaciones_cobros")
.select("titular, alias, cvu, confirmado, aprobado_admin")
  .eq("organizacion_id", institucion.id)
  .maybeSingle();

if (errorCobros) {
  console.error("Error al cargar los cobros:", errorCobros);
  mensajeCobros.textContent = "No se pudieron cargar los datos.";
} else {
  document.getElementById("cobroTitular").value = cobros?.titular || "";
  document.getElementById("cobroAlias").value = cobros?.alias || "";
  document.getElementById("cobroCvu").value = cobros?.cvu || "";

  const confirmarCobros = document.getElementById("confirmarCobros");
const estadoCobros = document.getElementById("estadoCobros");

if (cobros?.confirmado) {
  // Los datos ya fueron confirmados.
  document.getElementById("cobroTitular").disabled = true;
  document.getElementById("cobroAlias").disabled = true;
  document.getElementById("cobroCvu").disabled = true;

  guardarCobros.disabled = true;
  confirmarCobros.disabled = true;

  estadoCobros.textContent = cobros.aprobado_admin
    ? "✅ Datos de cobro aprobados por Mirá Belgrano."
    : "🔒 Datos confirmados. Pendientes de aprobación.";
} else {
  guardarCobros.disabled = false;
  confirmarCobros.disabled = true;

  estadoCobros.textContent =
    "Podés corregir tus datos antes de confirmarlos.";
}
}
// Confirmación definitiva de datos bancarios
if (cobros && !cobros.confirmado) {
  confirmarCobros.disabled = false;
}

confirmarCobros.addEventListener("click", async () => {
  const acepta = window.confirm(
    "¿Confirmás que el titular, alias y CVU son correctos?\n\n" +
    "Una vez confirmados, no podrás modificarlos sin autorización de Mirá Belgrano."
  );

  if (!acepta) return;

  confirmarCobros.disabled = true;
  guardarCobros.disabled = true;
  mensajeCobros.textContent = "Confirmando datos...";

  const { data, error } = await db.rpc("confirmar_datos_cobro", {
    p_organizacion_id: institucion.id
  });

  if (error || data !== true) {
    console.error("Error al confirmar:", error);
    mensajeCobros.textContent =
      "No se pudieron confirmar los datos. Verificá que estén guardados.";
    confirmarCobros.disabled = false;
    guardarCobros.disabled = false;
    return;
  }

  ["cobroTitular", "cobroAlias", "cobroCvu"].forEach(id => {
    document.getElementById(id).disabled = true;
  });

  estadoCobros.textContent =
    "🔒 Datos confirmados. Pendientes de aprobación administrativa.";

  mensajeCobros.textContent = "✓ Datos confirmados correctamente.";
});
// Solicitudes de corrección de datos bancarios
const seccionSolicitudCobros =
  document.getElementById("seccionSolicitudCobros");

const abrirSolicitudCobros =
  document.getElementById("abrirSolicitudCobros");

const formularioSolicitudCobros =
  document.getElementById("formularioSolicitudCobros");

// Mostrar la opción solo si los datos están confirmados
if (cobros?.confirmado) {
  seccionSolicitudCobros.hidden = false;
}

abrirSolicitudCobros.addEventListener("click", () => {
  formularioSolicitudCobros.hidden =
    !formularioSolicitudCobros.hidden;

  if (!formularioSolicitudCobros.hidden) {
    document.getElementById("solicitudTitular").value =
      cobros?.titular || "";

    document.getElementById("solicitudAlias").value =
      cobros?.alias || "";

    document.getElementById("solicitudCvu").value =
      cobros?.cvu || "";
  }
});
const enviarSolicitud = document.getElementById("enviarSolicitudCobros");
// Comprobar si existe una solicitud pendiente
const { data: solicitudPendiente, error: errorPendiente } = await db
  .from("organizaciones_cobros_solicitudes")
  .select("id, fecha_solicitud")
  .eq("organizacion_id", institucion.id)
  .eq("estado", "pendiente")
  .maybeSingle();

if (errorPendiente) {
  console.error("Error al consultar solicitudes:", errorPendiente);
  abrirSolicitudCobros.disabled = true;
  document.getElementById("mensajeSolicitudCobros").textContent =
    "No se pudo comprobar el estado de las solicitudes.";
} else if (solicitudPendiente) {
  abrirSolicitudCobros.disabled = true;
  document.getElementById("seccionSolicitudCobros").hidden = false;
  document.getElementById("mensajeSolicitudCobros").textContent =
    "⏳ Ya tenés una solicitud pendiente de revisión por Mirá Belgrano.";
}
const mensajeSolicitud = document.getElementById("mensajeSolicitudCobros");

enviarSolicitud.disabled = !!errorPendiente || !!solicitudPendiente;

enviarSolicitud.addEventListener("click", async () => {
  const motivo = document.getElementById("solicitudMotivo").value.trim();
  const titular = document.getElementById("solicitudTitular").value.trim();
  const alias = document.getElementById("solicitudAlias").value.trim();
  const cvu = document.getElementById("solicitudCvu").value.trim();

  if (!motivo || !titular || (!alias && !cvu)) {
    mensajeSolicitud.textContent =
      "Completá el motivo, el titular y un alias o CBU/CVU.";
    return;
  }

  if (cvu && !/^\d{22}$/.test(cvu)) {
    mensajeSolicitud.textContent =
      "El CBU o CVU debe contener exactamente 22 números.";
    return;
  }

  if (
    titular === (cobros?.titular || "") &&
    alias === (cobros?.alias || "") &&
    cvu === (cobros?.cvu || "")
  ) {
    mensajeSolicitud.textContent =
      "Tenés que modificar al menos un dato para solicitar una corrección.";
    return;
  }

  enviarSolicitud.disabled = true;
  mensajeSolicitud.textContent = "Enviando solicitud...";

  const { error } = await db
    .from("organizaciones_cobros_solicitudes")
    .insert({
      organizacion_id: institucion.id,
      motivo,
      titular_solicitado: titular,
      alias_solicitado: alias || null,
      cvu_solicitado: cvu || null
    });

  if (error) {
    console.error("Error al enviar solicitud:", error);
    mensajeSolicitud.textContent =
      "No se pudo enviar la solicitud.";
    enviarSolicitud.disabled = false;
    return;
  }

  mensajeSolicitud.textContent =
    "✓ Solicitud enviada. Pendiente de revisión por Mirá Belgrano.";

  enviarSolicitud.disabled = true;
});
const abrirCobros = document.getElementById("abrirCobros");
// Habilitar el acceso al formulario de rifas
const abrirRifas = document.getElementById("abrirRifas");
const seccionRifas = document.getElementById("seccionRifas");

abrirRifas.disabled = false;

abrirRifas.addEventListener("click", () => {
  seccionRifas.hidden = false;

  seccionRifas.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

abrirCobros.disabled = false;

abrirCobros.addEventListener("click", () => {
  seccionCobros.hidden = false;
  seccionCobros.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

formularioCobros.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const titular = document.getElementById("cobroTitular").value.trim();
  const alias = document.getElementById("cobroAlias").value.trim();
  const cvu = document.getElementById("cobroCvu").value.trim();

  if (!titular || (!alias && !cvu)) {
    mensajeCobros.textContent = "Ingresá un titular y un alias o CVU.";
    return;
  }

  if (cvu && !/^\d{22}$/.test(cvu)) {
    mensajeCobros.textContent = "El CBU o CVU debe tener 22 dígitos.";
    return;
  }

  guardarCobros.disabled = true;
  mensajeCobros.textContent = "Guardando...";

  const { error: errorGuardar } = await db
    .from("organizaciones_cobros")
    .upsert({
      organizacion_id: institucion.id,
      titular,
      alias: alias || null,
      cvu: cvu || null
    }, { onConflict: "organizacion_id" });

  mensajeCobros.textContent = errorGuardar
    ? "No se pudieron guardar los datos."
    : "✓ Datos guardados correctamente.";

  if (errorGuardar) console.error(errorGuardar);

  guardarCobros.disabled = false;
});
}
// Vista previa de la fotografía del premio
const rifaImagen = document.getElementById("rifaImagen");
const rifaImagenVistaPrevia = document.getElementById("rifaImagenVistaPrevia");

let imagenTemporal = null;

rifaImagen.addEventListener("change", () => {
  const archivo = rifaImagen.files[0];

  if (imagenTemporal) {
    URL.revokeObjectURL(imagenTemporal);
    imagenTemporal = null;
  }

  rifaImagenVistaPrevia.hidden = true;
  rifaImagenVistaPrevia.removeAttribute("src");

  if (!archivo) return;

  const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];

  if (!formatosPermitidos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
    alert("Seleccioná una imagen JPG, PNG o WebP de hasta 5 MB.");
    rifaImagen.value = "";
    return;
  }

  imagenTemporal = URL.createObjectURL(archivo);
  rifaImagenVistaPrevia.src = imagenTemporal;
  rifaImagenVistaPrevia.hidden = false;
});
async function crearRifa(institucion, user) {
  const formulario = document.getElementById("formularioRifas");
  const boton = document.getElementById("guardarRifa");
  const mensaje = document.getElementById("mensajeRifas");

  boton.disabled = false;

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const titulo = document.getElementById("rifaTitulo").value.trim();
    const premio = document.getElementById("rifaPremio").value.trim();
    const precio = Number(document.getElementById("rifaPrecio").value);
    const cantidad = Number(document.getElementById("rifaCantidad").value);
    const fecha = document.getElementById("rifaFecha").value;
    const archivo = document.getElementById("rifaImagen").files[0];

    if (!titulo || !premio || precio <= 0 ||
        !Number.isInteger(cantidad) || cantidad < 1 ||
        cantidad > 1000 || !fecha) {
      mensaje.textContent = "Revisá los datos de la rifa.";
      return;
    }

    if (archivo && (
      !["image/jpeg", "image/png", "image/webp"].includes(archivo.type) ||
      archivo.size > 5 * 1024 * 1024
    )) {
      mensaje.textContent = "La imagen debe ser JPG, PNG o WebP, de hasta 5 MB.";
      return;
    }

    boton.disabled = true;
    mensaje.textContent = "Creando rifa...";

    let imagenUrl = null;
    let rutaImagen = null;

    try {
      if (archivo) {
        const extension = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp"
        }[archivo.type];

        rutaImagen = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: errorImagen } = await db.storage
          .from("premios-rifas")
          .upload(rutaImagen, archivo, {
            contentType: archivo.type,
            upsert: false
          });

        if (errorImagen) throw errorImagen;

        const { data } = db.storage
          .from("premios-rifas")
          .getPublicUrl(rutaImagen);

        imagenUrl = data.publicUrl;
      }

      const { error: errorRifa } = await db
        .from("rifas_solidarias")
        .insert({
          organizacion_id: institucion.id,
          titulo,
          premio,
          precio,
          cantidad_numeros: cantidad,
          fecha_sorteo: fecha,
          imagen_premio_url: imagenUrl,
          activa: false
        });

      if (errorRifa) throw errorRifa;

      mensaje.textContent = "✓ Rifa creada correctamente. Pendiente de publicación.";
      formulario.reset();

      document.getElementById("rifaImagenVistaPrevia").hidden = true;

    } catch (error) {
      console.error("Error al crear rifa:", error);
      mensaje.textContent = "No se pudo crear la rifa.";

      // Evitar dejar imágenes sin una rifa asociada.
      if (rutaImagen) {
        await db.storage.from("premios-rifas").remove([rutaImagen]);
      }
    } finally {
      boton.disabled = false;
    }
  });
}
async function cargarRifasInstitucion(institucionId) {
  const contenedor = document.getElementById("listaRifasInstitucion");

  const { data: rifas, error } = await db
    .from("rifas_solidarias")
    .select("id, titulo, premio, precio, cantidad_numeros, fecha_sorteo, imagen_premio_url, activa")
    .eq("organizacion_id", institucionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar rifas:", error);
    contenedor.textContent = "No se pudieron cargar las rifas.";
    return;
  }

  contenedor.replaceChildren();

  if (!rifas.length) {
    contenedor.textContent = "Todavía no creaste ninguna rifa.";
    return;
  }

  rifas.forEach(rifa => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "panelOpcion";
    tarjeta.style.marginTop = "15px";

    const titulo = document.createElement("h3");
    titulo.textContent = rifa.titulo;
    tarjeta.appendChild(titulo);

    if (rifa.imagen_premio_url) {
      const imagen = document.createElement("img");
      imagen.src = rifa.imagen_premio_url;
      imagen.alt = `Premio de ${rifa.titulo}`;
      imagen.style.cssText =
        "max-width:220px;width:100%;border-radius:12px;display:block;margin:12px 0;";
      tarjeta.appendChild(imagen);
    }

    const detalle = document.createElement("p");
    detalle.textContent =
      `Premio: ${rifa.premio} | Precio: $${rifa.precio} | ` +
      `Números: ${rifa.cantidad_numeros}`;
    tarjeta.appendChild(detalle);

    const fecha = document.createElement("p");
    fecha.textContent = `Sorteo: ${rifa.fecha_sorteo || "Sin fecha"}`;
    tarjeta.appendChild(fecha);

    const estado = document.createElement("p");
    estado.textContent = rifa.activa
      ? "🟢 Rifa activa"
      : "🟡 Pendiente de publicación";
    tarjeta.appendChild(estado);
    // Botón para activar o pausar la rifa
const botonEstado = document.createElement("button");

botonEstado.type = "button";
botonEstado.textContent = rifa.activa
  ? "⏸️ Pausar rifa"
  : "▶️ Activar rifa";

botonEstado.style.marginTop = "10px";

botonEstado.addEventListener("click", async () => {
  const activar = !rifa.activa;

  if (activar && rifas.some(otra =>
    otra.id !== rifa.id && otra.activa
  )) {
    alert("Ya tenés una rifa activa. Primero debés pausarla.");
    return;
  }

  if (!confirm(
    activar
      ? "¿Querés activar esta rifa?"
      : "¿Querés pausar esta rifa?"
  )) return;

  botonEstado.disabled = true;

  const { data, error } = await db
    .from("rifas_solidarias")
    .update({ activa: activar })
    .eq("id", rifa.id)
    .eq("organizacion_id", institucionId)
    .select("id");

  if (error || !data?.length) {
    console.error("Error al cambiar estado:", error);

    alert(
      error?.code === "23505"
        ? "Ya existe una rifa activa para esta institución."
        : "No se pudo cambiar el estado de la rifa."
    );

    botonEstado.disabled = false;
    return;
  }

  await cargarRifasInstitucion(institucionId);
});

tarjeta.appendChild(botonEstado);

    contenedor.appendChild(tarjeta);
  });
}
async function cargarHistorialCobros(institucionId) {
  const contenedor = document.getElementById("listaHistorialCobros");

  const { data: historial, error } = await db
    .from("organizaciones_cobros_historial")
    .select("*")
    .eq("organizacion_id", institucionId)
    .order("fecha_modificacion", { ascending: false });

  if (error) {
    console.error("Error al cargar historial:", error);
    contenedor.textContent = "No se pudo cargar el historial.";
    return;
  }

  contenedor.replaceChildren();

  if (!historial.length) {
    contenedor.textContent = "Todavía no se registraron modificaciones.";
    return;
  }

  historial.forEach(cambio => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "panelOpcion";
    tarjeta.style.marginTop = "15px";

    const fecha = document.createElement("strong");
    fecha.textContent = new Date(
      cambio.fecha_modificacion
    ).toLocaleString("es-AR");

    tarjeta.appendChild(fecha);

    const campos = [
      ["Titular", "titular"],
      ["Alias", "alias"],
      ["CBU/CVU", "cvu"]
    ];

    campos.forEach(([etiqueta, campo]) => {
      const anterior = cambio[`${campo}_anterior`] || "Sin registrar";
      const nuevo = cambio[`${campo}_nuevo`] || "Sin registrar";

      if (anterior !== nuevo) {
        const detalle = document.createElement("p");
        detalle.textContent =
          `${etiqueta}: ${anterior} → ${nuevo}`;

        tarjeta.appendChild(detalle);
      }
    });

    contenedor.appendChild(tarjeta);
  });
}
iniciarPanelInstitucion();
