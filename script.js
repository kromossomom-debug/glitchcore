// EXECUTA ISSO ASSIM QUE A PÁGINA ABRE
(function aplicarTemaInicial() {
    const temaSalvo = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', temaSalvo);
})();

// ==========================================
// 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyC-HlFxDsp4AsbezKd28YpiQZi3UHUipbc",
    authDomain: "nexus-6d8df.firebaseapp.com",
    projectId: "nexus-6d8df",
    storageBucket: "nexus-6d8df.firebasestorage.app",
    messagingSenderId: "1045779517061",
    appId: "1:1045779517061:web:f2d6877724cee68374a3ec",
    measurementId: "G-HJRJZ6JEE2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
// ==========================================
// SISTEMA DE TOASTS (NOTIFICAÇÕES)
// ==========================================
function showToast(mensagem, tipo = 'info') {
    // Cria o container se não existir
    let container = document.getElementById('glitch-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'glitch-toast-container';
        document.body.appendChild(container);
    }

    // Cria o Toast
    const toast = document.createElement('div');
    toast.className = `glitch-toast toast-${tipo}`;
    
    // Define o ícone com base no tipo
    let icone = '<i class="fa-solid fa-circle-info text-info"></i>';
    if (tipo === 'success') icone = '<i class="fa-solid fa-check text-success"></i>';
    if (tipo === 'error') icone = '<i class="fa-solid fa-triangle-exclamation text-danger"></i>';

    toast.innerHTML = `${icone} <span>${mensagem}</span>`;
    container.appendChild(toast);

    // Anima a entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Some depois de 3.5 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Espera a animação de saída
    }, 3500);
}
// ==========================================
// 2. MONITOR DE STATUS DO USUÁRIO
// ==========================================
auth.onAuthStateChanged(usuario => {
    let btnLoginTopo = document.querySelector('[data-bs-target="#authModal"]') || document.querySelector('.navbar .btn-danger');
    const btnAdminPainel = document.getElementById('btnAdminPainel');
    const emailDoChefe = "kromossomo.m@gmail.com"; 

    if (usuario) {
        const fotoPerfil = usuario.photoURL || `https://ui-avatars.com/api/?name=${usuario.displayName}&background=ff003c&color=fff`;
        if (btnLoginTopo) {
            btnLoginTopo.innerHTML = `<img src="${fotoPerfil}" width="28" height="28" class="rounded-circle border border-white me-2" style="object-fit: cover;" referrerpolicy="no-referrer"> ${usuario.displayName.split(' ')[0]}`;
            btnLoginTopo.removeAttribute('data-bs-toggle');
            btnLoginTopo.removeAttribute('data-bs-target');
            btnLoginTopo.onclick = () => window.location.href = 'perfil.html';
        }

        const modalEl = document.getElementById('authModal');
        if (modalEl && modalEl.classList.contains('show')) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }

        if (usuario.email === emailDoChefe && btnAdminPainel) {
            btnAdminPainel.classList.remove('d-none');
            btnAdminPainel.classList.add('d-md-block'); 
        }
    } else {
        if (btnLoginTopo) {
            btnLoginTopo.innerHTML = `<i class="fa-solid fa-user me-2"></i> LOGIN`;
            btnLoginTopo.setAttribute('data-bs-toggle', 'modal');
            btnLoginTopo.setAttribute('data-bs-target', '#authModal');
            btnLoginTopo.onclick = null;
        }
        if (btnAdminPainel) {
            btnAdminPainel.classList.remove('d-md-block');
            btnAdminPainel.classList.add('d-none');
        }
    }
    renderizarRanking();
});

// ==========================================
// 3. LÓGICA DO TEMA E INTERFACE
// ==========================================
function inicializarTema() {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';

    document.documentElement.setAttribute('data-theme', currentTheme);
    atualizarIconeTema(currentTheme);

    themeToggle?.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        atualizarIconeTema(newTheme);
    });
}

function atualizarIconeTema(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    if (theme === 'light') {
        icon.classList.replace('fa-moon', 'fa-sun');
        icon.classList.replace('text-warning', 'text-danger');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        icon.classList.replace('text-danger', 'text-warning');
    }
}

function renderizarRanking() {
    const rankingContainer = document.getElementById('ranking-elite');
    if (!rankingContainer) return;

    const user = firebase.auth().currentUser;
    let meusDados = { nome: "Recruta", xp: 0, nivel: 1 };
    
    if (user) {
        const dbKey = 'glitchcore_player_data_' + user.uid;
        const stats = JSON.parse(localStorage.getItem(dbKey)) || { xp: 0 };
        meusDados = { 
            nome: user.displayName ? user.displayName.split(' ')[0] : "Soldado", 
            xp: stats.xp, 
            nivel: Math.floor(stats.xp / 100) + 1 
        };
    }

    const competidores = [
        meusDados,
        { nome: "Ghost_Sniper", xp: 1250, nivel: 12 },
        { nome: "Viper_Tech", xp: 980, nivel: 9 },
        { nome: "Kromossomo", xp: 850, nivel: 8 },
        { nome: "Neon_Rider", xp: 420, nivel: 4 }
    ].sort((a, b) => b.xp - a.xp);

    rankingContainer.innerHTML = '';
    const medalhas = ['🥇', '🥈', '🥉', '🎖️', '🎖️'];

    competidores.forEach((comp, index) => {
        const isMe = user && comp.nome === user.displayName?.split(' ')[0];
        rankingContainer.innerHTML += `
            <div class="d-flex align-items-center justify-content-between p-3 rounded-3 mb-2 ${isMe ? 'bg-danger bg-opacity-25 border border-danger' : 'bg-black border border-secondary shadow-sm'}">
                <div class="d-flex align-items-center gap-3">
                    <span class="fs-5">${medalhas[index] || '🎖️'}</span>
                    <div>
                        <h6 class="mb-0 fw-bold ${isMe ? 'text-danger' : 'text-white'}">${comp.nome}</h6>
                        <small class="text-muted">LVL ${comp.nivel}</small>
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge bg-secondary font-monospace">${comp.xp} XP</span>
                </div>
            </div>`;
    });
}

function atualizarTicker(noticias) {
    const tickerContainer = document.getElementById('ticker-dinamico');
    if (!tickerContainer || noticias.length === 0) return;
    let htmlTicker = '';
    const ultimasCinco = noticias.slice(0, 5);
    ultimasCinco.forEach(n => {
        htmlTicker += `<span class="ticker-item">🔥 ${n.titulo.toUpperCase()}</span>`;
    });
    tickerContainer.innerHTML = htmlTicker + htmlTicker;
}

// ==========================================
// 4. FUNÇÕES DE RENDERIZAÇÃO DE NOTÍCIAS COM "LOAD MORE"
// ==========================================

let globalArquivoRestante = []; // Guarda as notícias que sobraram para o Load More
let currentIndexGrid = 0; // Quantas notícias já mostramos no grid
const ITENS_POR_CLIQUE = 6; // Quantas notícias carregar por vez no botão

function renderizarListaVertical(lista, container) {
    lista.forEach((item, index) => {
        const delay = index * 0.1;
        container.innerHTML += `
            <a href="noticia.html?id=${item.id}" class="text-decoration-none" style="animation: fadeIn 0.5s ease forwards ${delay}s; opacity: 0;">
                <div class="card mb-3 news-card-hover overflow-hidden">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <img src="${item.imagem}" class="img-fluid h-100 object-fit-cover" alt="${item.titulo}" style="min-height: 180px;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body p-4">
                                <span class="badge bg-danger mb-2">${item.plataforma.toUpperCase()}</span>
                                <h3 class="card-title fw-bold">${item.titulo}</h3>
                                <p class="card-text">${item.resumo || ''}</p>
                                <small class="text-muted fw-bold"><i class="fa-regular fa-clock me-1"></i> ${item.data}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </a>`;
    });
}

function renderizarGradePequena(lista, container) {
    lista.forEach(item => {
        container.innerHTML += `
            <div class="col-md-4">
                <a href="noticia.html?id=${item.id}" class="text-decoration-none animate__animated animate__fadeIn">
                    <div class="card h-100 news-card-hover border-secondary small-card">
                        <img src="${item.imagem}" class="card-img-top object-fit-cover" style="height: 140px;" alt="${item.titulo}">
                        <div class="card-body p-3">
                            <h6 class="card-title fw-bold mb-1" style="font-size: 0.9rem; line-height:1.2;">${item.titulo}</h6>
                            <small class="text-info text-uppercase" style="font-size: 0.7rem;">${item.plataforma}</small>
                        </div>
                    </div>
                </a>
            </div>`;
    });
}

// Lógica do botão Carregar Mais
document.getElementById('btnLoadMore')?.addEventListener('click', () => {
    const gridArchive = document.getElementById('news-grid-archive');
    const proximoLote = globalArquivoRestante.slice(currentIndexGrid, currentIndexGrid + ITENS_POR_CLIQUE);
    
    renderizarGradePequena(proximoLote, gridArchive);
    currentIndexGrid += ITENS_POR_CLIQUE;

    // Se já mostrou tudo, esconde o botão
    if (currentIndexGrid >= globalArquivoRestante.length) {
        document.getElementById('btnLoadMore').classList.add('d-none');
        if(typeof showToast === 'function') showToast("Você chegou ao fim dos arquivos.", "info");
    }
});

function renderizarInterface(lista, filtrado = false) {
    const listVertical = document.getElementById('news-list-vertical');
    const gridArchive = document.getElementById('news-grid-archive');
    const carrosselContainer = document.getElementById('destaques-container');
    const carrosselInner = document.getElementById('carousel-inner');
    const carrosselIndicators = document.getElementById('carousel-indicators');
    const btnLoadMore = document.getElementById('btnLoadMore');
    
    // Reseta as variáveis globais do Load More
    currentIndexGrid = 0;
    globalArquivoRestante = [];
    
    if (listVertical) listVertical.innerHTML = '';
    if (gridArchive) gridArchive.innerHTML = '';
    if (carrosselInner) carrosselInner.innerHTML = '';
    if (carrosselIndicators) carrosselIndicators.innerHTML = '';
    if (btnLoadMore) btnLoadMore.classList.add('d-none'); // Esconde por padrão

    if (lista.length === 0) {
        if (listVertical) listVertical.innerHTML = '<p class="text-muted">Nenhum sinal detectado.</p>';
        return;
    }

    if (filtrado) {
        if (carrosselContainer) carrosselContainer.classList.add('d-none');
        renderizarListaVertical(lista, listVertical);
    } else {
        if (carrosselContainer) carrosselContainer.classList.remove('d-none');
        
        // --- FATIAMENTO TÁTICO ---
        const top5Carrossel = lista.slice(0, 5);      
        const ultimas10 = lista.slice(0, 10);         
        
        // Todo o resto vai para o arquivo
        globalArquivoRestante = lista.slice(10);     

        // 1. Monta Carrossel
        if (carrosselInner && carrosselIndicators) {
            top5Carrossel.forEach((item, index) => {
                const activeClass = index === 0 ? 'active' : '';
                carrosselIndicators.innerHTML += `<button type="button" data-bs-target="#carouselNews" data-bs-slide-to="${index}" class="${activeClass}"></button>`;
                carrosselInner.innerHTML += `
                    <div class="carousel-item ${activeClass}">
                        <a href="noticia.html?id=${item.id}" class="text-decoration-none text-white">
                            <img src="${item.imagem}" class="d-block w-100" style="height: 500px; object-fit: cover;" alt="${item.titulo}">
                            <div class="carousel-caption d-none d-md-block text-start p-5">
                                <span class="badge bg-danger mb-2">${item.plataforma.toUpperCase()}</span>
                                <h2 class="display-5 fw-bold mb-3 text-white">${item.titulo}</h2>
                            </div>
                        </a>
                    </div>`;
            });
        }

        // 2. Monta Lista Vertical (As 10 mais recentes)
        renderizarListaVertical(ultimas10, listVertical);

        // 3. Monta Grid de Arquivo Inicial (Injeta as primeiras 6)
        if (globalArquivoRestante.length > 0) {
            const loteInicial = globalArquivoRestante.slice(0, ITENS_POR_CLIQUE);
            renderizarGradePequena(loteInicial, gridArchive);
            currentIndexGrid += ITENS_POR_CLIQUE;

            // Mostra o botão Carregar Mais se ainda sobrou notícia
            if (globalArquivoRestante.length > ITENS_POR_CLIQUE && btnLoadMore) {
                btnLoadMore.classList.remove('d-none');
            }
        }
    }
}
// ==========================================
// 5. INICIALIZAÇÃO DOM
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    inicializarTema();

    const btnGoogle = document.getElementById('btnGoogle');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', async () => {
            try { await auth.signInWithPopup(provider); } 
            catch (erro) { alert("Ops! A conexão com a base do Google falhou."); }
        });
    }

    const gridTrigger = document.getElementById('news-grid') || document.getElementById('news-list-vertical');
    let todasAsNoticias = [];

    if (gridTrigger) {
        try {
            const res = await fetch('/api/news');
            if (!res.ok) throw new Error("Falha na matriz de dados.");
            todasAsNoticias = await res.json();
            
            atualizarTicker(todasAsNoticias);
            renderizarInterface(todasAsNoticias, false);
            renderizarRanking();

            document.querySelectorAll('.filter-btn').forEach(botao => {
                botao.addEventListener('click', (e) => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'bg-white', 'text-dark'));
                    e.target.classList.add('active', 'bg-white', 'text-dark');
                    const plat = e.target.getAttribute('data-plataforma');
                    if (plat === 'todas') renderizarInterface(todasAsNoticias, false);
                    else renderizarInterface(todasAsNoticias.filter(n => n.plataforma === plat), true);
                });
            });

        } catch (erro) {
            console.error(erro);
            const containerErro = document.getElementById('news-list-vertical');
            if (containerErro) containerErro.innerHTML = '<div class="col-12 text-center text-danger mt-5"><h4>Conexão Perdida com o Servidor.</h4></div>';
        }
    }
});

const styleAnim = document.createElement('style');
styleAnim.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleAnim);