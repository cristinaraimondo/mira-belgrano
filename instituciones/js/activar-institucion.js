
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formulario = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");
const btnRegistro = document.getElementById("btnRegistro");
const btnActivar = document.getElementById("btnActivar");
const btnIniciarSesion = document.getElementById("btnIniciarSesion");

const parametros = new URLSearchParams(window.location.search);
const tokenURL = parametros.get("token");

if (tokenURL && /^[0-9a-f]{64}$/.test(tokenURL)) {
  sessionStorage.setItem("invitacion_institucion", tokenURL);
  window.history.replaceState({}, "", window.location.pathname);
}

const token = sessionStorage.getItem("invitacion_institucion");
let invitacionVerificada = false;

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

function validarInvitacion() {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    mostrarMensaje("Necesitás un enlace de invitación para registrar tu institución.");
    formulario.hidden = true;
    btnActivar.disabled = true;
    return false;
  }

  return true;
}


async function comprobarInvitacion() {
  if (!validarInvitacion()) return;

  btnRegistro.disabled = true;
  btnIniciarSesion.disabled = true;
  btnActivar.disabled = true;

  mostrarMensaje("Verificando invitación...");

  const { data, error } = await db.rpc(
    "validar_invitacion_institucion",
    { p_token: token }
  );

  if (error || data !== true) {
    mostrarMensaje(
      "Esta invitación no existe, venció o ya fue utilizada."
    );
    formulario.hidden = true;
    btnActivar.disabled = true;
    return;
  }

 invitacionVerificada = true;
mostrarMensaje("");
btnRegistro.disabled = false;
  btnIniciarSesion.disabled = false;
  btnActivar.disabled = false;
}

comprobarInvitacion();


formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

if (!validarInvitacion()) return;

if (!invitacionVerificada) {
  mostrarMensaje("Esperá a que se verifique tu invitación.");
  return;
}

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  btnRegistro.disabled = true;
  mostrarMensaje("Creando tu cuenta...");

  try {
    const { error } = await db.auth.signUp({
      email,
      password,
    options: {
  emailRedirectTo:
    `${window.location.origin}/instituciones/activar-institucion.html?token=${encodeURIComponent(token)}`
}
    });

    if (error) throw error;

    mostrarMensaje(
      "Revisá tu correo electrónico y confirmá tu cuenta. Después regresá a esta página para activar tu institución."
    );
  } catch (error) {
    mostrarMensaje("No se pudo completar el registro: " + error.message);
  } finally {
    btnRegistro.disabled = false;
  }
});

btnActivar.addEventListener("click", async () => {
  if (!validarInvitacion()) return;

  btnActivar.disabled = true;
  mostrarMensaje("Verificando tu cuenta...");

  try {
    const { data: { user }, error: userError } = await db.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      mostrarMensaje(
        "Primero confirmá tu correo e iniciá sesión. Si ya tenés una cuenta, necesitaremos habilitar el acceso desde esta página."
      );
      return;
    }

    const { data, error } = await db.rpc(
      "activar_invitacion_institucion",
      { p_token: token }
    );

    if (error) throw error;

    sessionStorage.removeItem("invitacion_institucion");

    mostrarMensaje(
      `¡La institución ${data} fue activada correctamente! Ya podés ingresar a tu panel.`
    );

    formulario.hidden = true;
    btnActivar.hidden = true;

  } catch (error) {
    mostrarMensaje("No se pudo activar la institución: " + error.message);
  } finally {
    btnActivar.disabled = false;
  }
});

//const btnIniciarSesion = document.getElementById("btnIniciarSesion");

btnIniciarSesion.addEventListener("click", async () => {
  if (!validarInvitacion()) return;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    mostrarMensaje("Ingresá tu correo y contraseña.");
    return;
  }

  btnIniciarSesion.disabled = true;
  mostrarMensaje("Iniciando sesión...");

  try {
    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    mostrarMensaje(
      "¡Sesión iniciada! Ahora presioná 'Activar mi institución'."
    );

  } catch (error) {
    mostrarMensaje(
      "No se pudo iniciar sesión: " + error.message
    );
  } finally {
    btnIniciarSesion.disabled = false;
  }
});
