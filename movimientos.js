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
        window.location.href = 'index.html';
    }
});

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const movimientoForm = document.getElementById('form-movimiento');
const filtroCategoriaSelect = document.getElementById('filtro-categoria');
const selectorProducto = document.getElementById('producto');
const tablaMovimientos = document.getElementById('tabla-movimientos');

// --- ESTADO GLOBAL PARA ALMACENAR PRODUCTOS ---
let todosLosProductos = [];

// --- CARGAR TODOS LOS PRODUCTOS UNA VEZ Y ALMACENARLOS ---
const cargarProductos = async () => {
    try {
        const snapshot = await db.collection('productos').orderBy('nombre').get();
        todosLosProductos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error cargando productos: ", error);
        // Manejar el error, por ejemplo, mostrando una alerta
    }
};

// --- FILTRAR Y POBLAR EL SELECTOR DE PRODUCTOS ---
const poblarProductosPorCategoria = (categoria) => {
    // Limpiar selector de productos
    selectorProducto.innerHTML = '<option value="" disabled selected>-- Elija un producto --</option>';
    
    // Filtrar productos
    const productosFiltrados = todosLosProductos.filter(p => p.categoria === categoria);
    
    if (productosFiltrados.length === 0) {
        selectorProducto.innerHTML = '<option value="" disabled>No hay productos en esta categoría</option>';
        selectorProducto.disabled = true;
        return;
    }
    
    // Poblar el selector
    productosFiltrados.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = `${producto.nombre} (Stock: ${producto.stock})`;
        // Guardar datos adicionales para usarlos después
        option.dataset.nombre = producto.nombre;
        option.dataset.categoria = producto.categoria;
        selectorProducto.appendChild(option);
    });
    
    // Habilitar el selector de productos
    selectorProducto.disabled = false;
};

// --- EVENT LISTENER PARA EL FILTRO DE CATEGORÍA ---
filtroCategoriaSelect.addEventListener('change', (e) => {
    const categoriaSeleccionada = e.target.value;
    if (categoriaSeleccionada) {
        poblarProductosPorCategoria(categoriaSeleccionada);
    }
});

// --- MOSTRAR HISTORIAL DE MOVIMIENTOS (Sin cambios) ---
db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snapshot => {
    let html = '';
    if (snapshot.empty) {
        tablaMovimientos.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay movimientos registrados.</td></tr>`;
        return;
    }
    snapshot.forEach(doc => {
        const mov = doc.data();
        const fecha = mov.fecha ? mov.fecha.toDate().toLocaleString('es-ES') : 'Fecha no disponible';
        
        const tipoClaseBadge = mov.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const tipoClaseText = mov.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600';
        
        html += `
            <tr class="hover:bg-slate-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${fecha}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${mov.productoNombre}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">${mov.productoCategoria || 'N/A'}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tipoClaseBadge}">${mov.tipo}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${tipoClaseText}">${mov.tipo === 'Entrada' ? '+' : '-'}${mov.cantidad}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${mov.responsable}</td>
            </tr>
        `;
    });
    tablaMovimientos.innerHTML = html;
});

// --- REGISTRAR NUEVO MOVIMIENTO ---
movimientoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productoId = selectorProducto.value;
    const tipo = movimientoForm['tipo'].value;
    const cantidad = parseInt(movimientoForm['cantidad'].value);
    const responsable = movimientoForm['responsable'].value;
    
    const selectedOption = selectorProducto.options[selectorProducto.selectedIndex];
    const productoNombre = selectedOption.dataset.nombre;
    const productoCategoria = selectedOption.dataset.categoria;

    if (!productoId || !cantidad || !responsable) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Por favor, complete todos los campos.' });
        return;
    }

    const transaction = db.runTransaction(async (t) => {
        const productoRef = db.collection('productos').doc(productoId);
        const doc = await t.get(productoRef);
        
        const stockActual = doc.data().stock;
        if (tipo === 'Salida' && cantidad > stockActual) {
            throw new Error('No hay suficiente stock para esta salida.');
        }

        const movimientoRef = db.collection('movimientos').doc();
        t.set(movimientoRef, {
            productoId,
            productoNombre,
            productoCategoria,
            tipo,
            cantidad,
            responsable,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const cantidadActualizar = tipo === 'Entrada' ? cantidad : -cantidad;
        t.update(productoRef, { 
            stock: firebase.firestore.FieldValue.increment(cantidadActualizar) 
        });
    });

    try {
        await transaction;
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
        });
        Toast.fire({ icon: 'success', title: '¡Movimiento registrado!' });
        
        movimientoForm.reset();
        selectorProducto.innerHTML = '<option value="">-- Esperando categoría --</option>';
        selectorProducto.disabled = true;
        
        // Recargar el estado local de productos para tener el stock actualizado
        await cargarProductos(); 

    } catch (error) {
        console.error("Error al registrar el movimiento: ", error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo registrar el movimiento.' });
    }
});

// Cargar los productos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarProductos);

// --- LÓGICA DEL MENÚ Y CIERRE DE SESIÓN (Sin cambios) ---
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');
mobileMenuButton.addEventListener('click', () => sidebar.classList.toggle('-translate-x-full'));

const logoutButton = document.getElementById('logout-btn');
if(logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({
            title: '¿Estás seguro?', text: "Tu sesión actual se cerrará.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡cerrar sesión!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try { await firebase.auth().signOut(); } catch (error) { console.error('Error al cerrar sesión: ', error); }
            }
        });
    });
}