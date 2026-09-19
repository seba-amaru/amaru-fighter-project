import { SupabaseService } from '../services/supabaseService.js';

export const initAuthUI = (switchScreen, renderMembershipPlans) => {
    const showToast = window.showToast || ((msg) => console.log(msg));

    // --- Register Actions ---
    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) {
        btnRegister.onclick = async () => {
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value;

            if (!name || !email || !pass) return showToast("Por favor llena todos los campos ⚠️", "#eab308");

            try {
                showToast("Creando cuenta... 🥋");
                const { data: authData, error: authError } = await window.supabase.auth.signUp({
                    email,
                    password: pass,
                    options: { data: { full_name: name } }
                });

                if (authError) throw authError;

                const user = { ...authData.user, uid: authData.user.id };
                await SupabaseService.createProfile(user, name);

                showToast("¡Cuenta creada con éxito! 🚀");

                setTimeout(() => {
                    const authScreen = document.getElementById('auth-screen');
                    const memScreen = document.getElementById('membership-selection-screen');
                    if (authScreen) authScreen.classList.add('hidden');
                    if (memScreen) {
                        renderMembershipPlans();
                        memScreen.classList.remove('hidden');
                    } else {
                        document.getElementById('app-container').classList.remove('hidden');
                        switchScreen('dashboard');
                    }
                }, 1500);

            } catch (error) {
                console.error(error);
                let errorMsg = "Error al registrar la cuenta";
                if (error.code === 'auth/invalid-email') errorMsg = "El correo no tiene un formato válido.";
                else if (error.code === 'auth/email-already-in-use') errorMsg = "Este correo electrónico ya está registrado.";
                else if (error.code === 'auth/weak-password') errorMsg = "La contraseña es muy débil (mín. 6 caracteres).";
                else if (error.message) errorMsg += ": " + error.message;

                showToast(errorMsg + " ❌", "#ef4444");
            }
        };
    }

    // Toggle Forms
    const goToReg = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    const loginCont = document.getElementById('login-form-container');
    const regCont = document.getElementById('register-form-container');

    if (goToReg) goToReg.onclick = () => {
        loginCont.classList.add('hidden');
        regCont.classList.remove('hidden');
    };
    if (goToLogin) goToLogin.onclick = () => {
        regCont.classList.add('hidden');
        loginCont.classList.remove('hidden');
    };

    // --- Login Actions ---
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.onclick = async () => {
            const emailField = document.getElementById('login-email');
            const passField = document.getElementById('login-password');
            let email = emailField.value;
            let pass = passField.value;

            if (email.toLowerCase().trim() === 'admin') {
                email = 'admin@amaru.app';
                showToast("Acceso Maestro 🛡️");
            }

            if (!email || !pass) return showToast("Faltan datos ⚠️", "#eab308");
            try {
                const { error } = await window.supabase.auth.signInWithPassword({ email, password: pass });
                if (error) throw error;
                showToast("¡Bienvenido! 🥋");
            } catch (error) {
                showToast("Error de acceso: " + error.message, "#ef4444");
            }
        };
    }

    // Google Login Action
    const btnGoogle = document.getElementById('btn-google-login');
    if (btnGoogle) {
        btnGoogle.onclick = async () => {
            try {
                showToast("Conectando con Google... 🚀");
                const { error } = await window.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                if (error) throw error;
            } catch (error) {
                showToast("Error al conectar con Google ❌", "#ef4444");
                console.error("Google Auth Error:", error);
            }
        };
    }

    // --- Forgot Password Action ---
    const btnForgot = document.getElementById('btn-forgot-password');
    if (btnForgot) {
        btnForgot.onclick = async () => {
            const emailField = document.getElementById('login-email');
            let email = emailField ? emailField.value.trim() : '';

            if (!email) {
                if (window.Swal) {
                    const { value: inputEmail } = await window.Swal.fire({
                        title: 'Recuperar Contraseña 🔐',
                        text: 'Ingresa el correo electrónico con el que te registraste en Amaru App:',
                        input: 'email',
                        inputPlaceholder: 'tu@email.com',
                        showCancelButton: true,
                        confirmButtonText: 'Enviar Enlace 📧',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#8b5cf6',
                        background: '#09090B',
                        color: '#fff',
                        inputValidator: (val) => {
                            if (!val || !val.includes('@')) {
                                return 'Por favor ingresa un correo electrónico válido.';
                            }
                        }
                    });
                    if (!inputEmail) return;
                    email = inputEmail.trim();
                } else {
                    const res = prompt('Ingresa tu correo electrónico para restablecer contraseña:');
                    if (!res) return;
                    email = res.trim();
                }
            }

            try {
                showToast("Enviando enlace de recuperación... 📧", "#8b5cf6");
                const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/app/'
                });
                if (error) throw error;

                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'success',
                        title: '¡Correo Enviado! 📬',
                        html: `Hemos enviado las instrucciones para restablecer tu contraseña a:<br><strong style="color: #a855f7;">${email}</strong>.<br><br><small style="color: #94a3b8;">Abre el enlace recibido en tu correo para crear tu nueva contraseña. Revisa también la carpeta de Spam.</small>`,
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#8b5cf6',
                        background: '#09090B',
                        color: '#fff'
                    });
                } else {
                    showToast("Email de restablecimiento enviado ✅", "#22c55e");
                }
            } catch (error) {
                console.error('[Auth] Error resetPasswordForEmail:', error);
                showToast("Error: " + (error.message || 'No se pudo enviar el correo'), "#ef4444");
            }
        };
    }

    // Inicializar manejador de restablecimiento de contraseña entrante
    initPasswordRecoveryHandler();

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.onclick = async () => {
            localStorage.removeItem('isAdminMode'); // Clear mode on logout
            await window.supabase.auth.signOut();
            window.location.reload();
        };
    }
};

/**
 * Maneja el flujo cuando un usuario llega a la app desde el link de su correo (type=recovery)
 */
export const initPasswordRecoveryHandler = () => {
    const recoveryModal = document.getElementById('password-recovery-modal');
    const recoveryForm = document.getElementById('password-recovery-form');
    const newPassInput = document.getElementById('recovery-new-password');
    const confirmPassInput = document.getElementById('recovery-confirm-password');

    const openRecoveryModal = () => {
        if (!recoveryModal) return;
        recoveryModal.style.display = 'flex';
        recoveryModal.classList.add('active');
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        if (newPassInput) newPassInput.focus();
    };

    const closeRecoveryModal = () => {
        if (!recoveryModal) return;
        recoveryModal.style.display = 'none';
        recoveryModal.classList.remove('active');
        if (recoveryForm) recoveryForm.reset();
    };

    // Detección automática en URL (Hash o Query con type=recovery)
    const checkUrlForRecovery = () => {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        if (hash.includes('type=recovery') || search.includes('type=recovery')) {
            openRecoveryModal();
        }
    };

    checkUrlForRecovery();

    // Listener de eventos de autenticación de Supabase
    if (window.supabase && window.supabase.auth) {
        window.supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                openRecoveryModal();
            }
        });
    }

    if (recoveryForm) {
        recoveryForm.onsubmit = async (e) => {
            e.preventDefault();
            const newPassword = newPassInput?.value?.trim();
            const confirmPassword = confirmPassInput?.value?.trim();

            if (!newPassword || newPassword.length < 6) {
                if (window.showToast) window.showToast('La contraseña debe tener al menos 6 caracteres ⚠️', '#ef4444');
                return;
            }
            if (newPassword !== confirmPassword) {
                if (window.showToast) window.showToast('Las contraseñas no coinciden ❌', '#ef4444');
                return;
            }

            try {
                if (window.showToast) window.showToast('Actualizando contraseña... 🔐', '#8b5cf6');
                const { error } = await window.supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;

                closeRecoveryModal();

                // Limpiar fragmento de URL
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname);
                }

                if (window.Swal) {
                    await window.Swal.fire({
                        icon: 'success',
                        title: '¡Contraseña Actualizada! 🥋',
                        text: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes ingresar a tu cuenta con tu nueva clave.',
                        confirmButtonText: 'Continuar a la App',
                        confirmButtonColor: '#8b5cf6',
                        background: '#09090B',
                        color: '#fff'
                    });
                } else if (window.showToast) {
                    window.showToast('¡Contraseña actualizada exitosamente! 🥋', '#22c55e');
                }

                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (err) {
                console.error('[Auth] Error updating password:', err);
                if (window.showToast) {
                    window.showToast('Error: ' + (err.message || 'No se pudo actualizar la contraseña'), '#ef4444');
                }
            }
        };
    }
};
