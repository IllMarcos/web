// USA TUS CREDENCIALES DE FIREBASE
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
    // Si el usuario está autenticado y NO está en el dashboard, lo redirigimos.
    if (user && window.location.pathname.indexOf('dashboard.html') === -1) {
        window.location.href = 'dashboard.html';
    }
});

// --- LÓGICA EJECUTADA CUANDO EL DOM ESTÁ LISTO ---
document.addEventListener('DOMContentLoaded', () => {

    const submitButton = document.getElementById('submit-button');
    const btnText = submitButton.querySelector('.btn-text');
    const btnSpinner = submitButton.querySelector('.btn-spinner');

    // --- FUNCIÓN PARA MOSTRAR ESTADO DE CARGA ---
    const setLoading = (isLoading) => {
        if (isLoading) {
            submitButton.disabled = true;
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        } else {
            submitButton.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    };

    // --- MANEJO DE ERRORES CENTRALIZADO ---
    const handleAuthError = (error) => {
        let message = 'Ocurrió un error inesperado.';
        switch (error.code) {
            case 'auth/user-not-found': message = 'No se encontró un usuario con ese correo.'; break;
            case 'auth/wrong-password': message = 'La contraseña es incorrecta.'; break;
            case 'auth/email-already-in-use': message = 'El correo electrónico ya está registrado.'; break;
            case 'auth/weak-password': message = 'La contraseña debe tener al menos 6 caracteres.'; break;
            case 'auth/invalid-email': message = 'El formato del correo electrónico no es válido.'; break;
        }
        Swal.fire({ icon: 'error', title: 'Error de Autenticación', text: message });
    };

    // --- LÓGICA PARA EL FORMULARIO DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            setLoading(true);
            try {
                await auth.signInWithEmailAndPassword(email, password);
                // onAuthStateChanged se encargará de redirigir
            } catch (error) {
                handleAuthError(error);
                setLoading(false);
            }
        });
    }

    // --- LÓGICA PARA EL FORMULARIO DE REGISTRO (CORREGIDA) ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.name.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm['confirm-password'].value;

            if (password !== confirmPassword) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.' });
                return;
            }

            setLoading(true);

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                // 1. Actualiza el perfil de autenticación del usuario
                await userCredential.user.updateProfile({ displayName: name });

                // 2. **(LÍNEA CRÍTICA AÑADIDA)** Crea un documento en la colección 'users'
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                Swal.fire({ icon: 'success', title: '¡Registro exitoso!', text: 'Serás redirigido en un momento.', timer: 2000, showConfirmButton: false });
                
                // El listener onAuthStateChanged se encargará de la redirección
            } catch (error) {
                handleAuthError(error);
            } finally {
                setLoading(false);
            }
        });
    }
});