/* Asistente guiado de Mirá Belgrano: no solicita credenciales ni usa servicios externos */
(function(){
 if(document.getElementById('asistente-mira')) return;
 const root=document.createElement('aside');
 root.id='asistente-mira';
 root.setAttribute('aria-label','Asistente de ayuda Mirá Belgrano');
 root.innerHTML=`<section class="mira-panel" id="mira-panel" aria-label="Ayuda para usar el sitio">
 <header class="mira-cabecera"><strong>📍 Mirá te ayuda</strong><button class="mira-cerrar" type="button" aria-label="Cerrar asistente">×</button></header>
 <div class="mira-contenido"><p class="mira-intro">¡Hola! 👋 Soy Mirá, tu guía de Mirá Belgrano. ¿En qué te puedo ayudar?</p>
 <div class="mira-conversacion" aria-live="polite"></div><div class="mira-opciones"></div><div class="mira-respuesta" hidden aria-live="polite"></div>
 <button class="mira-volver" type="button" hidden>← Ver otras opciones</button></div></section>
 <button class="mira-launch" type="button" aria-expanded="false" aria-controls="mira-panel">
 <span class="mira-figura" aria-hidden="true"><img class="mira-avatar" src="/mira-mascota-3d.png" alt="" width="84" height="84"><span class="mira-ojo mira-ojo-izq"><span class="mira-pupila"></span></span><span class="mira-ojo mira-ojo-der"><span class="mira-pupila"></span></span></span><span>¿Necesitás ayuda?</span></button>`;
 document.body.appendChild(root);
 const choices=[
 ['Quiero registrarme','Entrá a <a href="/registro.html">Crear cuenta</a>, ingresá tu correo y elegí una contraseña. Nunca me compartas tu contraseña.'],
 ['No puedo iniciar sesión','Entrá a <a href="/login.html">Ingresar</a> y verificá que uses el mismo correo con el que te registraste. Revisá si aparece algún mensaje de error.'],
 ['Olvidé mi contraseña','Para recuperar el acceso, usá el proceso de recuperación de tu cuenta. Si no encontrás esa opción en la pantalla de ingreso, consultá con la administración de Mirá Belgrano. No compartas códigos ni contraseñas.'],
 ['Quiero publicar mi comercio','¡Qué bueno que quieras formar parte de Mirá Belgrano! 🧡 Primero <a href="/registro.html">creá tu cuenta</a> con correo y contraseña. Si ya tenés cuenta, <a href="/login.html">iniciá sesión</a>. Desde tu panel podés gestionar la información de tu comercio. El registro de comercios es diferente al de instituciones.'],
 ['¿Cómo creo mi cuenta de comercio?','Entrá en <a href="/registro.html">Crear cuenta</a>, ingresá tu correo, una contraseña de al menos 6 caracteres y repetila para confirmarla. Luego usá <a href="/login.html">Ingresar</a> para acceder a tu panel. Nunca compartas tu contraseña por el chat.'],
 ['¿Cómo edito mi comercio?','Ingresá en <a href="/login.html">tu cuenta</a>. En el panel del comercio elegí <strong>Editar datos de mi comercio</strong> para actualizar la información de tu negocio.'],
 ['¿Cómo publico una promoción?','Ingresá en <a href="/login.html">tu panel</a> y buscá la sección <strong>Mis promociones</strong>. Presioná <strong>+ Nueva promoción</strong>, completá título, descripción y fechas; también podés adjuntar una imagen o video compatible. Luego elegí <strong>Publicar promoción</strong>. La disponibilidad de esta función puede depender de tu plan.'],
 ['¿Qué planes hay para comercios?','En el panel de tu comercio podés consultar las opciones de suscripción y sus precios vigentes, y gestionar la contratación mediante Mercado Pago. <a href="/login.html">Ingresar a mi panel</a>. Para evitar confusiones, revisá allí los valores y beneficios actuales antes de contratar.'],
 ['Soy una institución','¡Qué bueno que quieras participar de Belgrano Solidario! 💜 Para incorporar una institución necesitás una invitación de Mirá Belgrano. Si todavía no la recibiste, podés solicitar el alta por WhatsApp. <a href="https://wa.me/5492241408415?text=Hola%2C%20soy%20representante%20de%20una%20instituci%C3%B3n%20de%20General%20Belgrano%20y%20quisiera%20solicitar%20su%20incorporaci%C3%B3n%20a%20Belgrano%20Solidario%20en%20Mir%C3%A1%20Belgrano.%20%C2%BFMe%20podr%C3%ADan%20indicar%20c%C3%B3mo%20continuar%3F" target="_blank" rel="noopener noreferrer">📲 Solicitar incorporación por WhatsApp</a> Si ya tenés el enlace de invitación, abrilo: desde allí podés crear una cuenta o ingresar con una existente, confirmar tu correo y pulsar <strong>Activar mi institución</strong>. <strong>Importante:</strong> no alcanza con entrar directamente a la página de activación; necesitás el enlace personal que te enviaron. Nunca compartas tu contraseña ni el enlace de invitación.'],
 ['Recibí una invitación para mi institución','¡Genial! 💜 Abrí el enlace de invitación que te enviaron. Si no tenés cuenta, creala allí y confirmá tu correo. Si ya tenés una, iniciá sesión desde esa misma pantalla. Luego presioná <strong>Activar mi institución</strong>. Si aparece que la invitación venció o ya fue utilizada, comunicate con la administración para revisarla.'],
 ['Quiero sumar mi institución','Para participar en <strong>Belgrano Solidario</strong>, primero necesitás solicitar el alta a la administración de Mirá Belgrano. Cuando tu institución reciba su enlace personal de invitación, podrás registrar o ingresar a tu cuenta y activarla. No uses el registro de comercios: es un proceso diferente. <a href="https://wa.me/5492241408415?text=Hola%2C%20soy%20representante%20de%20una%20instituci%C3%B3n%20de%20General%20Belgrano%20y%20quisiera%20solicitar%20su%20incorporaci%C3%B3n%20a%20Belgrano%20Solidario%20en%20Mir%C3%A1%20Belgrano.%20%C2%BFMe%20podr%C3%ADan%20indicar%20c%C3%B3mo%20continuar%3F" target="_blank" rel="noopener noreferrer">📲 Solicitar incorporación por WhatsApp</a>']
 ];
 const options=root.querySelector('.mira-opciones'),answer=root.querySelector('.mira-respuesta'),back=root.querySelector('.mira-volver'),launch=root.querySelector('.mira-launch'),conversation=root.querySelector('.mira-conversacion');
 const addBubble=(content,who)=>{const bubble=document.createElement('div');bubble.className='mira-burbuja mira-burbuja-'+who;if(who==='mira')bubble.innerHTML=content;else bubble.textContent=content;conversation.appendChild(bubble);bubble.scrollIntoView({block:'nearest',behavior:'smooth'});};
 choices.forEach(([label,html])=>{
  const b=document.createElement('button');b.type='button';b.textContent=label;
  b.addEventListener('click',()=>{addBubble(label,'usuario');addBubble(html,'mira');options.hidden=true;answer.hidden=true;back.hidden=false;});
  options.appendChild(b);
 });
 back.addEventListener('click',()=>{options.hidden=false;answer.hidden=true;back.hidden=true;conversation.innerHTML='';});
 const toggle=()=>{const active=root.classList.toggle('mira-abierto');launch.setAttribute('aria-expanded',String(active));if(active){root.classList.remove('mira-saludo');void root.offsetWidth;root.classList.add('mira-saludo');root.querySelector('.mira-cerrar').focus();}else launch.focus();};
 launch.addEventListener('click',toggle);root.querySelector('.mira-cerrar').addEventListener('click',toggle);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('mira-abierto'))toggle();});
})();