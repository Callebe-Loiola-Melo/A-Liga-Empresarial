// --- CONFIGURAÇÃO DA API ---
const API_URL = '/.netlify/functions/api';

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Site carregado! Iniciando...");
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    carregarCasesSite();
    carregarDepoimentosSite();
});

// --- LÓGICA DO FORMULÁRIO DE APLICAÇÃO (MOSTRAR/ESCONDER FATURAMENTO) ---
function verificarPlano() {
    const planoSelecionado = document.querySelector('input[name="plano"]:checked')?.value;
    const divFat = document.getElementById('containerFaturamento');

    if (planoSelecionado === 'Contador Alpha') {
        // Se for Alpha, ESCONDE e limpa a seleção
        divFat.style.display = 'none';
        const radiosFat = document.querySelectorAll('input[name="faturamento"]');
        radiosFat.forEach(r => r.checked = false);
    } else {
        // Se for Start ou Premium, MOSTRA
        divFat.style.display = 'block';
    }
}

// --- LÓGICA DOS MODAIS DE PLANOS ---
const planosData = {
    start: {
        title: "LIGA START",
        price: "R$ 149,97 / mês",
        content: `
            <ul>
                <li><i class="fas fa-check"></i> Foco em autoconhecimento, vendas e Marketing.</li>
                <li><i class="fas fa-check"></i> Aulas segundas ao vivo (online 20h).</li>
                <li><i class="fas fa-check"></i> Acesso a gravação das aulas.</li>
                <li><i class="fas fa-check"></i> Mentoria coletiva online pós-aula.</li>
                <li><i class="fas fa-check"></i> Acesso ao Encontro Empresarial Xeque-mate.</li>
                <li><i class="fas fa-check"></i> Até 2x por mês tenha acesso á Mesa de Negociações online.</li>
            </ul>
        `
    },
    premium: {
        title: "LIGA PREMIUM",
        price: "R$ 500,00 / mês",
        content: `
            <ul>
                <li><i class="fas fa-check"></i> Tudo do plano START incluso.</li>
                <li><i class="fas fa-check"></i> Foco em empresários faturando acima de 20mil/mês.</li>
                <li><i class="fas fa-check"></i> Foco em montagem de times, vendas e marketing.</li>
                <li><i class="fas fa-check"></i> Acesso ao conselho empresarial próprio (Conselho premium).</li>
            </ul>
        `
    },
    alpha: {
        title: "CONTABILIDADE ALPHA",
        price: "R$ 500,00 / mês", 
        content: `
            <ul class="lista-alpha">
                <li>
                    <i class="fas fa-check"></i>
                    <div>
                        Grupo exclusivo para donos de contabilidade.
                    </div>
                </li>
                <li>
                    <i class="fas fa-check"></i>
                    <div>
                        Programa estruturado com início, meio e fim.
                    </div>
                </li>
                <li>
                    <i class="fas fa-check"></i>
                    <div>
                        2h de imersão em casos reais + 1h de mentoria coletiva
                        (Por encontro presencial).
                    </div>
                </li>
                 <li>
                    <i class="fas fa-check"></i>
                    <div>
                       Conselho empresarial próprio de contadores.
                    </div>
                </li>
                <li>
                    <i class="fas fa-check"></i>
                    <div>
                        Aprenda a faturar até 6x mais do mesmo cliente.
                    </div>
                </li>
            </ul>
        `
    }
};

window.abrirModalPlano = function(tipo) {
    const modal = document.getElementById('modalPlanos');
    const title = document.getElementById('planTitle');
    const price = document.getElementById('planPrice');
    const content = document.getElementById('planContent');
    const data = planosData[tipo];

    if(data && modal) {
        title.innerText = data.title;
        price.innerText = data.price;
        content.innerHTML = data.content;
        
        // Remove classes de temas anteriores
        modal.classList.remove('premium-theme');
        modal.classList.remove('silver-theme');
        modal.classList.remove('gold-theme');

        // Reseta cores para o padrão (Start - Azul)
        title.style.color = '#1762ca'; 
        price.style.color = '#1762ca';

        // LÓGICA DE CORES
        if(tipo === 'premium') {
            modal.classList.add('silver-theme'); // Ativa Cinza
        } 
        else if (tipo === 'alpha') {
            modal.classList.add('gold-theme'); // Ativa Dourado
        }

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

window.fecharModalPlano = function() {
    const modal = document.getElementById('modalPlanos');
    if(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Fechar ao clicar fora
window.onclick = function(e) {
    const mContato = document.getElementById('modalContato');
    const mPlanos = document.getElementById('modalPlanos');
    
    if(e.target == mContato) fecharModalContato();
    if(e.target == mPlanos) fecharModalPlano();
}

// --- CARREGAMENTO DE DADOS ---
async function carregarCasesSite() {
    const container = document.getElementById('lista-cases-site');
    if(!container) return; 
    try {
        const res = await fetch(`${API_URL}/cases?t=${Date.now()}`);
        const cases = await res.json();
        container.innerHTML = ''; 
        if (cases.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; width:100%;">Em breve novas histórias.</p>';
            return;
        }
        cases.forEach(c => {
            const imgUrl = c.foto_url && c.foto_url.length > 10 ? c.foto_url : 'https://placehold.co/600x400/111/FFF?text=Historia';
            const card = document.createElement('div');
            card.className = 'case-card fade-up';
            card.innerHTML = `
                <div class="case-img" style="background-image: url('${imgUrl}');"></div>
                <div class="case-info" style="padding: 25px;">
                    <h4 style="color:white; margin:0 0 5px 0;">${c.nome}</h4>
                    <span style="color:#0044cc; font-weight:700; font-size:0.8rem; text-transform:uppercase;">${c.subtitulo}</span>
                    <p style="color:#ccc; font-size:0.9rem; margin-top:10px; font-style:italic;">"${c.historia}"</p>
                </div>
            `;
            container.appendChild(card);
            observer.observe(card);
        });
    } catch (error) { console.error("❌ Erro ao carregar cases:", error); }
}

async function carregarDepoimentosSite() {
    const container = document.getElementById('lista-depoimentos-site');
    if(!container) return; 
    try {
        const res = await fetch(`${API_URL}/depoimentos?aprovados=true&t=${Date.now()}`);
        const depos = await res.json();
        container.innerHTML = '';
        if (depos.length === 0) {
            container.innerHTML = '<p style="color:#666; text-align:center;">Seja o primeiro a deixar seu legado!</p>';
            return;
        }
        depos.forEach(d => {
            const inicial = d.nome.charAt(0).toUpperCase();
            const placeholder = `https://placehold.co/100x100/333/FFF?text=${inicial}`;
            const imgUser = d.foto_url && d.foto_url.length > 10 ? d.foto_url : placeholder;
            const estrelas = '⭐'.repeat(d.estrelas || 5);
            const card = document.createElement('div');
            card.className = 'testimonial-item fade-up';
            card.innerHTML = `
                <div class="testimonial-header">
                    <img src="${imgUser}" class="user-avatar" 
                         onerror="this.src='${placeholder}'"
                         style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #0044cc;">
                    <div class="user-info">
                        <h4>${d.nome}</h4>
                        <small>${d.empresa}</small>
                        <span class="user-badge badge-${d.plano}">${d.plano}</span>
                        <div class="stars-display" style="color:#d4af37; margin-top:5px; font-size:0.8rem;">${estrelas}</div>
                    </div>
                </div>
                <p style="color:#ccc; line-height:1.6; font-style:italic;">"${d.mensagem}"</p>
            `;
            container.appendChild(card);
            observer.observe(card);
        });
    } catch (error) { console.error("❌ Erro ao carregar depoimentos:", error); }
}

// --- 3. ENVIO DE FORMULÁRIOS ---

// Formulário de Depoimentos
const formDepo = document.getElementById('formDepoimento');
if(formDepo) {
    formDepo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formDepo.querySelector('button');
        const txtOri = btn.innerText;
        btn.innerText = "Enviando..."; btn.disabled = true;

        const formData = new FormData();
        formData.append('nome', document.getElementById('depoNome').value);
        formData.append('empresa', document.getElementById('depoEmpresa').value);
        formData.append('plano', document.getElementById('depoPlano').value);
        formData.append('mensagem', document.getElementById('depoMsg').value);
        
        const star = document.querySelector('input[name="star"]:checked');
        formData.append('estrelas', star ? star.value : 5);

        const fotoInput = document.getElementById('depoFoto');
        if(fotoInput && fotoInput.files[0]) {
            // Comprime a foto antes de enviar
            const fotoComprimida = await comprimirImagem(fotoInput.files[0]);
            formData.append('foto', fotoComprimida);
        }

        try {
            await fetch(`${API_URL}/depoimentos`, { method: 'POST', body: formData });
            alert("✅ Depoimento enviado para análise!");
            formDepo.reset();
            document.getElementById('previewFoto').style.display = 'none';
            document.getElementById('iconCamera').style.display = 'block';
        } catch (e) { alert("Erro ao enviar."); } 
        finally { btn.innerText = txtOri; btn.disabled = false; }
    });
}

// --- FORMULÁRIO DE APLICAÇÃO (MEMBROS) - ATUALIZADO ---
const formApp = document.getElementById('formAplicacao');
if(formApp) {
    formApp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formApp.querySelector('button');
        const txtOriginal = btn.innerText;
        btn.innerText = "Processando...";
        btn.disabled = true;

        // 1. Coleta os dados
        const dados = {
            nome: document.getElementById('appNome').value,
            whatsapp: document.getElementById('appZap').value,
            empresa: document.getElementById('appEmpresa').value,
            segmento: document.getElementById('appSegmento').value,
            plano_interesse: document.querySelector('input[name="plano"]:checked')?.value,
            // Faturamento pode ser vazio se for Contador Alpha
            faturamento: document.querySelector('input[name="faturamento"]:checked')?.value || "", 
            objetivo: document.getElementById('appObjetivo').value
        };

        // VALIDAÇÃO INTELIGENTE
        if (!dados.plano_interesse) {
            alert('Por favor, selecione um Plano.');
            btn.innerText = txtOriginal; btn.disabled = false;
            return;
        }

        // Se NÃO for Contador Alpha e não tiver faturamento, barra.
        if (dados.plano_interesse !== 'Contador Alpha' && !dados.faturamento) {
            alert('Por favor, informe seu Faturamento atual.');
            btn.innerText = txtOriginal; btn.disabled = false;
            return;
        }

        try {
            // 2. Tenta salvar no Banco de Dados
            const response = await fetch(`${API_URL}/aplicar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (!response.ok) throw new Error('Erro no servidor');

            // 3. Redirecionamento baseado no plano
            if (dados.plano_interesse === 'Start') {
                window.location.href = 'https://pay.kiwify.com.br/lVYnA79?afid=mYrzh5x6';
            
            } else if (dados.plano_interesse === 'Premium') {
                window.location.href = 'https://pay.kiwify.com.br/iQTcFoB';
            
            } else if (dados.plano_interesse === 'Contador Alpha') {
                // Mensagem WhatsApp Formatada
                const msg = `Olá! Gostaria de marcar uma mentoria em relação ao plano de serviço *Contabilidade Alpha*.%0A%0A` +
                            `*Meus Dados:*%0A` +
                            `👤 Nome: ${dados.nome}%0A` +
                            `🏢 Empresa: ${dados.empresa}%0A` +
                            `📱 Contato: ${dados.whatsapp}%0A` +
                            `🎯 Objetivo: ${dados.objetivo}`;
                
                window.open(`https://api.whatsapp.com/send?phone=5561995778295&text=${msg}`, '_blank');
                btn.innerText = "Enviado!";
            }

        } catch (e) { 
            console.error(e); 
            alert('Erro ao processar sua aplicação. Tente novamente ou chame no suporte.');
            btn.innerText = txtOriginal; 
            btn.disabled = false;
        }
    });
}

// Helpers
window.previewImagem = function(input) {
    if (input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = function(e) {
            document.getElementById('previewFoto').src = e.target.result;
            document.getElementById('previewFoto').style.display = 'block';
            document.getElementById('iconCamera').style.display = 'none';
        }
        r.readAsDataURL(input.files[0]);
    }
}

window.abrirModalContato = function(e) {
    if(e) e.preventDefault();
    const m = document.getElementById('modalContato');
    if(m) { m.style.display='flex'; setTimeout(()=>m.classList.add('show'),10); }
}
window.fecharModalContato = function() {
    const m = document.getElementById('modalContato');
    if(m) { m.classList.remove('show'); setTimeout(()=>m.style.display='none',300); }
}

// --- CONTROLE DE MÚSICA ---
const audio = document.getElementById("musicaSite");
const musicBtn = document.querySelector(".music-btn");
const musicIcon = document.getElementById("musicIcon");

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => {
            musicBtn.classList.add("playing");
            musicIcon.classList.remove("fa-music");
            musicIcon.classList.add("fa-pause");
        }).catch(error => {
            console.log("Bloqueio de autoplay do navegador:", error);
            alert("Clique na página para interagir antes de tocar a música!");
        });
    } else {
        audio.pause();
        musicBtn.classList.remove("playing");
        musicIcon.classList.remove("fa-pause");
        musicIcon.classList.add("fa-music");
    }
}

// --- FUNÇÃO PARA COMPRIMIR IMAGENS ---
async function comprimirImagem(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(newFile);
                }, 'image/jpeg', quality);
            };
        };
    });
}