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
const totalProductosEl = document.getElementById('total-productos');
const bajoStockEl = document.getElementById('bajo-stock');
const totalStockValorEl = document.getElementById('total-stock-valor');

// Escuchamos cambios en la colección de productos para actualizar los widgets
db.collection('productos').onSnapshot(snapshot => {
    const totalProductos = snapshot.size;
    let productosBajoStock = 0;
    let valorTotalStock = 0;

    snapshot.forEach(doc => {
        const producto = doc.data();
        
        // Calcular productos con bajo stock (menor o igual a 10)
        if (producto.stock <= 10) {
            productosBajoStock++;
        }

        // Sumar el stock de cada producto para el valor total
        valorTotalStock += producto.stock;
    });

    // Actualizar el HTML con los nuevos valores
    totalProductosEl.innerText = totalProductos;
    bajoStockEl.innerText = productosBajoStock;
    totalStockValorEl.innerText = valorTotalStock;
});