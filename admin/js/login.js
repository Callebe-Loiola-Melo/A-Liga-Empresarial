const API_URL = '/.netlify/functions/api';

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnEntrar');
    const msg = document.getElementById('msgErro');
    
    btn.innerText = "Verificando...";
    btn.disabled = true;
    msg.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('senha').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('adminLogado', 'true');
            window.location.href = 'painel.html';
        } else {
            throw new Error('Dados incorretos');
        }
    } catch (error) {
        msg.style.display = 'block';
        btn.innerText = "ENTRAR";
        btn.disabled = false;
    }
});