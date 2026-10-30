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
 <span class="mira-figura" aria-hidden="true"><svg viewBox="0 0 80 100" width="64" height="80" role="img"><defs><linearGradient id="miraColor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd127"/><stop offset=".45" stop-color="#ff9414"/><stop offset="1" stop-color="#f25a12"/></linearGradient></defs><ellipse cx="40" cy="96" rx="21" ry="3" fill="#f9c98c" opacity=".5"/><path d="M40 16C21 16 9 31 11 50c2 18 20 35 29 45 10-11 27-28 29-45 2-19-10-34-29-34Z" fill="url(#miraColor)" stroke="#e7740d" stroke-width="1.5"/><path d="M25 12Q17 6 17 1Q28 2 33 13Z" fill="#ffb900"/><path d="M37 13Q33 2 40 0Q48 3 44 13Z" fill="#ff3c55"/><path d="M48 13Q57 2 64 3Q62 11 54 16Z" fill="#6c2389"/><ellipse cx="28" cy="43" rx="10" ry="12" fill="white"/><ellipse cx="52" cy="43" rx="10" ry="12" fill="white"/><g class="mira-pupilas"><circle cx="30" cy="44" r="7" fill="#512414"/><circle cx="54" cy="44" r="7" fill="#512414"/><circle cx="32" cy="41" r="2.5" fill="white"/><circle cx="56" cy="41" r="2.5" fill="white"/></g><path d="M32 60Q40 72 49 60Z" fill="#6c1d22"/><ellipse cx="40" cy="78" rx="10" ry="11" fill="#fff6e7"/><path d="M65 60Q79 49 75 40" fill="none" stroke="#ff8a0e" stroke-width="8" stroke-linecap="round"/><circle cx="75" cy="39" r="5" fill="#ffa520"/></svg></span><span>¿Necesitás ayuda?</span></button>`;
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