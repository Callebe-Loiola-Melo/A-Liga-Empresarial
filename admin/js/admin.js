const API_URL = '/.netlify/functions/api';

if (!localStorage.getItem('adminLogado')) window.location.href = 'login.html';

document.addEventListener('DOMContentLoaded', () => {
    carregarDashboard();
    setupAnoSelect();
});

// Filtro de Ano
function setupAnoSelect() {
    const select = document.getElementById('filtroAnoGraph');
    const anoAtual = new Date().getFullYear();
    const anoInicio = 2026;
    
    select.innerHTML = '';
    const limite = anoAtual < anoInicio ? anoInicio : anoAtual + 1;

    for (let i = anoInicio; i <= limite; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.innerText = i;
        if(i === anoAtual) opt.selected = true;
        select.appendChild(opt);
    }
    if(select.options.length === 0) {
        const opt = document.createElement('option');
        opt.value = 2026; opt.innerText = "2026"; opt.selected = true;
        select.appendChild(opt);
    }
}

function mudarAba(aba) {
    // 1. Esconde todas as abas e mostra a certa
    document.querySelectorAll('.aba').forEach(e => e.style.display = 'none');
    document.getElementById(`aba-${aba}`).style.display = 'block';
    
    // 2. Fecha o menu mobile (se estiver aberto)
    const menu = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if(menu) menu.classList.remove('show');
    if(overlay) overlay.classList.remove('show');

    // 3. ATUALIZA A COR DO MENU LATERAL (CORREÇÃO AQUI)
    const menuItems = document.querySelectorAll('.menu li');
    
    // Remove 'active' de todos
    menuItems.forEach(li => li.classList.remove('active'));

    // Adiciona 'active' no item certo baseado na ordem da lista HTML
    if(aba === 'dashboard') menuItems[0].classList.add('active'); // 1º Item: Visão Geral
    if(aba === 'aplicacoes') menuItems[1].classList.add('active'); // 2º Item: Membros
    if(aba === 'cases') menuItems[2].classList.add('active');      // 3º Item: Histórias
    if(aba === 'feedbacks') menuItems[3].classList.add('active');  // 4º Item: Feedbacks

    // 4. Carrega os dados da aba
    if(aba === 'dashboard') carregarDashboard();
    if(aba === 'aplicacoes') carregarAplicacoes();
    if(aba === 'cases') carregarCases();
    if(aba === 'feedbacks') carregarFeedbacks();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

function logout() { localStorage.removeItem('adminLogado'); window.location.href = 'login.html'; }

// --- DASHBOARD ---
async function carregarDashboard() {
    try {
        const res = await fetch(`${API_URL}/aplicacoes`);
        const leads = await res.json();
        const anoFiltro = document.getElementById('filtroAnoGraph').value;

        const leadsAno = leads.filter(l => l.created_at.startsWith(anoFiltro));

        const countStart = leadsAno.filter(l => l.plano_interesse === 'Start').length;
        const countPremium = leadsAno.filter(l => l.plano_interesse === 'Premium').length;
        const countAlpha = leadsAno.filter(l => l.plano_interesse === 'Contador Alpha').length;

        document.getElementById('kpi-total').innerText = leadsAno.length;
        document.getElementById('kpi-start').innerText = countStart;
        document.getElementById('kpi-premium').innerText = countPremium;
        document.getElementById('kpi-alpha').innerText = countAlpha;

        const dataTotal = new Array(12).fill(0);
        const dataStart = new Array(12).fill(0);
        const dataPremium = new Array(12).fill(0);
        const dataAlpha = new Array(12).fill(0);

        leadsAno.forEach(l => {
            const mes = new Date(l.created_at).getMonth();
            dataTotal[mes]++;
            if (l.plano_interesse === 'Start') dataStart[mes]++;
            if (l.plano_interesse === 'Premium') dataPremium[mes]++;
            if (l.plano_interesse === 'Contador Alpha') dataAlpha[mes]++;
        });

        const ctx = document.getElementById('graficoOnda').getContext('2d');
        if(window.meuGrafico) window.meuGrafico.destroy();

        window.meuGrafico = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                datasets: [
                    { label: 'Total', data: dataTotal, borderColor: '#0044cc', backgroundColor: 'rgba(0,68,204,0.1)', fill: true, tension: 0.4 },
                    { label: 'Start', data: dataStart, borderColor: '#FFD700', borderDash: [5,5], tension: 0.4 },
                    { label: 'Premium', data: dataPremium, borderColor: '#a0a0a0', tension: 0.4 },
                    { label: 'Alpha', data: dataAlpha, borderColor: '#00ff00', tension: 0.4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, labels: { color: 'white' } } },
                scales: { x: { grid: { color: '#222' } }, y: { grid: { color: '#222' } } }
            }
        });
    } catch(e) { console.error(e); }
}

// --- MEMBROS (Visual Ajustado: Abrir Branco) ---
let membrosCache = [];
async function carregarAplicacoes() {
    const res = await fetch(`${API_URL}/aplicacoes`);
    membrosCache = await res.json();
    renderizarMembros();
}

function renderizarMembros() {
    const tbody = document.getElementById('lista-aplicacoes');
    const filtro = document.getElementById('filtroDataMembros').value;
    tbody.innerHTML = '';

    const lista = membrosCache.filter(l => !filtro || l.created_at.startsWith(filtro));

    lista.forEach(l => {
        const data = new Date(l.created_at).toLocaleDateString('pt-BR');
        const zapLink = `https://wa.me/${l.whatsapp.replace(/\D/g,'')}`;
        const faturamentoDisplay = l.faturamento ? l.faturamento : '-';

        // ALTERAÇÃO 1: Botão "Abrir", Branco, Sem sublinhado
        const btnObjetivo = l.objetivo && l.objetivo.length > 0 
            ? `<span style="color:white; cursor:pointer; font-weight:bold; text-decoration:none;" onclick="abrirModalMembro(${l.id})">Abrir</span>`
            : '<span style="color:#666;">-</span>';

        tbody.innerHTML += `
            <tr onclick="abrirModalMembro(${l.id})" style="cursor:pointer;" title="Clique para ver detalhes">
                <td style="color:#666;">${data}</td>
                <td><strong>${l.nome}</strong></td>
                <td>${faturamentoDisplay}</td>
                <td>${l.plano_interesse}</td>
                <td>${btnObjetivo}</td>
                <td>${l.whatsapp}</td> 
                <td onclick="event.stopPropagation()">
                    <div class="action-btns">
                        <a href="${zapLink}" target="_blank" class="btn-action btn-zap"><i class="fab fa-whatsapp"></i></a>
                        <i class="fas fa-trash btn-action btn-del" onclick="deletarMembro(${l.id})"></i>
                    </div>
                </td>
            </tr>
        `;
    });
}

function limparFiltroMembros() { document.getElementById('filtroDataMembros').value = ''; renderizarMembros(); }

// --- MODAL MEMBRO (Visual Ajustado: Plano Branco, Ícone Removido, Botão Verde) ---
function abrirModalMembro(id) {
    const membro = membrosCache.find(m => m.id === id);
    if (!membro) return;

    const modal = document.getElementById('modalMembro');
    const corpo = document.getElementById('corpoModalMembro');
    const footer = document.getElementById('footerModalMembro');
    
    const data = new Date(membro.created_at).toLocaleDateString('pt-BR') + ' às ' + new Date(membro.created_at).toLocaleTimeString('pt-BR');
    const zapLink = `https://wa.me/${membro.whatsapp.replace(/\D/g,'')}`;

    // Monta o conteúdo
    corpo.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
            <div><small style="color:#888;">Data do Cadastro</small><br><strong style="color:white;">${data}</strong></div>
            
            <div><small style="color:#888;">Plano Escolhido</small><br><strong style="color:white;">${membro.plano_interesse}</strong></div>
        </div>

        <div style="background:#111; padding:15px; border-radius:8px; border:1px solid #333; margin-bottom:15px;">
            <h4 style="color:white; margin:0 0 10px 0; border-bottom:1px solid #333; padding-bottom:5px;">Dados Pessoais</h4>
            <p><strong>Nome:</strong> ${membro.nome}</p>
            <p><strong>WhatsApp:</strong> ${membro.whatsapp}</p>
            <p><strong>Empresa:</strong> ${membro.empresa || '-'}</p>
            <p><strong>Segmento:</strong> ${membro.segmento || '-'}</p>
            <p><strong>Faturamento:</strong> ${membro.faturamento || 'Não informado'}</p>
        </div>

        <div style="background:#1a1a1a; padding:15px; border-radius:8px; border:1px solid #444;">
            <h4 style="color:var(--gold); margin:0 0 10px 0;">Objetivo / Desafio</h4>
            <p style="font-style:italic; color:#ddd;">"${membro.objetivo || 'Nenhum objetivo registrado.'}"</p>
        </div>
    `;

    // ALTERAÇÃO 4: Botão do WhatsApp VERDE (#25D366)
    footer.innerHTML = `
        <button onclick="deletarMembro(${membro.id}); document.getElementById('modalMembro').style.display='none'" class="btn-delete-modal">Excluir Registro</button>
        <div style="flex:1;"></div>
        <a href="${zapLink}" target="_blank" class="btn-primary" style="background-color: #22944c; border: none; text-decoration:none; display:inline-flex; align-items:center; gap:10px;">
            <i class="fab fa-whatsapp"></i> Chamar no WhatsApp
        </a>
    `;

    modal.style.display = 'flex';
}

async function deletarMembro(id) {
    if(confirm('Tem certeza que deseja excluir este registro de membro?')) {
        try {
            await fetch(`${API_URL}/aplicacoes/${id}`, { method: 'DELETE' });
            carregarAplicacoes();
            carregarDashboard(); 
        } catch (error) {
            alert('Erro ao excluir membro.');
            console.error(error);
        }
    }
}

// ... (O RESTANTE DAS FUNÇÕES DE CASES E FEEDBACKS PERMANECE IGUAL)
let casesCache = [];
async function carregarCases() {
    const res = await fetch(`${API_URL}/cases`);
    casesCache = await res.json();
    const div = document.getElementById('lista-cases');
    div.innerHTML = '';

    casesCache.forEach(c => {
        const img = c.foto_url && c.foto_url.length > 5 ? c.foto_url : 'https://via.placeholder.com/400x300?text=Sem+Foto';
        div.innerHTML += `
            <div class="admin-card" onclick="editarCase(${c.id})">
                <img src="${img}" onerror="this.src='https://via.placeholder.com/400x300?text=Erro+Carregar'">
                <div class="card-content">
                    <h4>${c.nome}</h4>
                    <p>${c.subtitulo}</p>
                </div>
            </div>
        `;
    });
}

function abrirModalCase() {
    document.getElementById('modalTitulo').innerText = "Nova História";
    document.getElementById('caseId').value = "";
    document.getElementById('caseNome').value = "";
    document.getElementById('caseSub').value = "";
    document.getElementById('caseHist').value = "";
    const inputFoto = document.getElementById('caseFotoInput');
    inputFoto.value = "";
    document.getElementById('imgPreview').style.display = 'none';
    document.getElementById('imgPreview').src = "";
    document.getElementById('btnExcluirCase').style.display = 'none';
    document.getElementById('modalCase').style.display = 'flex';
}

function editarCase(id) {
    const c = casesCache.find(i => i.id === id);
    if(!c) return;
    document.getElementById('modalTitulo').innerText = "Editar História";
    document.getElementById('caseId').value = c.id;
    document.getElementById('caseNome').value = c.nome;
    document.getElementById('caseSub').value = c.subtitulo;
    document.getElementById('caseHist').value = c.historia;
    if(c.foto_url) {
        const imgP = document.getElementById('imgPreview');
        imgP.src = c.foto_url;
        imgP.style.display = 'block';
    } else {
        document.getElementById('imgPreview').style.display = 'none';
    }
    document.getElementById('btnExcluirCase').style.display = 'block';
    document.getElementById('modalCase').style.display = 'flex';
}

function fecharModalCase() { document.getElementById('modalCase').style.display = 'none'; }

function previewImagem(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) { 
            const img = document.getElementById('imgPreview');
            img.src = evt.target.result; 
            img.style.display = 'block'; 
        }
        reader.readAsDataURL(file);
    }
}

async function salvarCase() {
    const btn = document.getElementById('btnSalvarCase');
    const txtOriginal = btn.innerText;
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        const id = document.getElementById('caseId').value;
        const formData = new FormData();
        formData.append('nome', document.getElementById('caseNome').value);
        formData.append('subtitulo', document.getElementById('caseSub').value);
        formData.append('historia', document.getElementById('caseHist').value);
        
        const fileInput = document.getElementById('caseFotoInput');
        if(fileInput.files[0]) {
            formData.append('foto', fileInput.files[0]);
        }

        if(id) {
            await fetch(`${API_URL}/cases/${id}`, { method: 'DELETE' });
        }

        const res = await fetch(`${API_URL}/cases`, { method: 'POST', body: formData });
        if(!res.ok) throw new Error('Erro ao salvar');

        fecharModalCase(); 
        carregarCases();
    } catch(e) {
        alert("Erro ao salvar história. Tente novamente.");
        console.error(e);
    } finally {
        btn.innerText = txtOriginal;
        btn.disabled = false;
    }
}

async function deletarCaseAtual() {
    const id = document.getElementById('caseId').value;
    if(confirm('Excluir esta história?')) { 
        await fetch(`${API_URL}/cases/${id}`, { method: 'DELETE' }); 
        fecharModalCase(); 
        carregarCases(); 
    }
}

let feedCache = [];
async function carregarFeedbacks() {
    const res = await fetch(`${API_URL}/depoimentos`);
    feedCache = await res.json();
    renderizarFeedbacks();
}

function renderizarFeedbacks() {
    const div = document.getElementById('lista-feedbacks');
    const filtro = document.getElementById('filtroDataFeed').value;
    div.innerHTML = '';

    const lista = feedCache.filter(f => !filtro || f.created_at.startsWith(filtro));

    if(lista.length === 0) {
        div.innerHTML = '<p style="color:#666; text-align:center;">Nenhum feedback encontrado.</p>';
        return;
    }

    lista.forEach(f => {
        const data = new Date(f.created_at).toLocaleDateString('pt-BR');
        const statusClass = f.aprovado ? 'status-aprovado' : 'status-pendente';
        const statusTxt = f.aprovado ? 'NO AR' : 'PENDENTE';

        div.innerHTML += `
            <div class="feed-row" onclick="abrirDetalhesFeed(${f.id})">
                <div style="display:flex; gap:20px; align-items:center;">
                    <span style="color:#666; font-size:0.8rem; min-width:80px;">${data}</span>
                    <strong style="color:white;">${f.nome}</strong>
                </div>
                <span class="feed-status ${statusClass}">${statusTxt}</span>
            </div>
        `;
    });
}
function limparFiltroFeed() { document.getElementById('filtroDataFeed').value = ''; renderizarFeedbacks(); }

function abrirDetalhesFeed(id) {
    const f = feedCache.find(i => i.id === id);
    if(!f) return;

    const modalBody = document.getElementById('modalFeedBody');
    const img = f.foto_url || 'https://via.placeholder.com/100';
    const estrelas = '⭐'.repeat(f.estrelas || 5);

    const btnAcao = !f.aprovado 
        ? `<button onclick="aprovarFeed(${f.id})" class="btn-primary" style="background:green;">Aprovar e Publicar</button>`
        : `<button onclick="suspenderFeed(${f.id})" class="btn-primary" style="background:#ff9800; color:black; font-weight:bold;">Tornar Pendente</button>`;

    modalBody.innerHTML = `
        <div style="display:flex; gap:20px; align-items:center; margin-bottom:20px;">
            <img src="${img}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid #333;">
            <div>
                <h3 style="margin:0; color:white;">${f.nome}</h3>
                <p style="color:#888; margin:5px 0;">${f.empresa} (${f.plano})</p>
                <div style="color:#d4af37;">${estrelas}</div>
            </div>
        </div>
        <div style="background:#222; padding:20px; border-radius:8px; font-style:italic; color:#ccc; line-height:1.5;">
            "${f.mensagem}"
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:30px;">
            ${btnAcao}
            <button onclick="deletarFeed(${f.id})" class="btn-delete-modal">Excluir</button>
        </div>
    `;
    document.getElementById('modalFeed').style.display = 'flex';
}

async function aprovarFeed(id) {
    await fetch(`${API_URL}/depoimentos/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ aprovado: true }) });
    document.getElementById('modalFeed').style.display='none';
    carregarFeedbacks();
}

async function suspenderFeed(id) {
    if(confirm('Tem certeza que deseja voltar este feedback para Pendente? Ele sairá do site.')) {
        await fetch(`${API_URL}/depoimentos/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ aprovado: false }) });
        document.getElementById('modalFeed').style.display='none';
        carregarFeedbacks();
    }
}

async function deletarFeed(id) {
    if(confirm('Excluir este depoimento?')) { 
        await fetch(`${API_URL}/depoimentos/${id}`, { method: 'DELETE' }); 
        document.getElementById('modalFeed').style.display='none'; 
        carregarFeedbacks(); 
    }
}