const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public')); // Ajuste para o seu diretório do front-end

// ==========================================
// INICIALIZAÇÃO BLINDADA DO BANCO DE DADOS
// ==========================================
let serviceAccount;
try {
    // Tenta ler a chave secreta das Variáveis de Ambiente do Render
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} catch (error) {
    console.warn("⚠️ ALERTA: Chave FIREBASE_CREDENTIALS não encontrada no ambiente.");
}

if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("🔒 Conexão com o Cofre Firestore estabelecida com sucesso!");
}

const db = admin.firestore();
const obterDataAtual = () => new Date().toLocaleDateString('pt-BR');

// ==========================================
// ROTAS DO PORTAL COM FIRESTORE
// ==========================================

// 1. LER TODAS AS NOTÍCIAS
app.get('/api/news', async (req, res) => {
    try {
        const snapshot = await db.collection('noticias').orderBy('id', 'desc').get();
        const noticias = snapshot.docs.map(doc => doc.data());
        res.json(noticias);
    } catch (error) {
        res.status(500).json({ erro: "Falha na comunicação com o banco de dados." });
    }
});

// 2. LER UMA NOTÍCIA ESPECÍFICA
app.get('/api/news/:id', async (req, res) => {
    try {
        const doc = await db.collection('noticias').doc(String(req.params.id)).get();
        if (doc.exists) {
            res.json(doc.data());
        } else {
            res.status(404).json({ erro: "Matéria não encontrada no cofre." });
        }
    } catch (error) {
        res.status(500).json({ erro: "Erro de leitura." });
    }
});

// 3. CRIAR NOVA NOTÍCIA
app.post('/api/news', async (req, res) => {
    const { plataforma, titulo, resumo, autor, tags, imagem, conteudo } = req.body;
    if(!titulo || !conteudo) return res.status(400).json({ erro: "Dados incompletos." });

    const id = Date.now();
    const novaNoticia = {
        id: id,
        plataforma, titulo, 
        resumo: resumo || "", 
        autor: autor || "Comando GLITCHcore", 
        tags: tags || "Atualização", 
        imagem, conteudo,
        data: obterDataAtual(),
        comentarios: [] 
    };
    
    try {
        await db.collection('noticias').doc(String(id)).set(novaNoticia);
        res.status(201).json({ mensagem: "Deploy efetuado no banco de dados!" });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao gravar no cofre." });
    }
});

// 4. EDITAR NOTÍCIA (PATCH)
app.patch('/api/news/:id', async (req, res) => {
    try {
        // O Firestore atualiza apenas os campos enviados, perfeito para a edição!
        await db.collection('noticias').doc(String(req.params.id)).update(req.body);
        res.status(200).json({ mensagem: "Matéria atualizada com sucesso!" });
    } catch (error) {
        res.status(404).json({ erro: "Matéria não encontrada para edição." });
    }
});

// 5. DELETAR NOTÍCIA INTEIRA
app.delete('/api/news/:id', async (req, res) => {
    try {
        await db.collection('noticias').doc(String(req.params.id)).delete();
        res.status(200).json({ mensagem: "Matéria aniquilada do cofre." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao deletar do cofre." });
    }
});

// ==========================================
// SISTEMA DE COMENTÁRIOS COM FIRESTORE
// ==========================================

// Ler Comentários
app.get('/api/news/:id/comments', async (req, res) => {
    try {
        const doc = await db.collection('noticias').doc(String(req.params.id)).get();
        if (doc.exists) {
            const noticia = doc.data();
            res.json(noticia.comentarios || []);
        } else {
            res.status(404).json({ erro: "Matéria não encontrada." });
        }
    } catch (error) {
        res.status(500).json({ erro: "Erro de leitura." });
    }
});

// Adicionar Comentário
app.post('/api/news/:id/comments', async (req, res) => {
    try {
        const docRef = db.collection('noticias').doc(String(req.params.id));
        const doc = await docRef.get();
        
        if (doc.exists) {
            const noticia = doc.data();
            const comentarios = noticia.comentarios || [];
            
            const novoComentario = {
                id: Date.now(),
                nome: req.body.nome,
                foto: req.body.foto,
                texto: req.body.texto,
                data: obterDataAtual(),
                likes: 0
            };
            
            comentarios.unshift(novoComentario);
            await docRef.update({ comentarios: comentarios });
            
            res.status(201).json({ mensagem: "Comentário salvo no cofre!", comentario: novoComentario });
        } else {
            res.status(404).json({ erro: "Matéria não encontrada." });
        }
    } catch (error) {
        res.status(500).json({ erro: "Erro ao adicionar comentário." });
    }
});

// Deletar Comentário (Admin)
app.delete('/api/news/:newsId/comments/:commentId', async (req, res) => {
    try {
        const docRef = db.collection('noticias').doc(String(req.params.newsId));
        const doc = await docRef.get();
        
        if (doc.exists) {
            const noticia = doc.data();
            let comentarios = noticia.comentarios || [];
            comentarios = comentarios.filter(c => String(c.id) !== String(req.params.commentId));
            
            await docRef.update({ comentarios: comentarios });
            res.json({ mensagem: "Comentário eliminado do sistema." });
        } else {
            res.status(404).json({ erro: "Matéria não encontrada." });
        }
    } catch (error) {
        res.status(500).json({ erro: "Erro ao deletar comentário." });
    }
});

// Curtir Comentário
app.post('/api/news/:newsId/comments/:commentId/like', async (req, res) => {
    try {
        const docRef = db.collection('noticias').doc(String(req.params.newsId));
        const doc = await docRef.get();
        
        if (doc.exists) {
            const noticia = doc.data();
            const comentarios = noticia.comentarios || [];
            
            const index = comentarios.findIndex(c => String(c.id) === String(req.params.commentId));
            if (index !== -1) {
                comentarios[index].likes = (comentarios[index].likes || 0) + 1;
                await docRef.update({ comentarios: comentarios });
                res.json({ likes: comentarios[index].likes });
            } else {
                res.status(404).json({ erro: "Comentário não encontrado." });
            }
        }
    } catch (error) {
        res.status(500).json({ erro: "Erro ao curtir." });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🔥 Servidor GLITCHcore online na porta ${port}! Base operando com Firestore.`));
