
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true
    }
  }
);

const form = document.getElementById("formRestablecerPassword");
const mensaje = document.getElementById("mensajeRestablecer");

let recuperacionAutorizada = false;

// Deshabilitar el formulario hasta verificar el enlace
form.querySelector("button[type='submit']").disabled = true;

db.auth.onAuthStateChange((evento) => {
  if (evento === "PASSWORD_RECOVERY") {
    recuperacionAutorizada = true;
    form.querySelector("button[type='submit']").disabled = false;
    mensaje.textContent = "Enlace verificado. Ya podés establecer tu nueva contraseña.";
  }
});

// Comprobar errores del enlace
const parametros = new URLSearchParams(window.location.hash.slice(1));

if (parametros.has("error")) {
  mensaje.textContent =
    "El enlace es inválido o venció. Solicitá uno nuevo desde tu panel.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!recuperacionAutorizada) {
    mensaje.textContent =
      "Necesitás ingresar desde un enlace de recuperación válido.";
    return;
  }

  const nuevaPassword =
    document.getElementById("nuevaPassword").value;

  const confirmarPassword =
    document.getElementById("confirmarPassword").value;

  if (nuevaPassword.length < 8) {
    mensaje.textContent = "La contraseña debe tener al menos 8 caracteres.";
    return;
  }

  if (nuevaPassword !== confirmarPassword) {
    mensaje.textContent = "Las contraseñas no coinciden.";
    return;
  }

  const boton = form.querySelector("button[type='submit']");
  boton.disabled = true;
  mensaje.textContent = "Guardando nueva contraseña...";

  const { error } = await db.auth.updateUser({
    password: nuevaPassword
  });

  if (error) {
    mensaje.textContent = "Error: " + error.message;
    boton.disabled = false;
    return;
  }

  recuperacionAutorizada = false;
  form.reset();
  mensaje.textContent =
    "¡Contraseña actualizada! Ya podés ingresar con tu nueva contraseña.";

  await db.auth.signOut();
});
document
  .getElementById("mostrarPassword")
  .addEventListener("change", function () {

    const tipo = this.checked ? "text" : "password";

    document.getElementById("nuevaPassword").type = tipo;
    document.getElementById("confirmarPassword").type = tipo;

  });
