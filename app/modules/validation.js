/**
 * Real-time form validation module
 * Validates email and password as user types
 */

export const Validation = {
    emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    init() {
        this.setupEmailValidation();
        this.setupPasswordValidation();
        this.setupPasswordResetValidation();
    },

    setupEmailValidation() {
        const emailInputs = document.querySelectorAll('input[type="email"], input[name="email"]');
        emailInputs.forEach(input => {
            const wrapper = input.closest('.auth-input-wrapper');
            if (!wrapper) return;

            let icon = wrapper.querySelector('.validation-icon');
            if (!icon) {
                icon = document.createElement('i');
                icon.className = 'validation-icon';
                icon.setAttribute('data-lucide', 'check-circle');
                wrapper.appendChild(icon);
            }

            let msg = wrapper.parentElement.querySelector('.validation-message');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'validation-message';
                wrapper.parentElement.appendChild(msg);
            }

            input.addEventListener('input', () => {
                const val = input.value.trim();
                if (val.length === 0) {
                    this.clearState(input, icon, msg);
                    return;
                }
                const isValid = this.emailRegex.test(val);
                this.setState(input, icon, msg, isValid,
                    isValid ? 'Email válido' : 'Ingresa un email válido'
                );
            });
        });
    },

    setupPasswordValidation() {
        const passwordInputs = document.querySelectorAll('input[type="password"]:not(#reset-email)');
        passwordInputs.forEach(input => {
            const wrapper = input.closest('.auth-input-wrapper');
            if (!wrapper) return;
            const group = wrapper.parentElement;

            let strengthContainer = group.querySelector('.password-strength');
            if (!strengthContainer) {
                strengthContainer = document.createElement('div');
                strengthContainer.className = 'password-strength';
                for (let i = 0; i < 4; i++) {
                    const seg = document.createElement('div');
                    seg.className = 'strength-segment';
                    strengthContainer.appendChild(seg);
                }
                const label = document.createElement('span');
                label.className = 'strength-label';
                strengthContainer.appendChild(label);
                group.appendChild(strengthContainer);
            }

            input.addEventListener('input', () => {
                const val = input.value;
                const result = this.checkPasswordStrength(val);
                this.updateStrengthIndicator(strengthContainer, result);
            });
        });
    },

    setupPasswordResetValidation() {
        const resetEmail = document.getElementById('reset-email');
        if (!resetEmail) return;

        const btn = document.getElementById('btn-send-reset');
        resetEmail.addEventListener('input', () => {
            if (btn) {
                btn.disabled = !this.emailRegex.test(resetEmail.value.trim());
                btn.style.opacity = btn.disabled ? '0.5' : '1';
            }
        });
    },

    checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const labels = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
        const classes = ['weak', 'weak', 'fair', 'good', 'strong'];
        return {
            score,
            label: labels[score],
            className: classes[score]
        };
    },

    updateStrengthIndicator(container, result) {
        const segments = container.querySelectorAll('.strength-segment');
        const label = container.querySelector('.strength-label');

        segments.forEach((seg, i) => {
            seg.className = 'strength-segment';
            if (i < result.score) {
                seg.classList.add('filled', result.className);
            }
        });

        if (label) {
            label.textContent = result.label;
            label.className = `strength-label ${result.className}`;
        }
    },

    setState(input, icon, msg, isValid, message) {
        input.classList.remove('is-valid', 'is-invalid');
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');
        icon.classList.add('visible');
        icon.setAttribute('data-lucide', isValid ? 'check-circle' : 'x-circle');
        if (window.lucide) window.lucide.createIcons();
        msg.textContent = message;
        msg.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
    },

    clearState(input, icon, msg) {
        input.classList.remove('is-valid', 'is-invalid');
        icon.classList.remove('visible');
        msg.textContent = '';
        msg.className = 'validation-message';
    }
};
