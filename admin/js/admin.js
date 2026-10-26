
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_ID = "7de52da5-e675-4709-8e43-23c7e0a0587b";

const panel = document.getElementById("panelAdmin");
const pantallaAcceso = document.getElementById("pantallaAcceso");
const mensajeAcceso = document.getElementById("mensajeAcceso");
const lista = document.getElementById("listaInstituciones");

async function iniciarPanel() {
  try {
    const { data: { user }, error } = await db.auth.getUser();

    if (error || !user || user.id !== ADMIN_ID) {
      mensajeAcceso.textContent =
        "Necesitás iniciar sesión con la cuenta administradora.";
      return;
    }

    pantallaAcceso.hidden = true;
    panel.hidden = false;

    await cargarInstituciones();

  } catch (error) {
    console.error("Error de acceso:", error);
    mensajeAcceso.textContent = "No se pudo verificar el acceso.";
  }
}

async function cargarInstituciones() {
  const { data, error } = await db
    .from("organizaciones")
    .select("id, nombre, slug, usuario_id")
    .order("nombre");

  if (error) {
    console.error("Error al cargar instituciones:", error);
    lista.textContent = "No se pudieron cargar las instituciones.";
    return;
  }

  const instituciones = data || [];

  document.getElementById("totalInstituciones").textContent =
    instituciones.length;

  document.getElementById("institucionesPendientes").textContent =
    instituciones.filter(i => !i.usuario_id).length;

  document.getElementById("institucionesActivas").textContent =
    instituciones.filter(i => i.usuario_id).length;

  lista.replaceChildren();

  instituciones.forEach(institucion => {
    const fila = document.createElement("div");
    fila.className = "institucion";

    const informacion = document.createElement("div");

    const nombre = document.createElement("h3");
    nombre.textContent = institucion.nombre;

    const estado = document.createElement("p");
    estado.textContent = institucion.usuario_id
      ? "Cuenta vinculada"
      : "Sin cuenta asignada";

    informacion.append(nombre, estado);
    fila.appendChild(informacion);

const btnEditar = document.createElement("button");
btnEditar.textContent = "Editar institución";

btnEditar.addEventListener("click", () => {
  window.location.href =
    `editar-institucion.html?id=${institucion.id}`;
});

fila.appendChild(btnEditar);

    if (!institucion.usuario_id) {
      const boton = document.createElement("button");
      boton.textContent = "Generar invitación";

      boton.addEventListener("click", async () => {
        boton.disabled = true;
        boton.textContent = "Generando...";

        try {
          const { data: token, error } = await db.rpc(
            "generar_invitacion_institucion",
            { p_organizacion_id: institucion.id }
          );

          if (error) throw error;

          const enlace =
            `${window.location.origin}/instituciones/activar-institucion.html?token=${token}`;

          await navigator.clipboard.writeText(enlace);

          alert(
            `Invitación para ${institucion.nombre} copiada al portapapeles.\n\n` +
            "El enlace vence en 7 días."
          );

        } catch (error) {
          console.error("Error al generar invitación:", error);
          alert("No se pudo generar la invitación: " + error.message);
        } finally {
          boton.disabled = false;
          boton.textContent = "Generar invitación";
        }
      });

      fila.appendChild(boton);
    }

    lista.appendChild(fila);
  });
}

document.getElementById("btnSalir").addEventListener("click", async () => {
  await db.auth.signOut();
  window.location.href = "../login.html";
});

iniciarPanel();
