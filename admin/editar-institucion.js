'use strict';
const SUPABASE_URL = 'https://ezyqqnyhsqgpxclpkbzq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vFfGaVSYjYXXzxvlrAds5A_qxu_Zvk9';
const ADMIN_ID = '7de52da5-e675-4709-8e43-23c7e0a0587b';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);
const id = new URLSearchParams(location.search).get('id');
const campos = ['nombre','slug','descripcion','telefono','whatsapp','email','direccion','sitio_web','logo_url','portada_url','imagen_url','color_principal','estilo_logo','donacion_titular','donacion_alias','enlace_donacion','revista_url'];
const booleanos = ['publicada','verificada','vista_previa'];
let original = null;

function mostrarVistaPrevia(campo, destino) {
  const url = $(campo).value.trim();
  const img = $(destino);
  if (!url || !/^https:\/\//i.test(url)) { img.hidden = true; img.removeAttribute('src'); return; }
  img.src = url;
  img.hidden = false;
}

async function iniciar() {
  try {
    if (!id || !/^\d+$/.test(id)) throw new Error('Falta un ID de institución válido en el enlace.');
    const {data:{user},error:authError} = await db.auth.getUser();
    if (authError || !user || user.id !== ADMIN_ID) throw new Error('Acceso exclusivo para la cuenta administradora.');
    const {data,error} = await db.from('organizaciones').select('*').eq('id',id).single();
    if (error) throw error;
    original = data;
    for (const campo of campos) {
      $(campo).value = data[campo] ?? (campo === 'color_principal' ? '#713ba5' : '');
    }
    for (const campo of booleanos) $(campo).checked = data[campo] === true;
    $('estado').textContent = `${data.nombre} · ${data.usuario_id ? 'Cuenta vinculada' : 'Sin cuenta asignada'}`;
    $('formulario').hidden = false;
    mostrarVistaPrevia('logo_url','previewLogo');
    mostrarVistaPrevia('portada_url','previewPortada');
  } catch (e) { $('estado').textContent = e.message; console.error(e); }
}

$('logo_url').addEventListener('input', () => mostrarVistaPrevia('logo_url','previewLogo'));
$('portada_url').addEventListener('input', () => mostrarVistaPrevia('portada_url','previewPortada'));
$('formulario').addEventListener('submit', async event => {
  event.preventDefault();
  if (!original) return;
  $('guardar').disabled = true;
  $('mensaje').textContent = 'Guardando...';
  try {
    const cambios = {};
    for (const campo of campos) {
      const valor = $(campo).value.trim();
      const nuevo = valor || null;
      if (nuevo !== (original[campo] ?? null)) cambios[campo] = nuevo;
    }
    for (const campo of booleanos) {
      if ($(campo).checked !== original[campo]) cambios[campo] = $(campo).checked;
    }
    if (!Object.keys(cambios).length) { $('mensaje').textContent = 'No hay cambios para guardar.'; return; }
    const {data,error} = await db.from('organizaciones').update(cambios).eq('id',id).select('*').single();
    if (error) throw error;
    original = data;
    $('estado').textContent = `${data.nombre} · ${data.usuario_id ? 'Cuenta vinculada' : 'Sin cuenta asignada'}`;
    $('mensaje').textContent = 'Cambios guardados correctamente.';
  } catch(e) { console.error(e); $('mensaje').textContent = `No se pudo guardar: ${e.message}`; }
  finally { $('guardar').disabled = false; }
});
iniciar();
