const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

// Copiá aquí la misma clave pública que usás en panel-institucion.js
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const ADMIN_ID = "7de52da5-e675-4709-8e43-23c7e0a0587b";

async function cargarCobrosAdmin() {
  const contenedor = document.getElementById("listaCobrosAdmin");

  const { data: { user }, error: errorUsuario } =
    await db.auth.getUser();

  if (errorUsuario || !user || user.id !== ADMIN_ID) {
    contenedor.textContent = "Acceso exclusivo para administración.";
    return;
  }

  const { data: instituciones, error } = await db
    .from("organizaciones")
    .select("id, nombre")
    .order("nombre");

  if (error) {
    console.error(error);
    contenedor.textContent = "No se pudieron cargar las instituciones.";
    return;
  }

  const { data: cobros, error: errorCobros } = await db
    .from("organizaciones_cobros")
    .select("organizacion_id, titular, alias, cvu, confirmado, aprobado_admin, fecha_aprobacion");

  if (errorCobros) {
    console.error(errorCobros);
    contenedor.textContent = "No se pudieron cargar los datos de cobro.";
    return;
  }

  contenedor.replaceChildren();

  instituciones.forEach(institucion => {
    const cobro = cobros.find(
      c => c.organizacion_id === institucion.id
    );

    const tarjeta = document.createElement("section");
    tarjeta.className = "tarjetaCobro";

    const titulo = document.createElement("h2");
    titulo.textContent = institucion.nombre;
    tarjeta.appendChild(titulo);

    const agregarDato = (etiqueta, valor) => {
      const parrafo = document.createElement("p");
      const negrita = document.createElement("strong");
      negrita.textContent = `${etiqueta}: `;
      parrafo.append(negrita, document.createTextNode(valor || "No registrado"));
      tarjeta.appendChild(parrafo);
    };

    agregarDato("Titular", cobro?.titular);
    agregarDato("Alias", cobro?.alias);
    agregarDato("CBU/CVU", cobro?.cvu);

    const estado = !cobro
      ? "Sin datos de cobro"
      : cobro.aprobado_admin
        ? "✅ Cuenta aprobada"
        : cobro.confirmado
          ? "🟡 Confirmada, pendiente de aprobación"
          : "⚪ Pendiente de confirmación";

    agregarDato("Estado", estado);

    if (cobro?.confirmado && !cobro.aprobado_admin) {
      const boton = document.createElement("button");
      boton.textContent = "Aprobar cuenta";

boton.addEventListener("click", async () => {
  const acepta = window.confirm(
    `¿Confirmás que verificaste los datos bancarios de ${institucion.nombre}?\n\n` +
    `Titular: ${cobro.titular}\n` +
    `Alias: ${cobro.alias || "No registrado"}\n` +
    `CBU/CVU: ${cobro.cvu || "No registrado"}\n\n` +
    "La cuenta quedará autorizada para recibir pagos de rifas y donaciones."
  );

  if (!acepta) return;

  boton.disabled = true;
  boton.textContent = "Aprobando...";

  const { data, error } = await db.rpc(
    "aprobar_cobros_institucion",
    { p_organizacion_id: institucion.id }
  );

  if (error || data !== true) {
    console.error("Error al aprobar:", error);
    alert("No se pudo aprobar la cuenta.");
    boton.disabled = false;
    boton.textContent = "Aprobar cuenta";
    return;
  }

  await cargarCobrosAdmin();
});

tarjeta.appendChild(boton);
    }


    contenedor.appendChild(tarjeta);
  });
}
async function cargarSolicitudesAdmin() {
  const seccion = document.getElementById("seccionSolicitudes");
  const contenedor = document.getElementById("listaSolicitudesAdmin");

  const { data: { user }, error: errorUsuario } =
    await db.auth.getUser();

  if (errorUsuario || !user || user.id !== ADMIN_ID) {
    return;
  }

  seccion.hidden = false;

  const { data: solicitudes, error } = await db
    .from("organizaciones_cobros_solicitudes")
    .select("*")
    .eq("estado", "pendiente")
    .order("fecha_solicitud", { ascending: false });

  if (error) {
    console.error("Error al cargar solicitudes:", error);
    contenedor.textContent = "No se pudieron cargar las solicitudes.";
    return;
  }

  contenedor.replaceChildren();

  if (!solicitudes.length) {
    contenedor.textContent = "No hay solicitudes pendientes.";
    return;
  }

  for (const solicitud of solicitudes) {
    const { data: institucion } = await db
      .from("organizaciones")
      .select("nombre")
      .eq("id", solicitud.organizacion_id)
      .maybeSingle();

    const { data: cobro } = await db
      .from("organizaciones_cobros")
      .select("titular, alias, cvu")
      .eq("organizacion_id", solicitud.organizacion_id)
      .maybeSingle();

    const tarjeta = document.createElement("section");
    tarjeta.className = "tarjetaCobro";

    const titulo = document.createElement("h3");
    titulo.textContent = institucion?.nombre || "Institución desconocida";
    tarjeta.appendChild(titulo);

    const agregarDato = (etiqueta, valor) => {
      const p = document.createElement("p");
      const fuerte = document.createElement("strong");

      fuerte.textContent = etiqueta + ": ";
      p.append(fuerte, document.createTextNode(valor || "No registrado"));
      tarjeta.appendChild(p);
    };

    agregarDato("Motivo", solicitud.motivo);

    agregarDato("Titular actual", cobro?.titular);
    agregarDato("Titular solicitado", solicitud.titular_solicitado);

    agregarDato("Alias actual", cobro?.alias);
    agregarDato("Alias solicitado", solicitud.alias_solicitado);

    agregarDato("CBU/CVU actual", cobro?.cvu);
    agregarDato("CBU/CVU solicitado", solicitud.cvu_solicitado);

    agregarDato(
      "Fecha de solicitud",
      new Date(solicitud.fecha_solicitud).toLocaleString("es-AR")
    );
        // Botones para resolver la solicitud
const acciones = document.createElement("div");
acciones.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;";

const aprobar = document.createElement("button");
aprobar.textContent = "✓ Aprobar cambio";

const rechazar = document.createElement("button");
rechazar.textContent = "✕ Rechazar solicitud";
rechazar.style.background = "#b73545";

async function resolverSolicitud(esAprobacion) {
  const accion = esAprobacion ? "APROBAR" : "RECHAZAR";

  const acepta = window.confirm(
    `¿Querés ${accion} la solicitud de ${institucion?.nombre || "esta institución"}?\n\n` +
    (esAprobacion
      ? "Los datos bancarios se actualizarán y el cambio quedará registrado."
      : "Los datos bancarios actuales permanecerán sin cambios.")
  );

  if (!acepta) return;

  aprobar.disabled = true;
  rechazar.disabled = true;

  const { data, error } = await db.rpc("resolver_solicitud_cobros", {
    p_solicitud_id: solicitud.id,
    p_aprobar: esAprobacion
  });

  if (error || data !== true) {
    console.error("Error al resolver solicitud:", error);
    alert("No se pudo procesar la solicitud.");
    aprobar.disabled = false;
    rechazar.disabled = false;
    return;
  }

  await cargarSolicitudesAdmin();
  await cargarCobrosAdmin();
}

aprobar.addEventListener("click", () => resolverSolicitud(true));
rechazar.addEventListener("click", () => resolverSolicitud(false));

acciones.append(aprobar, rechazar);
tarjeta.appendChild(acciones);

    contenedor.appendChild(tarjeta);
  }
}

cargarCobrosAdmin();
cargarSolicitudesAdmin();