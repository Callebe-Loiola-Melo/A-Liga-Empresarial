const API_URL = '/.netlify/functions/api';

if (!localStorage.getItem('adminLogado')) window.location.href = 'login.html';

document.addEventListener('DOMContentLoaded', () => {
    // Inicia silenciosamente
});

function mudarAba(aba) {
    document.querySelectorAll('.aba').forEach(e => e.style.display = 'none');
    document.getElementById(`aba-${aba}`).style.display = 'block';
    
    const menu = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if(menu) menu.classList.remove('show');
    if(overlay) overlay.classList.remove('show');

    const menuItems = document.querySelectorAll('.menu li');
    menuItems.forEach(li => li.classList.remove('active'));

    if(aba === 'dashboard') menuItems[0].classList.add('active');
    if(aba === 'cases') {
        menuItems[1].classList.add('active');
        carregarCases();
    }
    if(aba === 'feedbacks') {
        menuItems[2].classList.add('active');
        carregarFeedbacks();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

function logout() { localStorage.removeItem('adminLogado'); window.location.href = 'login.html'; }

// --- CASES (Com Cropper 3x4) ---
let casesCache = [];
let cropper = null; 

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
    document.getElementById('caseFotoInput').value = "";
    
    if (cropper) { cropper.destroy(); cropper = null; }
    document.getElementById('areaPreviewCrop').style.display = 'none';
    document.getElementById('btnEscolherFoto').style.display = 'block';
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
    
    document.getElementById('caseFotoInput').value = "";
    if (cropper) { cropper.destroy(); cropper = null; }

    if(c.foto_url) {
        document.getElementById('imgPreview').src = c.foto_url;
        document.getElementById('areaPreviewCrop').style.display = 'block';
        document.getElementById('btnEscolherFoto').style.display = 'none';
        document.getElementById('txtInstrucaoCrop').style.display = 'none'; 
    } else {
        document.getElementById('areaPreviewCrop').style.display = 'none';
        document.getElementById('btnEscolherFoto').style.display = 'block';
    }

    document.getElementById('btnExcluirCase').style.display = 'block';
    document.getElementById('modalCase').style.display = 'flex';
}

function fecharModalCase() { 
    if (cropper) { cropper.destroy(); cropper = null; }
    document.getElementById('modalCase').style.display = 'none'; 
}

function previewImagem(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) { 
            const img = document.getElementById('imgPreview');
            img.src = evt.target.result; 
            
            document.getElementById('btnEscolherFoto').style.display = 'none';
            document.getElementById('areaPreviewCrop').style.display = 'block';
            document.getElementById('txtInstrucaoCrop').style.display = 'block';

            if (cropper) { cropper.destroy(); }
            cropper = new Cropper(img, {
                aspectRatio: 16 / 9,
                viewMode: 1, 
                autoCropArea: 1, 
                responsive: true,
                background: false
            });
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
        
        if(cropper) {
            const blob = await new Promise(resolve => {
                cropper.getCroppedCanvas({ maxWidth: 900, maxHeight: 1200 }).toBlob((b) => resolve(b), 'image/jpeg', 0.8);
            });
            formData.append('foto', blob, 'foto_case.jpg');
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

// --- FEEDBACKS ---
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