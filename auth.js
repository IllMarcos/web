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
const db = firebase.firestore();

// --- REFERENCIAS AL DOM ---
const authForm = document.getElementById('auth-form');
const toggleLink = document.getElementById('toggle-link');
const formTitle = document.getElementById('form-title');
const nameFieldContainer = document.getElementById('name-field-container');
const toggleText = document.getElementById('toggle-text');
const submitButton = document.getElementById('submit-button');
const btnText = submitButton.querySelector('.btn-text');
const btnSpinner = submitButton.querySelector('.btn-spinner');

// --- ESTADO DEL FORMULARIO ---
let isRegistering = false;

// --- VERIFICACIÓN DE SESIÓN ACTIVA ---
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = 'dashboard.html';
    }
});

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

// --- MANEJO DEL ENVÍO DEL FORMULARIO ---
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authForm.email.value;
    const password = authForm.password.value;
    const name = authForm.name.value;

    setLoading(true);

    try {
        if (isRegistering) {
            // --- MODO REGISTRO ---
            if (!name) {
                throw { code: 'auth/missing-name', message: 'Por favor, introduce tu nombre.' };
            }
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            // Actualizar perfil de usuario con su nombre
            await userCredential.user.updateProfile({ displayName: name });
            // Opcional: Guardar usuario en una colección de Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            Swal.fire({ icon: 'success', title: '¡Registro exitoso!', text: 'Serás redirigido en un momento.', timer: 2000, showConfirmButton: false });
        } else {
            // --- MODO LOGIN ---
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        let message = 'Ocurrió un error inesperado.';
        switch (error.code) {
            case 'auth/missing-name': message = error.message; break;
            case 'auth/user-not-found': message = 'No se encontró un usuario con ese correo.'; break;
            case 'auth/wrong-password': message = 'La contraseña es incorrecta.'; break;
            case 'auth/email-already-in-use': message = 'El correo electrónico ya está registrado.'; break;
            case 'auth/weak-password': message = 'La contraseña debe tener al menos 6 caracteres.'; break;
            case 'auth/invalid-email': message = 'El formato del correo electrónico no es válido.'; break;
        }
        Swal.fire({ icon: 'error', title: 'Error de Autenticación', text: message });
        setLoading(false);
    }
    // No necesitamos setLoading(false) en caso de éxito porque onAuthStateChanged redirigirá la página.
});

// --- CAMBIAR ENTRE LOGIN Y REGISTRO ---
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    authForm.reset();

    if (isRegistering) {
        formTitle.innerText = 'Crear Nueva Cuenta';
        btnText.innerText = 'Registrarse';
        toggleText.innerText = '¿Ya tienes una cuenta?';
        toggleLink.innerText = 'Inicia sesión';
        nameFieldContainer.classList.remove('hidden');
    } else {
        formTitle.innerText = 'Iniciar Sesión';
        btnText.innerText = 'Acceder';
        toggleText.innerText = '¿No tienes una cuenta?';
        toggleLink.innerText = 'Regístrate aquí';
        nameFieldContainer.classList.add('hidden');
    }
});