/* Asistente guiado de Mirá Belgrano: no solicita credenciales ni usa servicios externos */
(function(){
 if(document.getElementById('asistente-mira')) return;
 const root=document.createElement('aside');
 root.id='asistente-mira';
 root.setAttribute('aria-label','Asistente de ayuda Mirá Belgrano');
 root.innerHTML=`<section class="mira-panel" id="mira-panel" aria-label="Ayuda para usar el sitio">
 <header class="mira-cabecera"><strong>📍 Mirá te ayuda</strong><button class="mira-cerrar" type="button" aria-label="Cerrar asistente">×</button></header>
 <div class="mira-contenido"><p class="mira-intro">¡Hola! 👋 Soy Mirá, tu guía de Mirá Belgrano. ¿En qué te puedo ayudar?</p>
 <div class="mira-opciones"></div><div class="mira-respuesta" hidden aria-live="polite"></div>
 <button class="mira-volver" type="button" hidden>← Ver otras opciones</button></div></section>
 <button class="mira-launch" type="button" aria-expanded="false" aria-controls="mira-panel">
 <span class="mira-figura" aria-hidden="true">📍</span><span>¿Necesitás ayuda?</span></button>`;
 document.body.appendChild(root);
 const choices=[
 ['Quiero registrarme','Entrá a <a href="/registro.html">Crear cuenta</a>, ingresá tu correo y elegí una contraseña. Nunca me compartas tu contraseña.'],
 ['No puedo iniciar sesión','Entrá a <a href="/login.html">Ingresar</a> y verificá que uses el mismo correo con el que te registraste. Revisá si aparece algún mensaje de error.'],
 ['Olvidé mi contraseña','Para recuperar el acceso, usá el proceso de recuperación de tu cuenta. Si no encontrás esa opción en la pantalla de ingreso, consultá con la administración de Mirá Belgrano. No compartas códigos ni contraseñas.'],
 ['Quiero publicar mi comercio','Primero creá tu cuenta en <a href="/registro.html">Registrarme</a>. Después podrás entrar desde <a href="/login.html">Ingresar</a> y continuar con el alta de tu comercio.'],
 ['Soy una institución','Podés consultar la sección de <a href="/instituciones/">Instituciones</a>. Si recibiste un enlace de invitación, abrilo para iniciar la activación de tu perfil.']
 ];
 const options=root.querySelector('.mira-opciones'),answer=root.querySelector('.mira-respuesta'),back=root.querySelector('.mira-volver'),launch=root.querySelector('.mira-launch');
 choices.forEach(([label,html])=>{
  const b=document.createElement('button');b.type='button';b.textContent=label;
  b.addEventListener('click',()=>{options.hidden=true;answer.hidden=false;answer.innerHTML=html;back.hidden=false;});
  options.appendChild(b);
 });
 back.addEventListener('click',()=>{options.hidden=false;answer.hidden=true;back.hidden=true;});
 const toggle=()=>{const active=root.classList.toggle('mira-abierto');launch.setAttribute('aria-expanded',String(active));if(active)root.querySelector('.mira-cerrar').focus();else launch.focus();};
 launch.addEventListener('click',toggle);root.querySelector('.mira-cerrar').addEventListener('click',toggle);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('mira-abierto'))toggle();});
})();