const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";

const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";


const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("loginMensaje");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  mensaje.textContent = "Ingresando...";

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);
    mensaje.textContent = "Correo o contraseña incorrectos.";
    return;
  }

  console.log("Usuario conectado:", data.user);

window.location.href = "panel.html";
});