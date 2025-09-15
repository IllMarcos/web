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
const db = firebase.firestore();

// --- GUARDIÁN DE AUTENTICACIÓN ---
firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        // Si no hay usuario, redirigir al login.
        window.location.href = 'index.html';
    }
});

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const movimientoForm = document.getElementById('form-movimiento');
const selectorProducto = document.getElementById('producto');
const tablaMovimientos = document.getElementById('tabla-movimientos');


// --- CARGAR PRODUCTOS EN EL SELECTOR ---
const cargarProductos = async () => {
    try {
        const snapshot = await db.collection('productos').orderBy('nombre').get();
        let html = '<option value="">Seleccione un producto...</option>';
        snapshot.forEach(doc => {
            const producto = doc.data();
            html += `<option value="${doc.id}">${producto.nombre} (Stock: ${producto.stock})</option>`;
        });
        selectorProducto.innerHTML = html;
    } catch (error) {
        console.error("Error cargando productos: ", error);
    }
};

// --- MOSTRAR HISTORIAL DE MOVIMIENTOS ---
db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snapshot => {
    let html = '';
    if (snapshot.empty) {
        tablaMovimientos.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No hay movimientos registrados.</td></tr>`;
        return;
    }
    snapshot.forEach(doc => {
        const mov = doc.data();
        const fecha = mov.fecha ? mov.fecha.toDate().toLocaleString('es-ES') : 'Fecha no disponible';
        const tipoClase = mov.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600';
        html += `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${fecha}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${mov.productoNombre}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${tipoClase}">${mov.tipo}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${mov.cantidad}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${mov.responsable}</td>
            </tr>
        `;
    });
    tablaMovimientos.innerHTML = html;
});

// --- REGISTRAR NUEVO MOVIMIENTO ---
movimientoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productoId = movimientoForm['producto'].value;
    const tipo = movimientoForm['tipo'].value;
    const cantidad = parseInt(movimientoForm['cantidad'].value);
    const responsable = movimientoForm['responsable'].value;
    const productoNombre = selectorProducto.options[selectorProducto.selectedIndex].text;

    if (!productoId || !cantidad || !responsable) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Por favor, complete todos los campos.' });
        return;
    }

    try {
        const batch = db.batch();
        const movimientoRef = db.collection('movimientos').doc();
        batch.set(movimientoRef, {
            productoId,
            productoNombre,
            tipo,
            cantidad,
            responsable,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        const productoRef = db.collection('productos').doc(productoId);
        const cantidadActualizar = tipo === 'Entrada' ? cantidad : -cantidad;
        batch.update(productoRef, { 
            stock: firebase.firestore.FieldValue.increment(cantidadActualizar) 
        });
        
        await batch.commit();

        // *** MEJORA: Notificación "Toast" de éxito ***
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        Toast.fire({ icon: 'success', title: '¡Movimiento registrado!' });
        
        movimientoForm.reset();

    } catch (error) {
        console.error("Error al registrar el movimiento: ", error);
        // *** MEJORA: Alerta de error con SweetAlert2 ***
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo registrar el movimiento. Revise el stock si intenta hacer una salida.'
        });
    }
});

// Cargar los productos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarProductos);

// --- LÓGICA PARA EL MENÚ RESPONSIVE ---
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');

mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
});

// --- LÓGICA PARA CERRAR SESIÓN ---
const logoutButton = document.getElementById('logout-btn');
if(logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await firebase.auth().signOut();
            // El guardián de autenticación se encargará de redirigir
        } catch (error) {
            console.error('Error al cerrar sesión: ', error);
        }
    });
}