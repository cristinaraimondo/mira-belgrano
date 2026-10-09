
let eventoInstalacion = null;

const btnInstalar = document.getElementById("btnInstalar");

const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

const instalada = window.matchMedia(
  "(display-mode: standalone)"
).matches || window.navigator.standalone === true;

if (btnInstalar && !instalada) {

  // Android y navegadores compatibles
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    eventoInstalacion = evento;
    btnInstalar.hidden = false;
  });

  // iPhone y iPad
  if (esIOS) {
    btnInstalar.hidden = false;
  }

  btnInstalar.addEventListener("click", async () => {

    if (eventoInstalacion) {
      eventoInstalacion.prompt();
      await eventoInstalacion.userChoice;
      eventoInstalacion = null;
      btnInstalar.hidden = true;

    } else if (esIOS) {
      alert(
        "Para instalar MiráBelgrano:\n\n" +
        "1. Abrí esta página en Safari.\n" +
        "2. Tocá Compartir o el menú de opciones.\n" +
        "3. Elegí 'Agregar a pantalla de inicio'."
      );
    }

  });

  window.addEventListener("appinstalled", () => {
    eventoInstalacion = null;
    btnInstalar.hidden = true;
  });
}
