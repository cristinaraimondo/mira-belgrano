
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("btnIngresar");

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  boton.disabled = true;
  mostrarMensaje("Verificando tus datos...");

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const usuario = data.user;

    if (!usuario?.email_confirmed_at) {
      throw new Error("Primero tenés que confirmar tu correo electrónico.");
    }

    const { data: institucion, error: errorInstitucion } = await db
      .from("organizaciones")
      .select("id, nombre")
      .eq("usuario_id", usuario.id)
      .maybeSingle();

    if (errorInstitucion) throw errorInstitucion;

    if (!institucion) {
      await db.auth.signOut();
      throw new Error(
        "Esta cuenta no tiene una institución vinculada. Primero activá tu invitación."
      );
    }

    mostrarMensaje(`Bienvenido a ${institucion.nombre}. Ingresando...`);

    window.location.replace("../panel-institucion.html");

  } catch (error) {
    mostrarMensaje("No se pudo ingresar: " + error.message);
  } finally {
    boton.disabled = false;
  }
});
