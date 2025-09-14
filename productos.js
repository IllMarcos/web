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
const productForm = document.getElementById('form-producto');
const inventoryTable = document.getElementById('tabla-inventario');
const formTitle = document.getElementById('form-title');
const saveButton = document.getElementById('btn-save');
const searchInput = document.getElementById('search-input'); // <-- Nuevo elemento

// --- ESTADO DE LA APLICACIÓN ---
let editMode = false;
let idToEdit = '';
let allProducts = []; // <-- Nuevo: Array para guardar todos los productos

// --- FUNCIÓN PARA RENDERIZAR LA TABLA (VERSIÓN RESPONSIVE) ---
const renderTable = (products) => {
    inventoryTable.innerHTML = '';
    if (products.length === 0) {
        inventoryTable.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No se encontraron productos.</td></tr>`;
        return;
    }
    products.forEach(product => {
        const row = document.createElement('tr');
        // Clases para la transición a formato de tarjeta en móvil
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
};
// --- LÓGICA PARA LEER PRODUCTOS Y BUSCAR ---
db.collection('productos').orderBy('nombre', 'asc').onSnapshot((snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    renderTable(allProducts); // Renderiza la tabla completa la primera vez
});

searchInput.addEventListener('keyup', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => {
        const nombre = product.data.nombre.toLowerCase();
        const codigo = product.data.codigo.toLowerCase();
        return nombre.includes(searchTerm) || codigo.includes(searchTerm);
    });
    renderTable(filteredProducts);
});


// --- LÓGICA PARA CREAR Y EDITAR (Manejador del Formulario) ---
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

// --- LÓGICA PARA CLICS EN BOTONES DE LA TABLA (Editar y Eliminar) ---
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

// --- LÓGICA PARA EL MENÚ RESPONSIVE ---
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');

mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
});