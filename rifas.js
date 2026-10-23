
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
    .select("id, titulo, premio, precio, cantidad_numeros, fecha_sorteo")
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

  numeros.forEach(item => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "rifaNumero";
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

cargarRifaSolidaria();
