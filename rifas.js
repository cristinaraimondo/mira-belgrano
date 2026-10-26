
async function cargarRifaSolidaria() {
  const parametros = new URLSearchParams(window.location.search);
  const slug = parametros.get("slug");

  if (!slug) return;

  const grilla = document.getElementById("rifaGrilla");
  const informacion = document.getElementById("rifaInformacion");
  const seccion = document.getElementById("organizacionRifas");
  const formulario = document.getElementById("rifaFormulario");

  if (!grilla || !informacion || !seccion) return;

  seccion.hidden = true;
  grilla.replaceChildren();
  if (formulario) formulario.hidden = true;

  // Buscar la institución publicada y verificada
const { data: institucion, error: errorInstitucion } = await db
  .from("organizaciones")
  .select("id, nombre, whatsapp")
  .eq("slug", slug)
  .eq("publicada", true)
  .eq("verificada", true)
  .maybeSingle();

  if (errorInstitucion || !institucion) return;
  // Obtener únicamente la cuenta aprobada por el administrador
const { data: datosCobro, error: errorCobro } = await db
  .rpc("consultar_cobro_rifa", {
    p_organizacion_id: institucion.id
  });

if (errorCobro) {
  console.error("Error al consultar datos de cobro:", errorCobro);
}

// Guardar los datos para mostrarlos después de reservar
window.rifaDatosPago = {
  institucion: institucion.nombre,
  whatsapp: institucion.whatsapp,
  alias: datosCobro?.[0]?.alias || null,
  titular: datosCobro?.[0]?.titular || null
};

  // Buscar su única rifa activa
  const { data: rifa, error: errorRifa } = await db
    .from("rifas_solidarias")
    .select("id, titulo, premio, precio, cantidad_numeros, fecha_sorteo, imagen_premio_url")
    .eq("organizacion_id", institucion.id)
    .eq("activa", true)
    .maybeSingle();

  if (errorRifa || !rifa) return;

const { data: numeros, error: errorNumeros } = await db
  .rpc("consultar_numeros_rifa", {
    p_rifa_id: rifa.id
  });

  if (errorNumeros) {
    console.error("Error al cargar números:", errorNumeros);
    return;
  }

  informacion.textContent =
    `${rifa.titulo} · Premio: ${rifa.premio} · ` +
    `${rifa.cantidad_numeros} números · $${rifa.precio} por número`;
 document.querySelectorAll(".rifaImagenPremio").forEach(img => img.remove());   
if (rifa.imagen_premio_url) {
  const imagenPremio = document.createElement("img");

  imagenPremio.src = rifa.imagen_premio_url;
  imagenPremio.alt = `Premio de la rifa: ${rifa.premio}`;
  imagenPremio.loading = "lazy";
  imagenPremio.className = "rifaImagenPremio";

  informacion.insertAdjacentElement("afterend", imagenPremio);
}


  numeros.forEach(item => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "rifaNumero";
    boton.dataset.numero = item.numero;
    boton.textContent = String(item.numero).padStart(2, "0");

    if (item.estado === "reservado") {
      boton.disabled = true;
      boton.classList.add("reservado");
      boton.title = "Número reservado";
    } else if (item.estado === "vendido") {
      boton.disabled = true;
      boton.classList.add("vendido");
      boton.textContent += " ✓";
      boton.title = "Número vendido";
    } else if (item.estado === "disponible") {
      boton.addEventListener("click", () => {
        const numeroElegido =
          document.getElementById("rifaNumeroElegido");
        const nombre = document.getElementById("rifaNombre");
        const mostrarNombre =
          document.getElementById("rifaMostrarNombre");

        if (!formulario || !numeroElegido) return;
        // Restaurar el formulario al seleccionar otro número
Array.from(formulario.children).forEach(elemento => {
  elemento.style.display = "";
  elemento.hidden = false;
});

const mensajeReserva = document.getElementById("rifaMensaje");

if (mensajeReserva) {
  mensajeReserva.replaceChildren();
}

        numeroElegido.textContent =
          `🎟️ Elegiste el número ${String(item.numero).padStart(2, "0")}`;
          formulario.dataset.rifaId = rifa.id;
          formulario.dataset.numero = item.numero;

        if (nombre) nombre.value = "";
        if (mostrarNombre) mostrarNombre.checked = false;

        formulario.hidden = false;
        formulario.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    } else {
      boton.disabled = true;
    }

    grilla.appendChild(boton);
  });

  seccion.hidden = false;
}
const nombreComprador = document.getElementById("rifaNombre");
const whatsappComprador = document.getElementById("rifaWhatsapp");
const botonConfirmar = document.getElementById("rifaConfirmar");

function validarFormularioRifa() {
  if (!nombreComprador || !whatsappComprador || !botonConfirmar) return;

  const nombreValido = nombreComprador.value.trim().length >= 3;
  const whatsappValido =
    whatsappComprador.value.replace(/\D/g, "").length >= 8;

  botonConfirmar.disabled = !(nombreValido && whatsappValido);
}

nombreComprador?.addEventListener("input", validarFormularioRifa);
whatsappComprador?.addEventListener("input", validarFormularioRifa);
botonConfirmar?.addEventListener("click", async () => {
  const formulario = document.getElementById("rifaFormulario");
  const mensaje = document.getElementById("rifaMensaje");
  const email = document.getElementById("rifaEmail");

  if (!formulario || !mensaje || botonConfirmar.disabled) return;

 const reserva = {
  p_rifa_id: Number(formulario.dataset.rifaId),
  p_numero: Number(formulario.dataset.numero),
  p_nombre: nombreComprador.value.trim(),
  p_whatsapp: whatsappComprador.value.trim(),
  p_email: email?.value.trim() || null,
  p_mostrar_nombre:
    document.getElementById("rifaMostrarNombre")?.checked === true
};

  if (
    !Number.isInteger(reserva.p_rifa_id) ||
    reserva.p_rifa_id <= 0 ||
    !Number.isInteger(reserva.p_numero) ||
    reserva.p_numero < 0 ||
    reserva.p_nombre.length < 3 ||
    reserva.p_whatsapp.replace(/\D/g, "").length < 8
  ) {
    mensaje.textContent = "⚠️ Revisá los datos ingresados.";
    return;
  }

const turnstileToken = window.turnstile?.getResponse();

if (!turnstileToken) {
  mensaje.textContent = "⚠️ Completá la verificación de seguridad.";
  return;
}

if (botonConfirmar.dataset.procesando === "true") return;

botonConfirmar.dataset.procesando = "true";
botonConfirmar.disabled = true;
mensaje.textContent = "Procesando reserva...";

let data = null;
let error = null;

try {
  const resultado = await db.functions.invoke(
    "reservar-rifa-segura",
    {
      body: {
        ...reserva,
        turnstileToken
      }
    }
  );

  data = resultado.data;
  error = resultado.error;

} catch (fallo) {
  console.error("Error de conexión:", fallo);

  error = fallo;
}

if (error || !data?.success) {
  let detalle = data?.error;

  if (error && !detalle) {
    try {
      const respuesta = await error.context?.json();
      detalle = respuesta?.error;
    } catch {
      // Mantener mensaje general
    }
  }

  mensaje.textContent =
    "⚠️ " + (detalle || "No se pudo completar la reserva.");
} else {
  const pago = window.rifaDatosPago || {};
const numero = String(reserva.p_numero).padStart(2, "0");
const codigo = data.compra_id;

mensaje.replaceChildren();

const titulo = document.createElement("h3");
titulo.textContent = `✅ ¡Reservaste el número ${numero}!`;

const detalle = document.createElement("p");
detalle.textContent =
  `Código de reserva: #${codigo}. Tenés 24 horas para pagar.`;

mensaje.append(titulo, detalle);

if (pago.alias) {
  const transferencia = document.createElement("p");
  transferencia.textContent = "🏦 Para pagar por transferencia:";

  const alias = document.createElement("strong");
  alias.textContent = `Alias: ${pago.alias}`;

  const titular = document.createElement("p");
  titular.textContent = `Titular: ${pago.titular || "No informado"}`;

  const copiar = document.createElement("button");
  copiar.type = "button";
  copiar.textContent = "📋 Copiar alias";

  copiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pago.alias);
      copiar.textContent = "✅ Alias copiado";
    } catch {
      copiar.textContent = "No se pudo copiar el alias";
    }
  });

  mensaje.append(transferencia, alias, titular, copiar);
}

const instrucciones = document.createElement("p");
instrucciones.textContent =
  "Después de transferir, avisá a la institución por WhatsApp. " +
  "Si preferís pagar en efectivo, coordiná la entrega por ese mismo medio.";

mensaje.appendChild(instrucciones);

const telefono = String(pago.whatsapp || "").replace(/\D/g, "");

if (telefono) {
  const textoWhatsapp =
    `Hola, soy ${reserva.p_nombre}. Reservé el número ${numero} ` +
    `de la rifa de ${pago.institucion || "la institución"}. ` +
    `Mi código de reserva es #${codigo}. ` +
    `Quisiera coordinar el pago o enviar el comprobante.`;

  const enlace = document.createElement("a");
  enlace.href =
    `https://wa.me/${telefono}?text=${encodeURIComponent(textoWhatsapp)}`;
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  enlace.textContent = "💬 Avisar por WhatsApp a la institución";

  mensaje.appendChild(enlace);
}
// Ocultar los campos del formulario después de reservar
// Ocultar los campos después de una reserva exitosa
Array.from(formulario.children).forEach(elemento => {
  if (elemento !== mensaje) {
    elemento.style.display = "none";
  }
});
mensaje.scrollIntoView({
  behavior: "smooth",
  block: "center"
});

  const numeroReservado = document.querySelector(
    `.rifaNumero[data-numero="${reserva.p_numero}"]`
  );

  if (numeroReservado) {
    numeroReservado.disabled = true;
    numeroReservado.classList.add("reservado");
    numeroReservado.title = "Reservado durante 24 horas";
  }
}

window.turnstile?.reset();
botonConfirmar.dataset.procesando = "false";
validarFormularioRifa();

if (data?.success) {
  botonConfirmar.disabled = true;
}

 
});
// Actualizar la disponibilidad cada 15 segundos
setInterval(async () => {
  const formulario = document.getElementById("rifaFormulario");

  // Si el formulario está abierto, actualizar solo los colores
  if (formulario && !formulario.hidden) {
    const rifaId = Number(formulario.dataset.rifaId);

    if (!Number.isInteger(rifaId) || rifaId <= 0) return;

    const { data: numeros, error } = await db.rpc(
      "consultar_numeros_rifa",
      { p_rifa_id: rifaId }
    );

    if (error || !numeros) return;

    numeros.forEach(item => {
      const boton = document.querySelector(
        `.rifaNumero[data-numero="${item.numero}"]`
      );

      if (!boton) return;

      boton.classList.remove("reservado", "vendido");
      boton.disabled = item.estado !== "disponible";
      boton.textContent = String(item.numero).padStart(2, "0");

      if (item.estado === "reservado") {
        boton.classList.add("reservado");
        boton.title = "Número reservado";
      } else if (item.estado === "vendido") {
        boton.classList.add("vendido");
        boton.textContent += " ✓";
        boton.title = "Número vendido";
      } else {
        boton.title = "Número disponible";
      }
    });

    return;
  }

  await cargarRifaSolidaria();
}, 15000);


cargarRifaSolidaria();
