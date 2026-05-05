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
                const { data, error } = await window.supabase.auth.signInWithOAuth({
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
            const email = emailField.value.trim();
            if (!email) return showToast("Ingresa tu email para restablecer contraseña ⚠️", "#eab308");
            
            try {
                showToast("Enviando enlace... 📧");
                const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/app/'
                });
                if (error) throw error;
                showToast("Email de restablecimiento enviado ✅", "#22c55e");
            } catch (error) {
                showToast("Error: " + error.message, "#ef4444");
            }
        };
    }

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
