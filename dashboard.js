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

// --- INSTANCIAS DE GRÁFICOS (para poder destruirlas y actualizarlas) ---
let masStockChartInstance = null;
let menosStockChartInstance = null;

// Escuchamos cambios en la colección de productos para actualizar todo
db.collection('productos').onSnapshot(snapshot => {
    const productos = [];
    snapshot.forEach(doc => {
        productos.push({ id: doc.id, ...doc.data() });
    });

    // --- 1. ACTUALIZAR WIDGETS ---
    const totalProductos = productos.length;
    const productosBajoStock = productos.filter(p => p.stock <= 10).length;
    const valorTotalStock = productos.reduce((sum, p) => sum + p.stock, 0);

    totalProductosEl.innerText = totalProductos;
    bajoStockEl.innerText = productosBajoStock;
    totalStockValorEl.innerText = valorTotalStock;

    // --- 2. ACTUALIZAR GRÁFICOS ---
    actualizarGraficos(productos);
});

// --- FUNCIÓN PARA CREAR Y ACTUALIZAR GRÁFICOS ---
const actualizarGraficos = (productos) => {
    // --- GRÁFICO 1: TOP 5 CON MÁS STOCK ---
    const ctxMasStock = document.getElementById('masStockChart').getContext('2d');
    const productosMasStock = [...productos].sort((a, b) => b.stock - a.stock).slice(0, 5);
    
    const dataMasStock = {
        labels: productosMasStock.map(p => p.nombre),
        datasets: [{
            label: 'Stock',
            data: productosMasStock.map(p => p.stock),
            backgroundColor: ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'],
            hoverOffset: 4
        }]
    };

    if (masStockChartInstance) {
        masStockChartInstance.destroy();
    }
    masStockChartInstance = new Chart(ctxMasStock, {
        type: 'doughnut',
        data: dataMasStock,
        options: { responsive: true, maintainAspectRatio: false }
    });


    // --- GRÁFICO 2: TOP 5 CON MENOS STOCK ---
    const ctxMenosStock = document.getElementById('menosStockChart').getContext('2d');
    const productosMenosStock = [...productos].sort((a, b) => a.stock - b.stock).slice(0, 5);

    const dataMenosStock = {
        labels: productosMenosStock.map(p => p.nombre),
        datasets: [{
            label: 'Stock Actual',
            data: productosMenosStock.map(p => p.stock),
            backgroundColor: '#EF4444',
            borderColor: '#DC2626',
            borderWidth: 1
        }]
    };
    
    if (menosStockChartInstance) {
        menosStockChartInstance.destroy();
    }
    menosStockChartInstance = new Chart(ctxMenosStock, {
        type: 'bar',
        data: dataMenosStock,
        options: {
            indexAxis: 'y', // Hace el gráfico de barras horizontal, mejor para nombres largos
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
};

// --- LÓGICA PARA EL MENÚ RESPONSIVE ---
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');

mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
});