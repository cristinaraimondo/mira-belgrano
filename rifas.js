
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
    .select("id")
    .eq("slug", slug)
    .eq("publicada", true)
    .eq("verificada", true)
    .maybeSingle();

  if (errorInstitucion || !institucion) return;

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
  mensaje.textContent =
    `✅ ¡Reserva confirmada! El número ${String(reserva.p_numero).padStart(2, "0")} quedó reservado durante 24 horas. Código de reserva: ${data.compra_id}. Guardá este código.`;

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
