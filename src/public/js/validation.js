/**
 * Validación del lado del cliente.
 * Reglas equivalentes a src/utils/validators.js (el servidor siempre vuelve a validar).
 *
 * Uso: <form data-validate> con campos que declaren:
 *   data-rule="email|digits|letters|password|text"  data-label="Nombre visible"
 *   data-min / data-max (longitud)   data-match="#idCampo" (confirmación)
 *   required
 */
(function () {
  const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    digits: /^\d+$/,
    letters: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/,
    password: /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/,
  };

  const MESSAGES = {
    email: 'Ingresa un correo electrónico válido.',
    digits: 'Solo se permiten números.',
    letters: 'Solo se permiten letras y espacios.',
    password: 'Mínimo 8 caracteres, con letras y números.',
  };

  const normalize = (v) => v.trim().replace(/\s+/g, ' ');

  function setFeedback(field, message) {
    const wrapper = field.closest('.field') || field.parentElement;
    let fb = wrapper.querySelector('.invalid-feedback');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      wrapper.appendChild(fb);
    }
    fb.textContent = message || '';
    fb.style.display = message ? 'block' : 'none';
    field.classList.toggle('is-invalid', !!message);
    field.classList.toggle('is-valid', !message && field.value !== '');
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  /** Devuelve '' si es válido o el mensaje de error. */
  function validateField(field) {
    const label = field.dataset.label || field.name;
    const rule = field.dataset.rule;
    const raw = field.type === 'password' ? field.value : normalize(field.value);

    if (field.required && raw === '') return `${label}: este campo es obligatorio.`;
    if (raw === '') return '';

    if (rule && PATTERNS[rule] && !PATTERNS[rule].test(raw)) return `${label}: ${MESSAGES[rule]}`;

    const min = Number(field.dataset.min || 0);
    const max = Number(field.dataset.max || 0);
    if (min && raw.length < min) return `${label}: mínimo ${min} caracteres.`;
    if (max && raw.length > max) return `${label}: máximo ${max} caracteres.`;

    if (field.dataset.match) {
      const other = document.querySelector(field.dataset.match);
      if (other && other.value !== field.value) return 'Las contraseñas no coinciden.';
    }
    return '';
  }

  /** Bloquea la escritura de caracteres no permitidos en tiempo real. */
  function attachInputFilter(field) {
    const rule = field.dataset.rule;
    if (rule === 'digits') {
      field.addEventListener('input', () => {
        const clean = field.value.replace(/\D/g, '');
        if (clean !== field.value) field.value = clean;
      });
    }
    if (rule === 'letters') {
      field.addEventListener('input', () => {
        const clean = field.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
        if (clean !== field.value) field.value = clean;
      });
    }
  }

  function attachStrengthMeter(field) {
    const meter = document.querySelector(field.dataset.meter);
    if (!meter) return;
    const bar = meter.querySelector('span');
    field.addEventListener('input', () => {
      const v = field.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Za-z]/.test(v) && /\d/.test(v)) score++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) score++;
      const colors = ['transparent', 'hsl(350,89%,66%)', 'hsl(42,96%,62%)', 'hsl(190,90%,60%)', 'hsl(158,64%,52%)'];
      bar.style.width = `${score * 25}%`;
      bar.style.background = colors[score];
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[data-validate]').forEach((form) => {
      const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter(
        (f) => f.name && f.type !== 'hidden'
      );

      fields.forEach((field) => {
        attachInputFilter(field);
        if (field.dataset.meter) attachStrengthMeter(field);
        field.addEventListener('blur', () => setFeedback(field, validateField(field)));
        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) setFeedback(field, validateField(field));
        });
      });

      form.addEventListener('submit', (e) => {
        const empty = [];
        const errors = [];

        fields.forEach((field) => {
          const msg = validateField(field);
          setFeedback(field, msg);
          if (!msg) return;
          const value = field.type === 'password' ? field.value : normalize(field.value);
          if (field.required && value === '') empty.push(field.dataset.label || field.name);
          else errors.push(msg);
        });

        if (empty.length || errors.length) {
          e.preventDefault();
          const firstInvalid = form.querySelector('.is-invalid');
          if (firstInvalid) firstInvalid.focus();

          if (empty.length) {
            window.notify({
              icon: 'warning',
              title: 'Campos vacíos',
              list: [`Completa los siguientes campos: ${empty.join(', ')}.`, ...errors],
            });
          } else {
            window.notify({ icon: 'error', title: 'Revisa el formulario', list: errors });
          }
          return;
        }

        // Evitar doble envío
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
        }
      });
    });
  });
})();
