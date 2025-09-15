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
// *** NUEVOS ELEMENTOS PARA PAGINACIÓN ***
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfo = document.getElementById('page-info');



// --- ESTADO DE LA APLICACIÓN ---
let editMode = false;
let idToEdit = '';
let allProducts = [];
let filteredProducts = []; // Para guardar los productos filtrados por la búsqueda
// *** NUEVAS VARIABLES DE ESTADO PARA PAGINACIÓN ***
let currentPage = 1;
const rowsPerPage = 10; // Puedes cambiar este número

// --- FUNCIÓN PARA RENDERIZAR LA TABLA (AHORA CON PAGINACIÓN) ---
const renderTable = () => {
    inventoryTable.innerHTML = '';
    
    // Calcula el total de páginas basado en los productos filtrados
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages) || 1;

    // Corta el array para obtener solo los productos de la página actual
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);

    if (paginatedProducts.length === 0 && allProducts.length > 0) {
        inventoryTable.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No se encontraron productos con ese filtro.</td></tr>`;
    } else if (allProducts.length === 0) {
        inventoryTable.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Aún no hay productos.</td></tr>`;
    }

    paginatedProducts.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 md:table-row flex flex-col mb-4 md:mb-0';
        row.innerHTML = `
            <td class="p-3 md:table-cell"><span class="md:hidden font-bold pr-2">Código:</span>${product.data.codigo}</td>
            <td class="p-3 md:table-cell"><span class="md:hidden font-bold pr-2">Nombre:</span>${product.data.nombre}</td>
            <td class="p-3 md:table-cell"><span class="md:hidden font-bold pr-2">Stock:</span><span class="font-semibold ${product.data.stock <= 10 ? 'text-red-600' : 'text-gray-700'}">${product.data.stock}</span></td>
            <td class="p-3 md:table-cell text-left md:text-right">
                <button class="btn-editar text-brand hover:text-brand-dark mr-4" data-id="${product.id}">Editar</button>
                <button class="btn-eliminar text-red-600 hover:text-red-800" data-id="${product.id}">Eliminar</button>
            </td>
        `;
        inventoryTable.appendChild(row);
    });

    // Actualiza la información y el estado de los botones de paginación
    pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
};

// --- LÓGICA PARA LEER PRODUCTOS Y BUSCAR ---
db.collection('productos').orderBy('nombre', 'asc').onSnapshot((snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    // Cuando los datos cambian, aplica el filtro actual y renderiza
    filterAndRender();
});

const filterAndRender = () => {
    const searchTerm = searchInput.value.toLowerCase();
    filteredProducts = allProducts.filter(product => {
        const nombre = product.data.nombre.toLowerCase();
        const codigo = product.data.codigo.toLowerCase();
        return nombre.includes(searchTerm) || codigo.includes(searchTerm);
    });
    currentPage = 1; // Resetea a la primera página con cada nueva búsqueda
    renderTable();
};

searchInput.addEventListener('keyup', filterAndRender);

// *** NUEVOS EVENT LISTENERS PARA PAGINACIÓN ***
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


// --- LÓGICA PARA CREAR Y EDITAR (Sin cambios, se mantiene igual) ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = productForm['codigo'].value;
    const nombre = productForm['nombre'].value;
    const stock = productForm['stock'].value;

    if (!codigo || !nombre || !stock) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Por favor, completa todos los campos.', confirmButtonColor: '#1c64f2' });
        return;
    }

    const newProduct = { codigo, nombre, stock: parseInt(stock) };

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
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
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

// --- LÓGICA PARA CLICS EN BOTONES DE LA TABLA (Sin cambios, se mantiene igual) ---
inventoryTable.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-eliminar')) {
        const id = e.target.dataset.id;
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
                    console.error('Error al eliminar el producto: ', error);
                    Swal.fire('Error', 'Hubo un problema al eliminar el producto.', 'error');
                }
            }
        });
    }

    if (e.target.classList.contains('btn-editar')) {
        idToEdit = e.target.dataset.id;
        try {
            const doc = await db.collection('productos').doc(idToEdit).get();
            const productToEdit = doc.data();
            productForm['codigo'].value = productToEdit.codigo;
            productForm['nombre'].value = productToEdit.nombre;
            productForm['stock'].value = productToEdit.stock;
            editMode = true;
            formTitle.innerText = 'Editar Producto';
            saveButton.innerText = 'Actualizar';
        } catch (error) {
            console.error("Error al obtener el producto para editar: ", error);
        }
    }
});

// --- LÓGICA PARA EL MENÚ RESPONSIVE (Sin cambios, se mantiene igual) ---
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