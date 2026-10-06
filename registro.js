const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const registroForm = document.getElementById("registroForm");
const registroMensaje = document.getElementById("registroMensaje");

registroForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const passwordConfirmar =
    document.getElementById("passwordConfirmar").value;

  registroMensaje.textContent = "";

  if (password !== passwordConfirmar) {
    registroMensaje.textContent =
      "Las contraseñas no coinciden.";
    return;
  }

  const { data, error } = await db.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    console.error(error);

    registroMensaje.textContent =
      "No se pudo crear la cuenta: " + error.message;

    return;
  }

  registroMensaje.textContent =
    "Cuenta creada correctamente.";

  console.log("Usuario registrado:", data);
});