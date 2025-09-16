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

// --- GUARDIÁN DE AUTENTICACIÓN Y SALUDO ---
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        const welcomeMessage = document.getElementById('welcome-message');
        welcomeMessage.innerText = `¡Hola, ${user.displayName || 'Usuario'}!`;
    } else {
        window.location.href = 'index.html';
    }
});

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const totalProductosEl = document.getElementById('total-productos');
const bajoStockEl = document.getElementById('bajo-stock');
const totalStockValorEl = document.getElementById('total-stock-valor');
const recentActivityList = document.getElementById('recent-activity-list');

// --- INSTANCIAS DE GRÁFICOS ---
let categoryChartInstance = null;
let menosStockChartInstance = null; // Instancia para la nueva gráfica

// --- ACTUALIZAR DATOS DE PRODUCTOS (WIDGETS Y GRÁFICOS) ---
db.collection('productos').onSnapshot(snapshot => {
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 1. Actualizar Widgets
    totalProductosEl.innerText = productos.length;
    bajoStockEl.innerText = productos.filter(p => p.stock <= 10).length;
    totalStockValorEl.innerText = productos.reduce((sum, p) => sum + p.stock, 0);

    // 2. Actualizar Gráficos
    actualizarGraficoCategorias(productos);
    actualizarGraficoMenosStock(productos); // Llamada a la nueva función
});

// --- ACTUALIZAR DATOS DE MOVIMIENTOS (ACTIVIDAD RECIENTE) ---
db.collection('movimientos').orderBy('fecha', 'desc').limit(5).onSnapshot(snapshot => {
    recentActivityList.innerHTML = '';
    if (snapshot.empty) {
        recentActivityList.innerHTML = `<p class="text-center text-slate-500 mt-4">Aún no hay movimientos registrados.</p>`;
        return;
    }

    snapshot.forEach(doc => {
        const mov = doc.data();
        const fecha = mov.fecha ? new Date(mov.fecha.seconds * 1000).toLocaleDateString('es-ES') : '';
        const esEntrada = mov.tipo === 'Entrada';

        const itemHTML = `
            <div class="flex items-center p-2 rounded-lg hover:bg-slate-50">
                <div class="mr-3 p-2 rounded-full ${esEntrada ? 'bg-green-100' : 'bg-red-100'}">
                    <svg class="h-5 w-5 ${esEntrada ? 'text-green-600' : 'bg-red-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        ${esEntrada 
                            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />' 
                            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />'
                        }
                    </svg>
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-slate-800 text-sm">${mov.productoNombre}</p>
                    <p class="text-xs text-slate-500">${mov.responsable} registró una ${mov.tipo.toLowerCase()} de ${mov.cantidad} unidad(es).</p>
                </div>
                <div class="text-right text-xs text-slate-400">
                    ${fecha}
                </div>
            </div>
        `;
        recentActivityList.innerHTML += itemHTML;
    });
});

// --- FUNCIÓN PARA GRÁFICO DE CATEGORÍAS ---
const actualizarGraficoCategorias = (productos) => {
    const ctx = document.getElementById('categoryStockChart').getContext('2d');
    
    const stockPorCategoria = productos.reduce((acc, p) => {
        const categoria = p.categoria || 'Sin Categoría';
        acc[categoria] = (acc[categoria] || 0) + p.stock;
        return acc;
    }, {});

    const data = {
        labels: Object.keys(stockPorCategoria),
        datasets: [{
            data: Object.values(stockPorCategoria),
            backgroundColor: ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'],
            hoverOffset: 4
        }]
    };

    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
};

// --- FUNCIÓN PARA GRÁFICO DE BAJO STOCK ---
const actualizarGraficoMenosStock = (productos) => {
    const ctx = document.getElementById('menosStockChart').getContext('2d');
    const productosMenosStock = [...productos].sort((a, b) => a.stock - b.stock).slice(0, 5);

    const data = {
        labels: productosMenosStock.map(p => p.nombre),
        datasets: [{
            label: 'Stock Actual',
            data: productosMenosStock.map(p => p.stock),
            backgroundColor: '#F87171',
            borderColor: '#EF4444',
            borderWidth: 1
        }]
    };
    
    if (menosStockChartInstance) menosStockChartInstance.destroy();
    menosStockChartInstance = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
};

// --- LÓGICA DEL MENÚ Y CIERRE DE SESIÓN ---
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