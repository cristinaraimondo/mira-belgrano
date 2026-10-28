
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
.select(`
  id,
  nombre,
  usuario_id,
  descripcion,
  logo_url,
  telefono,
  whatsapp,
  email,
  direccion,
  sitio_web,
  enlace_donacion,
    donacion_alias,
  donacion_titular,
  portada_url,
  color_principal,
  estilo_logo
`)
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
  // Mostrar la personalización guardada
document.getElementById("colorInstitucion").value =
  institucion.color_principal || "#713ba5";

document.getElementById("estiloLogo").value =
  institucion.estilo_logo || "grande";

// Mostrar la portada existente, si la institución ya tiene una
if (institucion.portada_url) {
  const vistaPrevia = document.getElementById("vistaPreviaPortada");
  vistaPrevia.src = institucion.portada_url;
  vistaPrevia.hidden = false;
}
const formularioPersonalizacion = document.getElementById(
  "formularioPersonalizacion"
);

formularioPersonalizacion?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const boton = document.getElementById("guardarPersonalizacion");
  const mensaje = document.getElementById("mensajePersonalizacion");

  boton.disabled = true;
  mensaje.textContent = "Guardando diseño...";

  try {
    const cambios = {
      color_principal: document.getElementById("colorInstitucion").value,
      estilo_logo: document.getElementById("estiloLogo").value
    };

    // Si seleccionó una nueva portada, subir la versión optimizada
    if (document.getElementById("portadaInstitucion").files.length > 0) {
      if (!portadaOptimizada) {
        throw new Error("La portada todavía no está lista. Volvé a seleccionarla.");
      }

      const ruta = `${institucion.id}/portada-${crypto.randomUUID()}.webp`;

      const { error: errorSubida } = await db.storage
        .from("portadas-instituciones")
        .upload(ruta, portadaOptimizada, {
          contentType: "image/webp",
          upsert: false
        });

      if (errorSubida) throw errorSubida;

      const { data } = db.storage
        .from("portadas-instituciones")
        .getPublicUrl(ruta);

      cambios.portada_url = data.publicUrl;
    }

    const { error: errorGuardado } = await db
      .from("organizaciones")
      .update(cambios)
      .eq("id", institucion.id)
      .eq("usuario_id", user.id)
      .select("id")
      .single();

    if (errorGuardado) throw errorGuardado;

    Object.assign(institucion, cambios);

    mensaje.textContent = "✅ Diseño guardado correctamente.";
  } catch (error) {
    console.error("Error al guardar diseño:", error);
    mensaje.textContent = "❌ " + error.message;
  } finally {
    boton.disabled = false;
  }
});
  
async function cargarRevistasInstitucion() {
  const lista = document.getElementById("listaRevistasInstitucion");
  lista.textContent = "Cargando revistas...";

  const { data: revistas, error } = await db
    .from("revistas_instituciones")
    .select("id, titulo, url, portada_url, publicada")
    .eq("organizacion_id", institucion.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar revistas:", error);
    lista.textContent = "No se pudieron cargar las revistas.";
    return;
  }

  lista.replaceChildren();

  if (!revistas?.length) {
    lista.textContent = "Todavía no hay revistas publicadas.";
    return;
  }

  revistas.forEach(revista => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "revistaTarjetaPanel";

    if (revista.portada_url) {
      const imagen = document.createElement("img");
      imagen.src = revista.portada_url;
      imagen.alt = `Portada de ${revista.titulo}`;
      imagen.loading = "lazy";
      imagen.style.cssText =
        "width:110px;max-width:100%;border-radius:10px;";
      tarjeta.appendChild(imagen);
    }

    const titulo = document.createElement("h4");
    titulo.textContent = revista.titulo;
    tarjeta.appendChild(titulo);

    const enlace = document.createElement("a");
    enlace.textContent = "Ver revista";
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";

    try {
      const url = new URL(revista.url);
      if (url.protocol === "https:" || url.protocol === "http:") {
        enlace.href = url.href;
        tarjeta.appendChild(enlace);
      }
    } catch {
      console.warn("Enlace inválido:", revista.id);
    }

const botonEditar = document.createElement("button");
botonEditar.type = "button";
botonEditar.textContent = "✏️ Editar revista";
botonEditar.style.marginTop = "12px";
botonEditar.style.marginRight = "10px";

botonEditar.addEventListener("click", () => {
  document.getElementById("revistaIdEditar").value = revista.id;
  document.getElementById("revistaTitulo").value = revista.titulo;
  document.getElementById("revistaUrl").value = revista.url;

  const portada = document.getElementById("revistaPortada");
  portada.value = "";
  portada.required = false;

  const guardar = document.getElementById("guardarRevista");
  guardar.textContent = "Guardar cambios";
  document.getElementById("cancelarEdicionRevista").hidden = false;

  document.getElementById("mensajeRevistas").textContent =
    "Estás editando una revista. Podés conservar la portada actual.";

  document.getElementById("formularioRevistas").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

tarjeta.appendChild(botonEditar);

const botonEliminar = document.createElement("button");
botonEliminar.type = "button";
botonEliminar.textContent = "🗑️ Eliminar revista";
botonEliminar.style.marginTop = "12px";

botonEliminar.addEventListener("click", async () => {
  const confirmar = confirm(
    `¿Seguro que querés eliminar la revista "${revista.titulo}"?`
  );

  if (!confirmar) return;

  botonEliminar.disabled = true;
  botonEliminar.textContent = "Eliminando...";

  const { error } = await db
    .from("revistas_instituciones")
    .delete()
    .eq("id", revista.id)
    .eq("organizacion_id", institucion.id);

  if (error) {
    console.error("Error al eliminar revista:", error);
    alert("No se pudo eliminar la revista.");
    botonEliminar.disabled = false;
    botonEliminar.textContent = "🗑️ Eliminar revista";
    return;
  }

  await cargarRevistasInstitucion();
});

tarjeta.appendChild(botonEliminar);

    lista.appendChild(tarjeta);
  });
}

await cargarRevistasInstitucion();

  
  // Publicar revistas digitales
  const formularioRevistas = document.getElementById("formularioRevistas");
  const guardarRevista = document.getElementById("guardarRevista");
  const mensajeRevistas = document.getElementById("mensajeRevistas");
  const cancelarEdicionRevista =
  document.getElementById("cancelarEdicionRevista");

cancelarEdicionRevista.addEventListener("click", () => {
  formularioRevistas.reset();

  document.getElementById("revistaIdEditar").value = "";
  document.getElementById("revistaPortada").required = true;

  guardarRevista.textContent = "Publicar revista";
  cancelarEdicionRevista.hidden = true;
  cancelarEdicionRevista.hidden = true;

  mensajeRevistas.textContent = "";
});

  guardarRevista.disabled = false;


formularioRevistas.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const campoId = document.getElementById("revistaIdEditar");
  const revistaId = campoId.value.trim();
  const editando = revistaId !== "";

  const titulo = document.getElementById("revistaTitulo").value.trim();
  const urlTexto = document.getElementById("revistaUrl").value.trim();
  const campoPortada = document.getElementById("revistaPortada");
  const archivo = campoPortada.files[0];

  if (!titulo || (!editando && !archivo)) {
    mensajeRevistas.textContent =
      "Completá el título y seleccioná una portada.";
    return;
  }

  let url;

  try {
    url = new URL(urlTexto);

    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("Enlace inválido");
    }
  } catch {
    mensajeRevistas.textContent =
      "Ingresá un enlace válido de la revista.";
    return;
  }

  guardarRevista.disabled = true;
  mensajeRevistas.textContent = editando
    ? "Guardando cambios..."
    : "Publicando revista...";

  try {
    let portadaUrl = null;

    // Solo subir una portada cuando se selecciona un archivo
    if (archivo) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(archivo.type)
      ) {
        throw new Error("La portada debe ser JPG, PNG o WebP.");
      }

      if (archivo.size > 10 * 1024 * 1024) {
        throw new Error("La imagen original supera los 10 MB.");
      }

      const imagen = await createImageBitmap(archivo);

      const escala = Math.min(
        1,
        800 / imagen.width,
        1100 / imagen.height
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imagen.width * escala));
      canvas.height = Math.max(1, Math.round(imagen.height * escala));

      const contexto = canvas.getContext("2d");

      if (!contexto) {
        imagen.close();
        throw new Error("No se pudo procesar la imagen.");
      }

      contexto.drawImage(
        imagen,
        0,
        0,
        canvas.width,
        canvas.height
      );

      imagen.close();

      const portada = await new Promise((resolve, reject) => {
        canvas.toBlob(
          blob => blob
            ? resolve(blob)
            : reject(new Error("No se pudo convertir la portada.")),
          "image/webp",
          0.82
        );
      });

      if (portada.size > 2 * 1024 * 1024) {
        throw new Error("La portada supera los 2 MB.");
      }

      const ruta = `${user.id}/${crypto.randomUUID()}.webp`;

      const { error: errorSubida } = await db.storage
        .from("portadas-revistas")
        .upload(ruta, portada, {
          contentType: "image/webp",
          upsert: false
        });

      if (errorSubida) throw errorSubida;

      const { data: archivoPublico } = db.storage
        .from("portadas-revistas")
        .getPublicUrl(ruta);

      portadaUrl = archivoPublico.publicUrl;
    }

    if (editando) {
      // Modificar la revista existente
      const cambios = {
        titulo,
        url: url.href
      };

      // Si no se seleccionó imagen, conservar la portada anterior
      if (portadaUrl) {
        cambios.portada_url = portadaUrl;
      }

      const { data: actualizada, error } = await db
        .from("revistas_instituciones")
        .update(cambios)
        .eq("id", revistaId)
        .eq("organizacion_id", institucion.id)
        .select("id");

      if (error) throw error;

      if (!actualizada?.length) {
        throw new Error("No se encontró la revista para actualizar.");
      }

    } else {
      // Publicar una revista nueva
      const { error } = await db
        .from("revistas_instituciones")
        .insert({
          organizacion_id: institucion.id,
          titulo,
          url: url.href,
          portada_url: portadaUrl,
          publicada: true
        });

      if (error) throw error;
    }

    formularioRevistas.reset();
    campoId.value = "";
    campoPortada.required = true;

    guardarRevista.textContent = "Publicar revista";

    mensajeRevistas.textContent = editando
      ? "✅ Revista actualizada correctamente."
      : "✅ Revista publicada correctamente.";

    await cargarRevistasInstitucion();

  } catch (error) {
    console.error("Error al guardar revista:", error);

    mensajeRevistas.textContent =
      `No se pudo guardar la revista: ${error.message}`;

  } finally {
    guardarRevista.disabled = false;
  }
});


  
const formularioMiInstitucion =
  document.getElementById("formularioMiInstitucion");

const guardarMiInstitucion =
  document.getElementById("guardarMiInstitucion");

const mensajeMiInstitucion =
  document.getElementById("mensajeMiInstitucion");

guardarMiInstitucion.disabled = false;

formularioMiInstitucion.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  guardarMiInstitucion.disabled = true;
  mensajeMiInstitucion.textContent = "Guardando cambios...";

  const cambios = {
    descripcion: document.getElementById("institucionDescripcion").value.trim(),
    telefono: document.getElementById("institucionTelefono").value.trim() || null,
    whatsapp: document.getElementById("institucionWhatsapp").value.trim() || null,
    email: document.getElementById("institucionEmail").value.trim() || null,
    direccion: document.getElementById("institucionDireccion").value.trim() || null,
    sitio_web: document.getElementById("institucionSitioWeb").value.trim() || null
  
  };

  try {
    const { data, error } = await db
      .from("organizaciones")
      .update(cambios)
      .eq("id", institucion.id)
      .eq("usuario_id", user.id)
      .select("id")
      .single();

    if (error) throw error;
    
const archivoLogo =
  document.getElementById("institucionLogo").files[0];

if (archivoLogo) {
  const logoWebP = await prepararLogoWebP(archivoLogo);

  const rutaLogo =
    `${user.id}/logo-${crypto.randomUUID()}.webp`;

  const { error: errorLogo } = await db.storage
    .from("organizaciones")
    .upload(rutaLogo, logoWebP, {
      contentType: "image/webp",
      upsert: false
    });

  if (errorLogo) throw errorLogo;

  const { data: urlLogo } = db.storage
    .from("organizaciones")
    .getPublicUrl(rutaLogo);

  const { error: errorActualizarLogo } = await db
    .from("organizaciones")
    .update({ logo_url: urlLogo.publicUrl })
    .eq("id", institucion.id)
    .eq("usuario_id", user.id);

  if (errorActualizarLogo) throw errorActualizarLogo;

  const logoActual =
    document.getElementById("institucionLogoActual");

  logoActual.src = urlLogo.publicUrl;
  logoActual.hidden = false;

  document.getElementById("institucionLogo").value = "";
}


    if (!data) {
      throw new Error("No se pudo actualizar la institución.");
    }

    mensajeMiInstitucion.textContent =
      "✅ Los datos de tu institución se guardaron correctamente.";

  } catch (error) {
    console.error("Error al guardar institución:", error);
    mensajeMiInstitucion.textContent =
      "No se pudieron guardar los cambios: " + error.message;
  } finally {
    guardarMiInstitucion.disabled = false;
  }
});

const btnMiInstitucion = document.getElementById("abrirMiInstitucion");
const seccionMiInstitucion = document.getElementById("seccionMiInstitucion");

document.getElementById("institucionNombre").value =
  institucion.nombre || "";

document.getElementById("institucionDescripcion").value =
  institucion.descripcion || "";

document.getElementById("institucionTelefono").value =
  institucion.telefono || "";

document.getElementById("institucionWhatsapp").value =
  institucion.whatsapp || "";

document.getElementById("institucionEmail").value =
  institucion.email || "";

document.getElementById("institucionDireccion").value =
  institucion.direccion || "";

document.getElementById("institucionSitioWeb").value =
  institucion.sitio_web || "";

document.getElementById("institucionDonacion").value =
  institucion.enlace_donacion || "";
  document.getElementById("institucionDonacionAlias").value =
  institucion.donacion_alias || "";

document.getElementById("institucionDonacionTitular").value =
  institucion.donacion_titular || "";

const logoActual = document.getElementById("institucionLogoActual");

if (institucion.logo_url) {
  logoActual.src = institucion.logo_url;
  logoActual.hidden = false;
}

btnMiInstitucion.addEventListener("click", () => {
  seccionMiInstitucion.hidden = !seccionMiInstitucion.hidden;

  if (!seccionMiInstitucion.hidden) {
    seccionMiInstitucion.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

  configurarPublicacionHistorias(institucion);
  cargarHistoriasInstitucion(institucion.id);
  crearRifa(institucion, user);
  cargarHistorialCobros(institucion.id);
  cargarRifasInstitucion(institucion.id);
  // Mostrar los pagos de la institución
const abrirPagos = document.getElementById("abrirPagos");
const seccionPagos = document.getElementById("seccionPagos");
const listaPagos = document.getElementById("listaPagosInstitucion");

abrirPagos.addEventListener("click", async () => {
  seccionPagos.hidden = false;
  listaPagos.textContent = "Cargando pagos...";

  const { data: compras, error: errorPagos } = await db
    .rpc("consultar_compras_institucion");

  if (errorPagos) {
    console.error("Error al consultar pagos:", errorPagos);
    listaPagos.textContent = "No se pudieron cargar los pagos.";
    return;
  }

  listaPagos.replaceChildren();

  if (!compras?.length) {
    listaPagos.textContent = "Todavía no hay reservas registradas.";
    return;
  }

  compras.forEach(compra => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "panelOpcion";

    const detalle = document.createElement("p");
    detalle.textContent =
      `🎟️ ${compra.rifa_titulo} | Número ${String(compra.numero).padStart(2, "0")}
      | Comprador: ${compra.nombre_comprador}
      | WhatsApp: ${compra.whatsapp}
      | Estado: ${compra.estado}`;

    tarjeta.appendChild(detalle);
    // Contactar al comprador por WhatsApp
const telefonoComprador = String(compra.whatsapp || "")
  .replace(/\D/g, "");

if (telefonoComprador) {
  const botonWhatsapp = document.createElement("a");

  const numero = String(compra.numero).padStart(2, "0");

  const textoWhatsapp =
    `Hola ${compra.nombre_comprador}, te contactamos desde la institución ` +
    `por tu reserva del número ${numero} de la rifa "${compra.rifa_titulo}". ` +
   compra.estado === "pagado"
  ? `Queremos comunicarnos con vos para agradecerte tu colaboración y resolver cualquier consulta.`
  : `Queremos comunicarnos con vos para coordinar el pago o resolver cualquier consulta.`;

  botonWhatsapp.href =
    `https://wa.me/${telefonoComprador}?text=${encodeURIComponent(textoWhatsapp)}`;

  botonWhatsapp.target = "_blank";
  botonWhatsapp.rel = "noopener noreferrer";
  botonWhatsapp.textContent = "💬 Contactar comprador";
  botonWhatsapp.className = "botonWhatsappComprador";
botonWhatsapp.style.cssText = `
  display: inline-block;
  background: #25D366;
  color: white;
  padding: 9px 15px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin: 8px 5px 8px 0;
`;
  tarjeta.appendChild(botonWhatsapp);
}
// Avisar al ganador por WhatsApp
if (
  compra.estado === "pagado" &&
  compra.numero_ganador !== null &&
  Number(compra.numero) === Number(compra.numero_ganador)
) {
  const telefonoGanador = String(compra.whatsapp || "")
    .replace(/\D/g, "");

  if (telefonoGanador) {
    const botonGanador = document.createElement("a");

    const mensajeGanador =
      `🎉 ¡Felicitaciones, ${compra.nombre_comprador}! 🏆\n\n` +
      `Te informamos que tu número ${String(compra.numero).padStart(2, "0")} ` +
      `resultó ganador de la rifa "${compra.rifa_titulo}".\n\n` +
      `🎁 Premio: ${compra.premio}\n\n` +
      `¡Comunicate con nosotros para coordinar la entrega!`;

    botonGanador.href =
      `https://wa.me/${telefonoGanador}?text=${encodeURIComponent(mensajeGanador)}`;

    botonGanador.target = "_blank";
    botonGanador.rel = "noopener noreferrer";
    botonGanador.textContent = "🏆 Avisar al ganador";
    botonGanador.className = "botonWhatsappComprador";
    botonGanador.style.cssText = `
  display: inline-block;
  background: #d4a017;
  color: white;
  padding: 9px 15px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin: 8px 5px 8px 0;
`;

    tarjeta.appendChild(botonGanador);
  }
}
    if (compra.estado === "pendiente") {
  const botonVerificar = document.createElement("button");
  botonVerificar.type = "button";
  botonVerificar.textContent = "💳 Pago informado";

  botonVerificar.addEventListener("click", async () => {
    const confirmar = confirm(
      "¿El comprador informó que realizó el pago? Esto NO confirma que el dinero haya ingresado."
    );

    if (!confirmar) return;

    botonVerificar.disabled = true;

    const { data, error } = await db.rpc(
      "marcar_pago_en_verificacion",
      { p_compra_id: compra.compra_id }
    );

    if (error || data !== true) {
      alert("No se pudo actualizar el pago.");
      botonVerificar.disabled = false;
      return;
    }

    alert("Pago marcado como en verificación.");
    abrirPagos.click();
  });

  tarjeta.appendChild(botonVerificar);
}

if (
  compra.estado === "en_verificacion" ||
  compra.estado === "comprobante_enviado"
) {
  const botonConfirmar = document.createElement("button");
  botonConfirmar.type = "button";
  botonConfirmar.textContent = "✅ Confirmar pago";

  botonConfirmar.addEventListener("click", async () => {
    const confirmar = confirm(
      "¿Verificaste que el dinero ingresó a la cuenta de la institución? Esta acción marcará el número como VENDIDO."
    );

    if (!confirmar) return;

    botonConfirmar.disabled = true;

    const { data, error } = await db.rpc(
      "confirmar_pago_rifa",
      { p_compra_id: compra.compra_id }
    );

    if (error || data !== true) {
      console.error("Error al confirmar pago:", error);
      alert("No se pudo confirmar el pago.");
      botonConfirmar.disabled = false;
      return;
    }

    alert("Pago confirmado. Número vendido.");
    abrirPagos.click();
  });

  tarjeta.appendChild(botonConfirmar);
}

    listaPagos.appendChild(tarjeta);
  });
});
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
   .select("id, titulo, premio, precio, cantidad_numeros, fecha_sorteo, imagen_premio_url, activa, numero_ganador, fecha_resultado")
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
    // Registro del número ganador
if (rifa.numero_ganador !== null) {
  const resultado = document.createElement("p");
  resultado.textContent =
    `🏆 Número ganador: ${String(rifa.numero_ganador).padStart(2, "0")}`;
  resultado.style.fontWeight = "bold";
  tarjeta.appendChild(resultado);

} else if (
  rifa.fecha_sorteo &&
  rifa.fecha_sorteo <= new Date().toLocaleDateString("en-CA")
) {
  const botonGanador = document.createElement("button");
  botonGanador.type = "button";
  botonGanador.textContent = "🏆 Registrar ganador";

  botonGanador.addEventListener("click", async () => {
    const entrada = prompt("Ingresá el número ganador:");

    if (entrada === null) return;

    const numero = Number(entrada.trim());

    if (
      !/^\d+$/.test(entrada.trim()) ||
      !Number.isSafeInteger(numero) ||
      numero < 1 ||
      numero > rifa.cantidad_numeros
    ) {
      alert("Ingresá un número válido de esta rifa.");
      return;
    }

    if (!confirm(`¿Confirmás que el número ganador es ${numero}? Esta acción no se puede deshacer desde el panel.`)) {
      return;
    }

    botonGanador.disabled = true;

    const { data, error } = await db.rpc("registrar_ganador_rifa", {
      p_rifa_id: rifa.id,
      p_numero: numero
    });

    if (error || data !== true) {
      console.error("Error al registrar ganador:", error);
      alert("No se pudo registrar el ganador. Verificá que el número esté vendido y pagado, y que la fecha del sorteo haya llegado.");
      botonGanador.disabled = false;
      return;
    }

    alert("🏆 ¡Ganador registrado correctamente!");
    await cargarRifasInstitucion(institucionId);
  });

  tarjeta.appendChild(botonGanador);
}

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
// Abrir y cerrar el formulario de historias
const abrirHistorias = document.getElementById("abrirHistorias");
const seccionHistorias = document.getElementById("seccionHistorias");

abrirHistorias?.addEventListener("click", () => {
  seccionHistorias.hidden = !seccionHistorias.hidden;

  if (!seccionHistorias.hidden) {
    seccionHistorias.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});
// Validar formulario de historias
const formularioHistorias =
  document.getElementById("formularioHistorias");

const historiaTitulo =
  document.getElementById("historiaTitulo");

const historiaDescripcion =
  document.getElementById("historiaDescripcion");

const guardarHistoria =
  document.getElementById("guardarHistoria");

function validarHistoria() {
  const tituloValido =
    historiaTitulo.value.trim().length >= 3;

  const descripcionValida =
    historiaDescripcion.value.trim().length >= 10;

  guardarHistoria.disabled = !(tituloValido && descripcionValida);
}

historiaTitulo?.addEventListener("input", validarHistoria);
historiaDescripcion?.addEventListener("input", validarHistoria);

function configurarPublicacionHistorias(institucion) {
  const formulario = document.getElementById("formularioHistorias");
  const boton = document.getElementById("guardarHistoria");
  const mensaje = document.getElementById("mensajeHistorias");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const titulo = document.getElementById("historiaTitulo").value.trim();
    const descripcion = document.getElementById("historiaDescripcion").value.trim();

    if (titulo.length < 3 || descripcion.length < 10) {
      mensaje.textContent = "Completá correctamente el título y la descripción.";
      return;
    }

    boton.disabled = true;
    mensaje.textContent = "Publicando historia...";

    try {

const archivo = document.getElementById("historiaImagen").files[0];

let imagenUrl = null;
let rutaImagen = null;

if (archivo) {
  mensaje.textContent = "Comprimiendo fotografía...";

  const imagenComprimida = await comprimirImagenHistoria(archivo);

  const { data: { user }, error: errorUsuario } =
    await db.auth.getUser();

  if (errorUsuario || !user) {
    throw new Error("No se pudo verificar la sesión.");
  }

  rutaImagen = `${user.id}/${crypto.randomUUID()}.webp`;

  mensaje.textContent = "Subiendo fotografía...";

  const { error: errorImagen } = await db.storage
    .from("historias-solidarias")
    .upload(rutaImagen, imagenComprimida, {
      contentType: "image/webp",
      upsert: false
    });

  if (errorImagen) throw errorImagen;

  imagenUrl = db.storage
    .from("historias-solidarias")
    .getPublicUrl(rutaImagen).data.publicUrl;
}

const { error } = await db
  .from("historias_instituciones")
  .insert({
    organizacion_id: institucion.id,
    titulo,
    descripcion,
    imagen_url: imagenUrl,
    publicada: true
  });

if (error) {
  if (rutaImagen) {
    await db.storage
      .from("historias-solidarias")
      .remove([rutaImagen]);
  }

  throw error;
}


      
formulario.reset();
mensaje.textContent = "✓ Historia publicada correctamente.";

await cargarHistoriasInstitucion(institucion.id);

    } catch (error) {
      console.error("Error al publicar historia:", error);
      mensaje.textContent =
        error.code === "P0001"
          ? "Alcanzaste el límite de 10 historias."
          : "No se pudo publicar la historia.";
    } finally {
      boton.disabled = false;
      validarHistoria();
    }
  });
}

async function comprimirImagenHistoria(archivo) {
  const formatos = ["image/jpeg", "image/png", "image/webp"];

  if (!formatos.includes(archivo.type)) {
    throw new Error("Seleccioná una imagen JPG, PNG o WebP.");
  }

  if (archivo.size > 10 * 1024 * 1024) {
    throw new Error("La imagen original no puede superar los 10 MB.");
  }

  const imagen = await createImageBitmap(archivo);

  try {
    const escala = Math.min(1, 1200 / Math.max(imagen.width, imagen.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagen.width * escala);
    canvas.height = Math.round(imagen.height * escala);

    const contexto = canvas.getContext("2d");
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

    for (const calidad of [0.8, 0.65, 0.5, 0.35, 0.2]) {
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/webp", calidad);
      });

      if (!blob) {
        throw new Error("No se pudo comprimir la fotografía.");
      }

      if (blob.size <= 200 * 1024) {
        return blob;
      }
    }

    throw new Error(
      "La fotografía no pudo reducirse a 200 KB. Probá con otra imagen."
    );
  } finally {
    imagen.close();
  }
}

async function cargarHistoriasInstitucion(institucionId) {
  const contenedor = document.getElementById("listaHistoriasInstitucion");

  const { data: historias, error } = await db
    .from("historias_instituciones")
    .select("id, titulo, descripcion, imagen_url, created_at")
    .eq("organizacion_id", institucionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar historias:", error);
    contenedor.textContent = "No se pudieron cargar las historias.";
    return;
  }

  contenedor.replaceChildren();

  if (!historias.length) {
    contenedor.textContent = "Todavía no hay historias publicadas.";
    return;
  }

  historias.forEach(historia => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "panelOpcion";
    tarjeta.style.marginTop = "15px";
    


const contenido = document.createElement("div");
contenido.className = "historiaContenido";

const texto = document.createElement("div");
texto.className = "historiaTexto";

const titulo = document.createElement("h3");
titulo.textContent = historia.titulo;
texto.appendChild(titulo);

const descripcion = document.createElement("p");
descripcion.textContent = historia.descripcion;
texto.appendChild(descripcion);

if (historia.imagen_url) {
  const imagen = document.createElement("img");
  imagen.src = historia.imagen_url;
  imagen.alt = historia.titulo;
  imagen.className = "historiaFoto";
  contenido.appendChild(imagen);
}

contenido.appendChild(texto);
tarjeta.appendChild(contenido);


    const fecha = document.createElement("small");
    fecha.textContent = new Date(historia.created_at)
      .toLocaleDateString("es-AR");
  
tarjeta.appendChild(fecha);

const botonEliminar = document.createElement("button");
botonEliminar.type = "button";
botonEliminar.textContent = "🗑️ Eliminar historia";
botonEliminar.style.marginTop = "15px";

botonEliminar.addEventListener("click", async () => {
  if (!confirm(`¿Querés eliminar la historia "${historia.titulo}"?`)) {
    return;
  }

  botonEliminar.disabled = true;

  const { data, error } = await db
    .from("historias_instituciones")
    .delete()
    .eq("id", historia.id)
    .eq("organizacion_id", institucionId)
    .select("id");

  if (error || !data?.length) {
    console.error("Error al eliminar historia:", error);
    alert("No se pudo eliminar la historia.");
    botonEliminar.disabled = false;
    return;
  }

if (historia.imagen_url) {
  const marcador = "/storage/v1/object/public/historias-solidarias/";
  const posicion = historia.imagen_url.indexOf(marcador);

  if (posicion !== -1) {
    const rutaImagen = decodeURIComponent(
      historia.imagen_url.slice(posicion + marcador.length)
    );

    const { error: errorImagen } = await db.storage
      .from("historias-solidarias")
      .remove([rutaImagen]);

    if (errorImagen) {
      console.error("No se pudo eliminar la fotografía:", errorImagen);
      alert("La historia se eliminó, pero no se pudo borrar su fotografía.");
    }
  }
}

  await cargarHistoriasInstitucion(institucionId);
});

const botonEditar = document.createElement("button");
botonEditar.type = "button";
botonEditar.textContent = "✏️ Editar historia";
botonEditar.style.marginRight = "10px";
botonEditar.style.marginTop = "15px";

botonEditar.addEventListener("click", async () => {
  const nuevoTitulo = prompt(
    "Editar título de la historia:",
    historia.titulo
  );

  if (nuevoTitulo === null) return;

  const nuevaDescripcion = prompt(
    "Editar descripción:",
    historia.descripcion
  );

  if (nuevaDescripcion === null) return;

  const titulo = nuevoTitulo.trim();
  const descripcion = nuevaDescripcion.trim();

  if (
    titulo.length < 3 ||
    titulo.length > 120 ||
    descripcion.length < 10 ||
    descripcion.length > 5000
  ) {
    alert("El título debe tener entre 3 y 120 caracteres y la descripción entre 10 y 5000.");
    return;
  }

  botonEditar.disabled = true;

  const { data, error } = await db
    .from("historias_instituciones")
    .update({
      titulo,
      descripcion,
      updated_at: new Date().toISOString()
    })
    .eq("id", historia.id)
    .eq("organizacion_id", institucionId)
    .select("id");

  if (error || !data?.length) {
    console.error("Error al editar historia:", error);
    alert("No se pudo actualizar la historia.");
    botonEditar.disabled = false;
    return;
  }

  await cargarHistoriasInstitucion(institucionId);
});

tarjeta.appendChild(botonEditar);

tarjeta.appendChild(botonEliminar);

const botonCambiarFoto = document.createElement("button");
botonCambiarFoto.type = "button";
botonCambiarFoto.textContent = "📷 Cambiar fotografía";
botonCambiarFoto.style.marginRight = "10px";
botonCambiarFoto.style.marginTop = "15px";

const selectorFoto = document.createElement("input");
selectorFoto.type = "file";
selectorFoto.accept = "image/jpeg,image/png,image/webp";
selectorFoto.hidden = true;

botonCambiarFoto.addEventListener("click", () => {
  selectorFoto.click();
});

tarjeta.appendChild(selectorFoto);
tarjeta.appendChild(botonCambiarFoto);

selectorFoto.addEventListener("change", async () => {
  const archivo = selectorFoto.files[0];
  if (!archivo) return;

  botonCambiarFoto.disabled = true;
  botonCambiarFoto.textContent = "⏳ Actualizando...";

  let rutaNueva = null;

  try {
    const imagen = await comprimirImagenHistoria(archivo);

    const { data: { user }, error: errorUsuario } =
      await db.auth.getUser();

    if (errorUsuario || !user) {
      throw new Error("No se pudo verificar la sesión.");
    }

    rutaNueva = `${user.id}/${crypto.randomUUID()}.webp`;

    const { error: errorSubida } = await db.storage
      .from("historias-solidarias")
      .upload(rutaNueva, imagen, {
        contentType: "image/webp",
        upsert: false
      });

    if (errorSubida) throw errorSubida;

    const nuevaUrl = db.storage
      .from("historias-solidarias")
      .getPublicUrl(rutaNueva).data.publicUrl;

    const { data, error: errorActualizar } = await db
      .from("historias_instituciones")
      .update({
        imagen_url: nuevaUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", historia.id)
      .eq("organizacion_id", institucionId)
      .select("id");

    if (errorActualizar || !data?.length) {
      throw errorActualizar || new Error("No se actualizó la historia.");
    }

    // Eliminar la fotografía anterior para ahorrar espacio.
    if (historia.imagen_url) {
      const marcador = "/storage/v1/object/public/historias-solidarias/";
      const posicion = historia.imagen_url.indexOf(marcador);

      if (posicion !== -1) {
        const rutaAnterior = decodeURIComponent(
          historia.imagen_url.slice(posicion + marcador.length)
        );

        const { error: errorBorrado } = await db.storage
          .from("historias-solidarias")
          .remove([rutaAnterior]);

        if (errorBorrado) {
          console.error("No se pudo borrar la fotografía anterior:", errorBorrado);
        }
      }
    }

    await cargarHistoriasInstitucion(institucionId);

  } catch (error) {
    console.error("Error al cambiar fotografía:", error);

    // Si falló la actualización, eliminar la nueva imagen subida.
    if (rutaNueva) {
      await db.storage
        .from("historias-solidarias")
        .remove([rutaNueva]);
    }

    alert(error.message || "No se pudo cambiar la fotografía.");

  } finally {
    botonCambiarFoto.disabled = false;
    botonCambiarFoto.textContent = "📷 Cambiar fotografía";
    selectorFoto.value = "";
  }
});

contenedor.appendChild(tarjeta);

  });
}

async function prepararLogoWebP(archivo) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
    throw new Error("Seleccioná una imagen JPG, PNG o WebP.");
  }

  if (archivo.size > 10 * 1024 * 1024) {
    throw new Error("La imagen original no puede superar los 10 MB.");
  }

  const imagen = await createImageBitmap(archivo);

  try {
    const escala = Math.min(1, 600 / Math.max(imagen.width, imagen.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagen.width * escala));
    canvas.height = Math.max(1, Math.round(imagen.height * escala));

    const contexto = canvas.getContext("2d");
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        resultado => resultado
          ? resolve(resultado)
          : reject(new Error("No se pudo convertir el logo.")),
        "image/webp",
        0.82
      );
    });

    if (blob.type !== "image/webp") {
      throw new Error("El navegador no pudo generar una imagen WebP.");
    }

    if (blob.size > 1024 * 1024) {
      throw new Error("El logo convertido supera 1 MB.");
    }

    return blob;
  } finally {
    imagen.close();
  }
}

/* Administración de revistas digitales */
const botonAbrirRevistas = document.getElementById("abrirRevistas");
const seccionRevistas = document.getElementById("seccionRevistas");

if (botonAbrirRevistas && seccionRevistas) {
  botonAbrirRevistas.addEventListener("click", () => {
    const estabaOculta = seccionRevistas.hidden;

    seccionRevistas.hidden = !estabaOculta;

    if (estabaOculta) {
      seccionRevistas.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}
// Abrir y cerrar el editor de personalización
const abrirPersonalizacion =
  document.getElementById("abrirPersonalizacion");

const seccionPersonalizacion =
  document.getElementById("seccionPersonalizacion");

abrirPersonalizacion?.addEventListener("click", () => {
  seccionPersonalizacion.hidden =
    !seccionPersonalizacion.hidden;

  if (!seccionPersonalizacion.hidden) {
    seccionPersonalizacion.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});
// Optimizar portadas antes de subirlas
async function optimizarPortada(archivo) {
  const imagen = await createImageBitmap(archivo);

  try {
    const anchoMaximo = 1600;
    const altoMaximo = 500;

    const escala = Math.min(
      1,
      anchoMaximo / imagen.width,
      altoMaximo / imagen.height
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagen.width * escala);
    canvas.height = Math.round(imagen.height * escala);

    const contexto = canvas.getContext("2d");
    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

    for (const calidad of [0.8, 0.65, 0.5, 0.35]) {
      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/webp", calidad)
      );

      if (blob && blob.type === "image/webp" && blob.size <= 300 * 1024) {
        return blob;
      }
    }

    throw new Error(
      "La imagen no pudo reducirse a menos de 300 KB. Elegí otra fotografía."
    );
  } finally {
    imagen.close();
  }
}

const inputPortada = document.getElementById("portadaInstitucion");
const vistaPortada = document.getElementById("vistaPreviaPortada");
const mensajePortada = document.getElementById("mensajePersonalizacion");

let portadaOptimizada = null;
let urlVistaPortada = null;

inputPortada?.addEventListener("change", async () => {
  portadaOptimizada = null;

  if (urlVistaPortada) {
    URL.revokeObjectURL(urlVistaPortada);
    urlVistaPortada = null;
  }

  vistaPortada.hidden = true;

  const archivo = inputPortada.files?.[0];
  if (!archivo) return;

  mensajePortada.textContent = "Optimizando imagen...";

  try {
    portadaOptimizada = await optimizarPortada(archivo);

    urlVistaPortada = URL.createObjectURL(portadaOptimizada);
    vistaPortada.src = urlVistaPortada;
    vistaPortada.hidden = false;

    mensajePortada.textContent =
      `✅ Imagen optimizada: ${Math.round(portadaOptimizada.size / 1024)} KB`;
  } catch (error) {
    mensajePortada.textContent = error.message;
  }
});




