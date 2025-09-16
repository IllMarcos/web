// USA TUS CREDENCIALES DE FIREBASE (Proyecto: invmanager-c65e5)
const firebaseConfig = {
  apiKey: "AIzaSyDoHcb-o76loZISfEaVGWJDIUERUFLItcY",
  authDomain: "invmanager-c65e5.firebaseapp.com",
  projectId: "invmanager-c65e5",
  storageBucket: "invmanager-c65e5.firebasestorage.app",
  messagingSenderId: "1071016735940",
  appId: "1:1071016735940:web:9731e5c64eb6564a318591",
  measurementId: "G-CH38NYWBTP"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- VERIFICACIÓN DE SESIÓN ACTIVA ---
auth.onAuthStateChanged(user => {
    if (user && !window.location.href.includes('dashboard.html')) {
        window.location.href = 'dashboard.html';
    }
});

// --- LÓGICA EJECUTADA CUANDO EL DOM ESTÁ LISTO ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- MANEJO DE ERRORES CENTRALIZADO ---
    const handleAuthError = (error) => {
        console.error("Error de autenticación:", error.code, error.message);
        let message = 'Ocurrió un error inesperado. Revisa la consola para más detalles.';
        switch (error.code) {
            case 'auth/user-not-found': message = 'No se encontró un usuario con ese correo.'; break;
            case 'auth/wrong-password': message = 'La contraseña es incorrecta.'; break;
            case 'auth/email-already-in-use': message = 'El correo electrónico ya está registrado.'; break;
            case 'auth/weak-password': message = 'La contraseña debe tener al menos 6 caracteres.'; break;
            case 'auth/invalid-email': message = 'El formato del correo electrónico no es válido.'; break;
            case 'permission-denied': message = 'Permiso denegado. Revisa tus reglas de seguridad de Firestore.'; break;
        }
        Swal.fire({ icon: 'error', title: 'Error de Autenticación', text: message });
    };

    // --- FUNCIÓN PARA MOSTRAR ESTADO DE CARGA ---
    const setLoading = (form, isLoading) => {
        const submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) return;
        const btnText = submitButton.querySelector('.btn-text');
        const btnSpinner = submitButton.querySelector('.btn-spinner');

        submitButton.disabled = isLoading;
        if (btnText) btnText.classList.toggle('hidden', isLoading);
        if (btnSpinner) btnSpinner.classList.toggle('hidden', !isLoading);
    };

    // --- LÓGICA PARA EL FORMULARIO DE LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(loginForm, true);
            try {
                const email = loginForm.email.value;
                const password = loginForm.password.value;
                await auth.signInWithEmailAndPassword(email, password);
                // El listener onAuthStateChanged se encargará de redirigir
            } catch (error) {
                handleAuthError(error);
                setLoading(loginForm, false);
            }
        });
    }

    // --- LÓGICA PARA EL FORMULARIO DE REGISTRO ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.name.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;

            if (!name || !email || !password) {
                Swal.fire({ icon: 'error', title: 'Campos incompletos', text: 'Por favor, rellena todos los campos.' });
                return;
            }

            if (password !== confirmPassword) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.' });
                return;
            }
            
            setLoading(registerForm, true);

            try {
                // 1. Crear el usuario en el servicio de autenticación
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Guardar el nombre en el perfil de Auth y el documento en Firestore SIMULTÁNEAMENTE
                await Promise.all([
                    user.updateProfile({ displayName: name }),
                    db.collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    })
                ]);

                Swal.fire({ icon: 'success', title: '¡Registro exitoso!', text: 'Serás redirigido.', timer: 2000, showConfirmButton: false });
                
            } catch (error) {
                handleAuthError(error);
                setLoading(registerForm, false);
            }
        });
    }
});