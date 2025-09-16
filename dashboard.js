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

// --- VARIABLES GLOBALES ---
let currentUser = null;

// --- GUARDIÁN DE AUTENTICACIÓN Y SALUDO ---
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
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
const reportBtn = document.getElementById('report-btn');

const reportModalBackdrop = document.getElementById('report-modal-backdrop');
const reportModal = document.getElementById('report-modal');
const reportModalContent = document.getElementById('report-modal-content');
const closeReportBtn = document.getElementById('close-report-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn'); // Botón para descargar PDF

let categoryChartInstance = null;
let menosStockChartInstance = null;

// --- LISTENERS DE FIRESTORE ---
db.collection('productos').onSnapshot(snapshot => {
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    totalProductosEl.innerText = productos.length;
    bajoStockEl.innerText = productos.filter(p => p.stock <= 10).length;
    totalStockValorEl.innerText = productos.reduce((sum, p) => sum + p.stock, 0);
    actualizarGraficoCategorias(productos);
    actualizarGraficoMenosStock(productos);
});

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
        const itemHTML = `<div class="flex items-center p-2 rounded-lg hover:bg-slate-50"><div class="mr-3 p-2 rounded-full ${esEntrada ? 'bg-green-100' : 'bg-red-100'}"><svg class="h-5 w-5 ${esEntrada ? 'text-green-600' : 'text-red-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">${esEntrada ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />'}</svg></div><div class="flex-1"><p class="font-semibold text-slate-800 text-sm">${mov.productoNombre}</p><p class="text-xs text-slate-500">${mov.responsable} registró una ${mov.tipo.toLowerCase()} de ${mov.cantidad} unidad(es).</p></div><div class="text-right text-xs text-slate-400">${fecha}</div></div>`;
        recentActivityList.innerHTML += itemHTML;
    });
});

// --- LÓGICA DEL REPORTE PROFESIONAL ---
const generarReporteDiario = async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    try {
        const snapshot = await db.collection('movimientos').where('fecha', '>=', startOfDay).where('fecha', '<=', endOfDay).orderBy('fecha', 'asc').get();
        if (snapshot.empty) {
            Swal.fire('Sin Datos', 'No se encontraron movimientos el día de hoy.', 'info');
            return;
        }

        const movimientos = snapshot.docs.map(doc => doc.data());
        renderizarReporteProfesional(movimientos);

    } catch (error) {
        console.error("Error generando el reporte: ", error);
        Swal.fire('Error', 'No se pudo generar el reporte.', 'error');
    }
};

const renderizarReporteProfesional = (movimientos) => {
    let totalEntradas = 0;
    let totalSalidas = 0;
    const resumenCategorias = {};
    movimientos.forEach(mov => {
        const categoria = mov.productoCategoria || 'Sin Categoría';
        if (!resumenCategorias[categoria]) resumenCategorias[categoria] = { entradas: 0, salidas: 0 };
        if (mov.tipo === 'Entrada') {
            totalEntradas += mov.cantidad;
            resumenCategorias[categoria].entradas += mov.cantidad;
        } else {
            totalSalidas += mov.cantidad;
            resumenCategorias[categoria].salidas += mov.cantidad;
        }
    });

    const today = new Date();
    const userName = currentUser?.displayName || 'Usuario';
    
    let resumenCategoriasHTML = Object.keys(resumenCategorias).sort().map(cat => `<div class="bg-slate-50 p-4 rounded-lg"><h4 class="font-bold text-slate-700">${cat}</h4><div class="flex justify-between items-center mt-2 text-sm"><span class="text-green-600 font-semibold">Entradas: ${resumenCategorias[cat].entradas}</span><span class="text-red-600 font-semibold">Salidas: ${resumenCategorias[cat].salidas}</span></div></div>`).join('');
    let detalleMovimientosHTML = movimientos.map(mov => {
        const hora = new Date(mov.fecha.seconds * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const tipoClase = mov.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600';
        return `<tr class="border-b"><td class="p-2 text-sm text-slate-600">${hora}</td><td class="p-2 text-sm font-medium">${mov.productoNombre}</td><td class="p-2 text-sm">${mov.responsable}</td><td class="p-2 text-sm font-semibold ${tipoClase}">${mov.tipo}</td><td class="p-2 text-sm font-bold ${tipoClase}">${mov.tipo === 'Entrada' ? '+' : '-'}${mov.cantidad}</td></tr>`;
    }).join('');

    const modalHTML = `
        <div class="mb-8"><h2 class="text-3xl font-bold text-slate-900">Reporte Diario de Movimientos</h2><p class="text-slate-500">Fecha: ${today.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"><div class="bg-slate-100 p-4 rounded-lg text-center"><p class="text-sm text-slate-600">Total Movimientos</p><p class="text-2xl font-bold text-slate-800">${movimientos.length}</p></div><div class="bg-green-100 p-4 rounded-lg text-center"><p class="text-sm text-green-800">Unidades de Entrada</p><p class="text-2xl font-bold text-green-800">${totalEntradas}</p></div><div class="bg-red-100 p-4 rounded-lg text-center"><p class="text-sm text-red-800">Unidades de Salida</p><p class="text-2xl font-bold text-red-800">${totalSalidas}</p></div></div>
        <div class="mb-8"><h3 class="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Resumen por Categoría</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${resumenCategoriasHTML}</div></div>
        <div><h3 class="text-xl font-semibold text-slate-800 mb-4 border-b pb-2">Detalle de Movimientos</h3><div class="overflow-x-auto"><table class="min-w-full"><thead><tr class="bg-slate-50"><th class="p-2 text-left text-xs font-semibold uppercase text-slate-500">Hora</th><th class="p-2 text-left text-xs font-semibold uppercase text-slate-500">Producto</th><th class="p-2 text-left text-xs font-semibold uppercase text-slate-500">Responsable</th><th class="p-2 text-left text-xs font-semibold uppercase text-slate-500">Tipo</th><th class="p-2 text-left text-xs font-semibold uppercase text-slate-500">Cantidad</th></tr></thead><tbody>${detalleMovimientosHTML}</tbody></table></div></div>
        <div class="mt-12 pt-4 border-t text-sm text-slate-500 text-center">Reporte generado por: <span class="font-semibold">${userName}</span></div>`;

    reportModalContent.innerHTML = modalHTML;
    reportModal.classList.remove('hidden');
    reportModalBackdrop.classList.remove('hidden');
};

const cerrarModal = () => {
    reportModal.classList.add('hidden');
    reportModalBackdrop.classList.add('hidden');
    reportModalContent.innerHTML = '';
};

// --- FUNCIÓN PARA DESCARGAR PDF ---
const descargarPDF = () => {
    const element = document.getElementById('report-modal-content');
    const today = new Date();
    const fileName = `Reporte_Movimientos_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.pdf`;

    const opt = {
      margin:       0.5,
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
};

reportBtn.addEventListener('click', generarReporteDiario);
closeReportBtn.addEventListener('click', cerrarModal);
reportModalBackdrop.addEventListener('click', cerrarModal);
downloadPdfBtn.addEventListener('click', descargarPDF);

// --- FUNCIONES PARA GRÁFICOS (sin cambios) ---
const actualizarGraficoCategorias = (productos) => {
    const ctx = document.getElementById('categoryStockChart').getContext('2d');
    const stockPorCategoria = productos.reduce((acc, p) => { const cat = p.categoria || 'Sin Categoría'; acc[cat] = (acc[cat] || 0) + p.stock; return acc; }, {});
    const data = { labels: Object.keys(stockPorCategoria), datasets: [{ data: Object.values(stockPorCategoria), backgroundColor: ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'], hoverOffset: 4 }] };
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(ctx, { type: 'doughnut', data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
};
const actualizarGraficoMenosStock = (productos) => {
    const ctx = document.getElementById('menosStockChart').getContext('2d');
    const prods = [...productos].sort((a, b) => a.stock - b.stock).slice(0, 5);
    const data = { labels: prods.map(p => p.nombre), datasets: [{ label: 'Stock Actual', data: prods.map(p => p.stock), backgroundColor: '#F87171', borderColor: '#EF4444', borderWidth: 1 }] };
    if (menosStockChartInstance) menosStockChartInstance.destroy();
    menosStockChartInstance = new Chart(ctx, { type: 'bar', data, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { beginAtZero: true } }, plugins: { legend: { display: false } } } });
};

// --- LÓGICA DEL MENÚ Y CIERRE DE SESIÓN (sin cambios) ---
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