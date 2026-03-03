require('dotenv').config();
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

// --- DIAGNÓSTICO DE INICIALIZAÇÃO ---
console.log("--- INICIANDO SERVIDOR ---");
console.log("URL Supabase:", process.env.SUPABASE_URL ? "Carregada ✅" : "FALTANDO ❌");
console.log("Key Supabase:", process.env.SUPABASE_KEY ? "Carregada ✅" : "FALTANDO ❌");

// Conexão
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});

app.use(cors());
app.use(express.json());

// --- FUNÇÃO MÁGICA DE LIMPEZA DE NOME ---
// Remove acentos (ã -> a), espaços e caracteres especiais
const limparNome = (nome) => {
    return nome
        .normalize('NFD') // Separa acentos das letras
        .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
        .replace(/[^a-zA-Z0-9.]/g, "_") // Troca tudo que não for letra/número/ponto por underline
        .toLowerCase(); // Deixa tudo minúsculo
};

// --- ROTA DE TESTE ---
app.get('/', (req, res) => res.send('API da Liga rodando! 🚀'));

// --- LOGIN ---
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        return res.json({ success: true, token: 'admin-token-super-seguro' });
    }
    return res.status(401).json({ success: false, message: 'Acesso negado.' });
});

// --- CASOS DE SUCESSO (HISTÓRIAS) ---
app.get('/cases', async (req, res) => {
    const { data, error } = await supabase.from('cases_sucesso').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ROTA DE UPLOAD (AGORA BLINDADA)
app.post('/cases', upload.single('foto'), async (req, res) => {
    console.log("--- TENTATIVA DE UPLOAD (CASES) ---");
    
    try {
        const { nome, subtitulo, historia } = req.body;
        let fotoUrl = '';

        if (req.file) {
            // AQUI ESTÁ A CORREÇÃO: Limpa o nome antes de usar
            const nomeLimpo = limparNome(req.file.originalname);
            const fileName = `cases/${Date.now()}_${nomeLimpo}`;
            
            console.log("Nome original:", req.file.originalname);
            console.log("Nome limpo:", fileName);

            // Tenta subir para o Supabase
            const { error: uploadError } = await supabase.storage
                .from('liga-assets')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });
            
            if (uploadError) {
                console.error("ERRO NO UPLOAD DO SUPABASE:", uploadError);
                throw uploadError;
            }

            // Pega URL
            const { data: urlData } = supabase.storage.from('liga-assets').getPublicUrl(fileName);
            fotoUrl = urlData.publicUrl;
            console.log("Upload sucesso! URL:", fotoUrl);
        }

        const { error: dbError } = await supabase.from('cases_sucesso').insert([{
            nome, subtitulo, historia, foto_url: fotoUrl
        }]);

        if (dbError) {
            console.error("ERRO NO BANCO DE DADOS:", dbError);
            throw dbError;
        }

        console.log("História salva com sucesso!");
        res.json({ success: true });

    } catch (err) {
        console.error("ERRO GERAL:", err.message);
        res.status(500).json({ error: 'Erro ao processar: ' + err.message });
    }
});

app.delete('/cases/:id', async (req, res) => {
    const { error } = await supabase.from('cases_sucesso').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- DEPOIMENTOS ---
app.get('/depoimentos', async (req, res) => {
    let query = supabase.from('depoimentos').select('*').order('created_at', { ascending: false });
    if (req.query.aprovados === 'true') query = query.eq('aprovado', true);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/depoimentos', upload.single('foto'), async (req, res) => {
    console.log("--- TENTATIVA DE UPLOAD (FEEDBACK) ---");
    try {
        const { nome, empresa, plano, mensagem, estrelas } = req.body;
        let fotoUrl = '';

        if (req.file) {
            // AQUI TAMBÉM: Limpa o nome
            const nomeLimpo = limparNome(req.file.originalname);
            const fileName = `feedbacks/${Date.now()}_${nomeLimpo}`;
            
            const { error: upError } = await supabase.storage
                .from('liga-assets')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
            
            if (upError) {
                console.error("Erro upload feedback:", upError);
                throw upError;
            }
            
            const { data } = supabase.storage.from('liga-assets').getPublicUrl(fileName);
            fotoUrl = data.publicUrl;
        }

        const { error } = await supabase.from('depoimentos').insert([{
            nome, empresa, plano, mensagem, estrelas: parseInt(estrelas) || 5, foto_url: fotoUrl, aprovado: false
        }]);

        if (error) throw error;
        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao enviar depoimento.' });
    }
});

app.put('/depoimentos/:id', async (req, res) => {
    const { aprovado } = req.body;
    const { error } = await supabase.from('depoimentos').update({ aprovado }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/depoimentos/:id', async (req, res) => {
    const { error } = await supabase.from('depoimentos').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- APLICAÇÕES (MEMBROS) ---
app.post('/aplicar', async (req, res) => {
    const { error } = await supabase.from('aplicacoes').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.get('/aplicacoes', async (req, res) => {
    const { data, error } = await supabase.from('aplicacoes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// --- ROTA DELETAR MEMBRO (NOVA) ---
app.delete('/aplicacoes/:id', async (req, res) => {
    const { error } = await supabase.from('aplicacoes').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

module.exports.handler = serverless(app, { basePath: '/.netlify/functions/api' });