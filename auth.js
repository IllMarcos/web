// USA TUS CREDENCIALES DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD9s36TSYt4gr3RI3JoAdCdKuNN0d6c5hw",
  authDomain: "miinventario-9ede6.firebaseapp.com",
  projectId: "miinventario-9ede6",
  storageBucket: "miinventario-9ede6.firebasestorage.app",
  messagingSenderId: "1014375007767",
  appId: "1:1014375007767:web:81acf1536fa301f119be52",
  measurementId: "G-N9DNVDVNYP"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const loginForm = document.getElementById('login-form');
const toggleRegisterLink = document.getElementById('toggle-register');
const formTitle = document.getElementById('form-title');
let isRegistering = false;

// Comprobar si el usuario ya está logueado
auth.onAuthStateChanged(user => {
    if (user) {
        // Si hay un usuario, lo redirigimos al dashboard
        window.location.href = 'dashboard.html';
    }
});


// Manejar el envío del formulario
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    try {
        if (isRegistering) {
            // --- MODO REGISTRO ---
            await auth.createUserWithEmailAndPassword(email, password);
            Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                text: 'Ahora serás redirigido al inventario.',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            // --- MODO LOGIN ---
            await auth.signInWithEmailAndPassword(email, password);
        }
        // La redirección ocurrirá automáticamente gracias a onAuthStateChanged
    } catch (error) {
        // Manejar errores de Firebase
        let message = 'Ocurrió un error inesperado.';
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No se encontró un usuario con ese correo electrónico.';
                break;
            case 'auth/wrong-password':
                message = 'La contraseña es incorrecta.';
                break;
            case 'auth/email-already-in-use':
                message = 'El correo electrónico ya está registrado.';
                break;
            case 'auth/weak-password':
                message = 'La contraseña debe tener al menos 6 caracteres.';
                break;
        }
        Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: message
        });
    }
});

// Cambiar entre modo Login y Registro
toggleRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    
    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (isRegistering) {
        formTitle.innerText = 'Crear Nueva Cuenta';
        submitButton.innerText = 'Registrarse';
        toggleRegisterLink.innerHTML = '¿Ya tienes una cuenta? <strong>Inicia sesión</strong>';
    } else {
        formTitle.innerText = 'Iniciar Sesión';
        submitButton.innerText = 'Acceder';
        toggleRegisterLink.innerHTML = '¿No tienes una cuenta? <strong>Regístrate aquí</strong>';
    }
});