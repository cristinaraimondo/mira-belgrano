
const SUPABASE_URL = "https://ezyqqnyhsqgpxclpkbzq.supabase.co";
const SUPABASE_KEY = "sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function cargarOrganizaciones() {
  const contenedor = document.getElementById("listaOrganizaciones");

  const { data, error } = await db
    .from("organizaciones")
    .select("nombre, descripcion, enlace_donacion, slug")
    .eq("publicada", true)
    .eq("verificada", true)
    .order("nombre");

  if (error) {
    contenedor.textContent = "No se pudieron cargar las organizaciones.";
    console.error(error);
    return;
  }

  contenedor.replaceChildren();

  if (!data || data.length === 0) {
    contenedor.textContent =
      "Próximamente conocerás las organizaciones solidarias de nuestra ciudad.";
    return;
  }

  data.forEach(org => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "solidarioCard";

    const titulo = document.createElement("h2");
    titulo.textContent = org.nombre;

    const descripcion = document.createElement("p");
    descripcion.textContent = org.descripcion || "";

    tarjeta.append(titulo, descripcion);
    // Botón para conocer la institución
if (org.slug) {
  const botonFicha = document.createElement("a");
  botonFicha.className = "solidarioBoton";
  botonFicha.textContent = "Conocer institución →";
  botonFicha.href = `organizacion.html?slug=${encodeURIComponent(org.slug)}`;

  tarjeta.appendChild(botonFicha);
}

    if (org.enlace_donacion) {
      const boton = document.createElement("a");
      boton.className = "solidarioBoton";
      boton.textContent = "Donar";
      boton.href = org.enlace_donacion;
      boton.target = "_blank";
      boton.rel = "noopener noreferrer";

      tarjeta.appendChild(boton);
    }

    contenedor.appendChild(tarjeta);
  });
}

cargarOrganizaciones();
