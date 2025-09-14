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
const db = firebase.firestore();

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