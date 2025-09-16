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
firebase.auth().onAuthStateChanged(user => { if (!user) window.location.href = 'index.html'; });

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const movimientoForm = document.getElementById('form-movimiento');
const filtroCategoriaSelect = document.getElementById('filtro-categoria');
const selectorProducto = document.getElementById('producto');
const tablaMovimientos = document.getElementById('tabla-movimientos');
const fotoInput = document.getElementById('foto');
const fotoPreview = document.getElementById('foto-preview');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const filtroTexto = document.getElementById('filtro-texto');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroFecha = document.getElementById('filtro-fecha');
const detailModalBackdrop = document.getElementById('detail-modal-backdrop');
const detailModal = document.getElementById('detail-modal');
const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');
const detailFotoContainer = document.getElementById('detail-foto-container');
const detailFoto = document.getElementById('detail-foto');
const detailProducto = document.getElementById('detail-producto');
const detailCategoria = document.getElementById('detail-categoria');
const detailTipo = document.getElementById('detail-tipo');
const detailCantidad = document.getElementById('detail-cantidad');
const detailResponsable = document.getElementById('detail-responsable');
const detailFecha = document.getElementById('detail-fecha');

// --- ESTADO GLOBAL ---
let todosLosProductos = [];
let todosLosMovimientos = [];

// --- LÓGICA DE FILTROS Y RENDERIZADO ---
const renderizarTabla = (movimientos) => {
    let html = '';
    if (movimientos.length === 0) {
        tablaMovimientos.innerHTML = `<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No se encontraron movimientos.</td></tr>`;
        return;
    }
    movimientos.forEach(mov => {
        const fecha = mov.fecha ? new Date(mov.fecha.seconds * 1000).toLocaleString('es-ES') : 'N/A';
        const tipoClaseBadge = mov.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const tipoClaseText = mov.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600';
        const fotoHtml = mov.fotoUrl 
            ? `<a href="${mov.fotoUrl}" target="_blank"><img src="${mov.fotoUrl}" class="h-10 w-10 rounded-full object-cover hover:scale-110 transition-transform"></a>` 
            : `<div class="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg></div>`;
        
        html += `<tr class="hover:bg-slate-50">
                    <td class="px-6 py-4">${fotoHtml}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${fecha}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${mov.productoNombre}</td>
                    <td class="px-6 py-4"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">${mov.productoCategoria || 'N/A'}</span></td>
                    <td class="px-6 py-4"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tipoClaseBadge}">${mov.tipo}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold ${tipoClaseText}">${mov.tipo === 'Entrada' ? '+' : '-'}${mov.cantidad}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${mov.responsable}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="view-detail-btn text-brand hover:text-brand-dark font-semibold" data-id="${mov.id}">Ver Detalle</button>
                    </td>
                </tr>`;
    });
    tablaMovimientos.innerHTML = html;
};

const aplicarFiltrosYRenderizar = () => {
    const texto = filtroTexto.value.toLowerCase();
    const tipo = filtroTipo.value;
    const fecha = filtroFecha.value;

    const movimientosFiltrados = todosLosMovimientos.filter(mov => {
        const matchTexto = mov.productoNombre.toLowerCase().includes(texto) || mov.responsable.toLowerCase().includes(texto);
        const matchTipo = tipo === 'Todos' || mov.tipo === tipo;
        const matchFecha = !fecha || new Date(mov.fecha.seconds * 1000).toISOString().slice(0, 10) === fecha;
        return matchTexto && matchTipo && matchFecha;
    });

    renderizarTabla(movimientosFiltrados);
};

db.collection('movimientos').orderBy('fecha', 'desc').onSnapshot(snapshot => {
    todosLosMovimientos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    aplicarFiltrosYRenderizar();
});

filtroTexto.addEventListener('keyup', aplicarFiltrosYRenderizar);
filtroTipo.addEventListener('change', aplicarFiltrosYRenderizar);
filtroFecha.addEventListener('change', aplicarFiltrosYRenderizar);

// --- LÓGICA DEL MODAL DE DETALLES ---
const mostrarDetalle = (movimiento) => {
    detailProducto.textContent = movimiento.productoNombre;
    detailCategoria.textContent = movimiento.productoCategoria || 'N/A';
    detailResponsable.textContent = movimiento.responsable;
    detailFecha.textContent = new Date(movimiento.fecha.seconds * 1000).toLocaleString('es-ES');
    const esEntrada = movimiento.tipo === 'Entrada';
    detailTipo.textContent = movimiento.tipo;
    detailTipo.className = `font-bold text-base ${esEntrada ? 'text-green-600' : 'text-red-600'}`;
    detailCantidad.textContent = `${esEntrada ? '+' : '-'}${movimiento.cantidad}`;
    detailCantidad.className = `font-bold text-base ${esEntrada ? 'text-green-600' : 'text-red-600'}`;
    if (movimiento.fotoUrl) {
        detailFoto.src = movimiento.fotoUrl;
        detailFotoContainer.classList.remove('hidden');
    } else {
        detailFotoContainer.classList.add('hidden');
    }
    detailModal.classList.remove('hidden');
    detailModalBackdrop.classList.remove('hidden');
};
const cerrarDetalle = () => {
    detailModal.classList.add('hidden');
    detailModalBackdrop.classList.add('hidden');
};
tablaMovimientos.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-detail-btn')) {
        const movId = e.target.dataset.id;
        const movimientoSeleccionado = todosLosMovimientos.find(m => m.id === movId);
        if (movimientoSeleccionado) mostrarDetalle(movimientoSeleccionado);
    }
});
closeDetailModalBtn.addEventListener('click', cerrarDetalle);
detailModalBackdrop.addEventListener('click', cerrarDetalle);


// --- LÓGICA DE FORMULARIO E IMÁGENES ---
const resizeAndEncodeImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            let width = img.width, height = img.height;
            if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
            else { if (height > MAX_WIDTH) { width *= MAX_WIDTH / height; height = MAX_WIDTH; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
    };
    reader.onerror = reject;
});

const cargarProductos = async () => {
    try {
        const snapshot = await db.collection('productos').orderBy('nombre').get();
        todosLosProductos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) { console.error("Error cargando productos: ", error); }
};

const poblarProductosPorCategoria = (categoria) => {
    selectorProducto.innerHTML = '<option value="" disabled selected>-- Elija un producto --</option>';
    const productosFiltrados = todosLosProductos.filter(p => p.categoria === categoria);
    if (productosFiltrados.length === 0) {
        selectorProducto.innerHTML = '<option value="" disabled>No hay productos</option>';
        selectorProducto.disabled = true; return;
    }
    productosFiltrados.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nombre} (Stock: ${p.stock})`;
        option.dataset.nombre = p.nombre;
        option.dataset.categoria = p.categoria;
        selectorProducto.appendChild(option);
    });
    selectorProducto.disabled = false;
};
filtroCategoriaSelect.addEventListener('change', (e) => poblarProductosPorCategoria(e.target.value));

fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            fotoPreview.src = event.target.result;
            fotoPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        fotoPreview.classList.add('hidden');
    }
});

movimientoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');

    const productoId = selectorProducto.value;
    const tipo = movimientoForm['tipo'].value;
    const cantidad = parseInt(movimientoForm['cantidad'].value);
    const responsable = movimientoForm['responsable'].value;
    const selectedOption = selectorProducto.options[selectorProducto.selectedIndex];
    const productoNombre = selectedOption.dataset.nombre;
    const productoCategoria = selectedOption.dataset.categoria;
    const fotoFile = fotoInput.files[0];
    let fotoUrl = null;

    if (!productoId || !cantidad || !responsable) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Complete todos los campos obligatorios.' });
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
        return;
    }

    if (fotoFile) {
        try {
            fotoUrl = await resizeAndEncodeImage(fotoFile);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error de Imagen', text: 'No se pudo procesar la imagen.' });
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
            return;
        }
    }

    try {
        await db.runTransaction(async (t) => {
            const productoRef = db.collection('productos').doc(productoId);
            const doc = await t.get(productoRef);
            if (tipo === 'Salida' && cantidad > doc.data().stock) throw new Error('No hay stock suficiente.');
            
            const movimientoRef = db.collection('movimientos').doc();
            t.set(movimientoRef, {
                productoId, productoNombre, productoCategoria, tipo, cantidad, responsable, fotoUrl,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            });
            t.update(productoRef, { stock: firebase.firestore.FieldValue.increment(tipo === 'Entrada' ? cantidad : -cantidad) });
        });
        
        Toast.fire({ icon: 'success', title: '¡Movimiento registrado!' });
        movimientoForm.reset();
        fotoPreview.classList.add('hidden');
        selectorProducto.innerHTML = '<option value="">-- Esperando categoría --</option>';
        selectorProducto.disabled = true;
        await cargarProductos();
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo registrar.' });
    } finally {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
    }
});

// --- INICIALIZACIÓN Y OTROS ---
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
document.addEventListener('DOMContentLoaded', cargarProductos);
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');
mobileMenuButton.addEventListener('click', () => sidebar.classList.toggle('-translate-x-full'));
const logoutButton = document.getElementById('logout-btn');
if(logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({ title: '¿Estás seguro?', text: "Tu sesión actual se cerrará.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: 'Sí, ¡cerrar sesión!', cancelButtonText: 'Cancelar' })
        .then(async (result) => { if (result.isConfirmed) { try { await firebase.auth().signOut(); } catch (error) { console.error('Error al cerrar sesión: ', error); } } });
    });
}