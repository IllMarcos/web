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
const productForm = document.getElementById('form-producto');
const inventoryTable = document.getElementById('tabla-inventario');
const formTitle = document.getElementById('form-title');
const saveButton = document.getElementById('btn-save');
const searchInput = document.getElementById('search-input');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfo = document.getElementById('page-info');

// --- ESTADO DE LA APLICACIÓN ---
let editMode = false;
let idToEdit = '';
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const rowsPerPage = 10;

// --- FUNCIÓN PARA RENDERIZAR LA TABLA (AHORA CON CATEGORÍA) ---
const renderTable = () => {
    inventoryTable.innerHTML = '';
    
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages) || 1;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);

    if (paginatedProducts.length === 0 && allProducts.length > 0) {
        inventoryTable.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No se encontraron productos con ese filtro.</td></tr>`;
    } else if (allProducts.length === 0) {
        inventoryTable.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Aún no hay productos.</td></tr>`;
    }

    paginatedProducts.forEach(product => {
        const row = document.createElement('tr');
        // Se ajusta la clase para el diseño responsivo y se añade la celda de categoría
        row.className = 'hover:bg-slate-50 md:table-row flex flex-col mb-4 md:mb-0';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 md:table-cell"><span class="md:hidden font-bold pr-2">Código:</span>${product.data.codigo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 md:table-cell"><span class="md:hidden font-bold pr-2">Nombre:</span>${product.data.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 md:table-cell"><span class="md:hidden font-bold pr-2">Categoría:</span><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">${product.data.categoria || 'Sin categoría'}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm md:table-cell"><span class="md:hidden font-bold pr-2">Stock:</span><span class="font-bold ${product.data.stock <= 10 ? 'text-red-600' : 'text-slate-800'}">${product.data.stock}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-right md:table-cell">
                <button class="btn-editar inline-flex items-center text-brand hover:text-brand-dark mr-4" data-id="${product.id}">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"/></svg>
                    Editar
                </button>
                <button class="btn-eliminar inline-flex items-center text-red-600 hover:text-red-800" data-id="${product.id}">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    Eliminar
                </button>
            </td>
        `;
        inventoryTable.appendChild(row);
    });

    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
};

// --- LÓGICA PARA LEER PRODUCTOS Y BUSCAR ---
db.collection('productos').orderBy('nombre', 'asc').onSnapshot((snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    filterAndRender();
});

const filterAndRender = () => {
    const searchTerm = searchInput.value.toLowerCase();
    filteredProducts = allProducts.filter(product => {
        const nombre = product.data.nombre.toLowerCase();
        const codigo = product.data.codigo.toLowerCase();
        return nombre.includes(searchTerm) || codigo.includes(searchTerm);
    });
    currentPage = 1;
    renderTable();
};

searchInput.addEventListener('keyup', filterAndRender);

// --- LÓGICA DE PAGINACIÓN ---
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

// --- LÓGICA PARA CREAR Y EDITAR (AHORA CON CATEGORÍA) ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = productForm['codigo'].value;
    const nombre = productForm['nombre'].value;
    const stock = productForm['stock'].value;
    const categoria = productForm['categoria'].value; // Se obtiene el valor de la categoría

    // Se valida que la categoría no esté vacía
    if (!codigo || !nombre || !stock || !categoria) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Por favor, completa todos los campos.', confirmButtonColor: '#1c64f2' });
        return;
    }

    // Se añade la categoría al objeto del producto
    const newProduct = { codigo, nombre, stock: parseInt(stock), categoria };

    try {
        let message = '¡Producto guardado con éxito!';
        if (editMode) {
            await db.collection('productos').doc(idToEdit).update(newProduct);
            message = '¡Producto actualizado con éxito!';
        } else {
            await db.collection('productos').add(newProduct);
        }
        
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        Toast.fire({ icon: 'success', title: message });

    } catch (error) {
        console.error("Error al guardar/actualizar el producto: ", error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el producto.' });
    }

    productForm.reset();
    editMode = false;
    idToEdit = '';
    formTitle.innerText = 'Añadir Nuevo Producto';
    saveButton.innerText = 'Guardar';
    productForm['codigo'].focus();
});

// --- LÓGICA PARA CLICS EN BOTONES DE LA TABLA ---
inventoryTable.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    if (target.classList.contains('btn-eliminar')) {
        const id = target.dataset.id;
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡elimínalo!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await db.collection('productos').doc(id).delete();
                    Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
                } catch (error) {
                    Swal.fire('Error', 'Hubo un problema al eliminar el producto.', 'error');
                }
            }
        });
    }

    if (target.classList.contains('btn-editar')) {
        idToEdit = target.dataset.id;
        try {
            const doc = await db.collection('productos').doc(idToEdit).get();
            const productToEdit = doc.data();
            productForm['codigo'].value = productToEdit.codigo;
            productForm['nombre'].value = productToEdit.nombre;
            productForm['stock'].value = productToEdit.stock;
            productForm['categoria'].value = productToEdit.categoria; // Se rellena el campo de categoría
            
            editMode = true;
            formTitle.innerText = 'Editar Producto';
            saveButton.innerText = 'Actualizar';
            window.scrollTo(0, 0); // Sube al inicio de la página para ver el formulario
        } catch (error) {
            console.error("Error al obtener el producto para editar: ", error);
        }
    }
});

// --- LÓGICA PARA EL MENÚ RESPONSIVE ---
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');

mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
});

// --- LÓGICA PARA CERRAR SESIÓN ---
const logoutButton = document.getElementById('logout-btn');
if(logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Tu sesión actual se cerrará.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, ¡cerrar sesión!',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await firebase.auth().signOut();
                } catch (error) {
                    console.error('Error al cerrar sesión: ', error);
                }
            }
        });
    });
}