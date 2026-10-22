/**
 * Utilidades globales del cliente:
 *  - Tema de SweetAlert2 y visualización de mensajes flash del servidor.
 *  - Mostrar/ocultar contraseña.
 *  - Confirmación de cierre de sesión.
 */
(function () {
  const AeroSwal = Swal.mixin({
    customClass: { popup: 'aero-swal' },
    confirmButtonColor: 'hsl(192, 85%, 48%)',
    cancelButtonColor: 'hsl(216, 38%, 22%)',
    background: 'hsl(218, 45%, 14%)',
    color: 'hsl(210, 40%, 96%)',
    iconColor: undefined,
  });
  window.AeroSwal = AeroSwal;

  /** Construye una lista HTML segura (sin innerHTML con datos del usuario). */
  function buildList(items) {
    const ul = document.createElement('ul');
    ul.className = 'aero-swal-list';
    items.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
    return ul;
  }

  /** Muestra una notificación. Acepta { icon, title, text, list, toast }. */
  window.notify = function ({ icon = 'info', title = '', text = '', list = null, toast = false }) {
    if (toast) {
      return AeroSwal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title,
        text,
        showConfirmButton: false,
        timer: 3200,
        timerProgressBar: true,
      });
    }
    const options = { icon, title, confirmButtonText: 'Entendido' };
    if (list && list.length) options.html = buildList(list);
    else options.text = text;
    return AeroSwal.fire(options);
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Mensajes del servidor
    if (window.__FLASH__) window.notify(window.__FLASH__);

    // Mostrar / ocultar contraseña
    document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.querySelector(btn.dataset.togglePassword);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.querySelector('i').className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
        btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    });

    // Confirmar cierre de sesión
    document.querySelectorAll('form[data-confirm-logout]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        if (form.dataset.confirmed) return;
        e.preventDefault();
        AeroSwal.fire({
          icon: 'question',
          title: '¿Cerrar sesión?',
          text: 'Tendrás que autenticarte nuevamente para ingresar.',
          showCancelButton: true,
          confirmButtonText: 'Sí, salir',
          cancelButtonText: 'Cancelar',
        }).then((r) => {
          if (r.isConfirmed) {
            form.dataset.confirmed = '1';
            form.submit();
          }
        });
      });
    });
  });
})();
