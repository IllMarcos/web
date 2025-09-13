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

// --- ESTADO DE LA APLICACIÓN ---
let editMode = false;
let idToEdit = '';

// --- LÓGICA PARA LEER Y MOSTRAR PRODUCTOS (onSnapshot) ---
db.collection('productos').orderBy('nombre', 'asc').onSnapshot((snapshot) => {
    inventoryTable.innerHTML = '';
    if (snapshot.empty) {
        inventoryTable.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Aún no hay productos.</td></tr>`;
        return;
    }
    snapshot.forEach(doc => {
        const product = doc.data();
        const productId = doc.id;
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-50');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.codigo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${product.stock <= 10 ? 'text-red-600' : 'text-gray-700'}">${product.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="btn-editar text-brand hover:text-brand-dark mr-4" data-id="${productId}">Editar</button>
                <button class="btn-eliminar text-red-600 hover:text-red-800" data-id="${productId}">Eliminar</button>
            </td>
        `;
        inventoryTable.appendChild(row);
    });
});

// --- LÓGICA PARA CREAR Y EDITAR (Manejador del Formulario) ---
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = productForm['codigo'].value;
    const nombre = productForm['nombre'].value;
    const stock = productForm['stock'].value;

    if (!codigo || !nombre || !stock) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const newProduct = {
        codigo: codigo,
        nombre: nombre,
        stock: parseInt(stock)
    };

    try {
        if (editMode) {
            await db.collection('productos').doc(idToEdit).update(newProduct);
        } else {
            await db.collection('productos').add(newProduct);
        }
    } catch (error) {
        console.error("Error al guardar/actualizar el producto: ", error);
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
        const confirmDelete = confirm('¿Estás seguro de que quieres eliminar este producto?');
        if (confirmDelete) {
            const id = e.target.dataset.id;
            try {
                await db.collection('productos').doc(id).delete();
            } catch (error) {
                console.error('Error al eliminar el producto: ', error);
            }
        }
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