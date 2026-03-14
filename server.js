const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const obterDataAtual = () => new Date().toLocaleDateString('pt-BR');

let noticias = [
    {
        id: 1700000001,
        plataforma: "pc",
        titulo: "Nova Engine Revelada: Gráficos e Balística Absurdos",
        imagem: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1000",
        data: obterDataAtual(),
        conteudo: "Os desenvolvedores finalmente revelaram a nova engine. Para quem joga de sniper no modo hardcore, a nova física de vento e gravidade vai mudar completamente a forma como calculamos os tiros a longa distância. A atualização chega no próximo mês.",
        resumo: "A nova física de vento e gravidade vai mudar completamente os tiros de sniper.",
        autor: "Comando GLITCHcore",
        tags: "Atualização, PC Gamer, Sniper",
        comentarios: [] 
    },
    {
        id: 1700000002,
        plataforma: "playstation",
        titulo: "Ghost of Tsushima 2 anunciado para PS5",
        imagem: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=1000",
        data: "Ontem",
        conteudo: "A aguardada sequência finalmente ganhou seu primeiro teaser. O combate com katanas parece ainda mais fluido e brutal, tirando o máximo de proveito do controle DualSense.",
        resumo: "Combate com katanas ainda mais brutal com o DualSense.",
        autor: "Comando GLITCHcore",
        tags: "Lançamento, PS5",
        comentarios: []
    }
];

// 1. ROTA: LER TODAS AS NOTÍCIAS
app.get('/api/news', (req, res) => res.json(noticias));

// 2. ROTA: LER UMA NOTÍCIA ESPECÍFICA
app.get('/api/news/:id', (req, res) => {
    const noticia = noticias.find(n => String(n.id) === String(req.params.id));
    noticia ? res.json(noticia) : res.status(404).json({ erro: "Matéria não encontrada." });
});

// 3. ROTA: CRIAR NOVA NOTÍCIA
app.post('/api/news', (req, res) => {
    const { plataforma, titulo, resumo, autor, tags, imagem, conteudo } = req.body;
    if(!titulo || !conteudo) return res.status(400).json({ erro: "Dados incompletos." });

    const novaNoticia = {
        id: Date.now(),
        plataforma, 
        titulo, 
        resumo: resumo || "", 
        autor: autor || "Comando GLITCHcore", 
        tags: tags || "Atualização", 
        imagem, 
        conteudo,
        data: obterDataAtual(),
        comentarios: [] 
    };
    
    noticias.unshift(novaNoticia);
    res.status(201).json({ mensagem: "Transmissão efetuada com sucesso!" });
});

// ==========================================
// 4. NOVA ROTA MESTRA: EDITAR NOTÍCIA (PATCH)
// ==========================================
app.patch('/api/news/:id', (req, res) => {
    const { plataforma, titulo, resumo, autor, tags, imagem, conteudo } = req.body;
    const noticiaId = String(req.params.id);
    
    // Procura o índice da matéria no array do banco de dados (em memória)
    const indexDaNoticia = noticias.findIndex(n => String(n.id) === noticiaId);

    // Se a matéria existe, atualiza os dados
    if (indexDaNoticia !== -1) {
        noticias[indexDaNoticia] = {
            ...noticias[indexDaNoticia], // Mantém IDs, datas e comentários intactos
            plataforma: plataforma || noticias[indexDaNoticia].plataforma,
            titulo: titulo || noticias[indexDaNoticia].titulo,
            resumo: resumo || noticias[indexDaNoticia].resumo,
            imagem: imagem || noticias[indexDaNoticia].imagem,
            conteudo: conteudo || noticias[indexDaNoticia].conteudo
            // Você pode adicionar autor e tags se decidir deixá-los editáveis no painel futuro
        };
        
        res.status(200).json({ mensagem: "Matéria atualizada com sucesso!" });
    } else {
        res.status(404).json({ erro: "Matéria não encontrada no servidor." });
    }
});

// 5. ROTA: DELETAR NOTÍCIA INTEIRA
app.delete('/api/news/:id', (req, res) => {
    const noticiaId = String(req.params.id);
    const tamanhoOriginal = noticias.length;
    
    // Filtra removendo a notícia do ID fornecido
    noticias = noticias.filter(n => String(n.id) !== noticiaId);

    if (noticias.length < tamanhoOriginal) {
        res.status(200).json({ mensagem: "Matéria aniquilada com sucesso." });
    } else {
        res.status(404).json({ erro: "Matéria não encontrada para deleção." });
    }
});

// 6. ROTAS DE COMENTÁRIOS (INTACTAS)
app.get('/api/news/:id/comments', (req, res) => {
    const noticia = noticias.find(n => String(n.id) === String(req.params.id));
    if (noticia) {
        res.json(noticia.comentarios || []);
    } else {
        res.status(404).json({ erro: "Matéria não encontrada." });
    }
});

app.post('/api/news/:id/comments', (req, res) => {
    const noticia = noticias.find(n => String(n.id) === String(req.params.id));
    if (noticia) {
        if (!noticia.comentarios) noticia.comentarios = []; 
        
        const novoComentario = {
            id: Date.now(),
            nome: req.body.nome,
            foto: req.body.foto,
            texto: req.body.texto,
            data: obterDataAtual(),
            likes: 0
        };
        
        noticia.comentarios.unshift(novoComentario); 
        res.status(201).json({ mensagem: "Comentário adicionado com sucesso!", comentario: novoComentario });
    } else {
        res.status(404).json({ erro: "Matéria não encontrada." });
    }
});

app.delete('/api/news/:newsId/comments/:commentId', (req, res) => {
    const noticia = noticias.find(n => String(n.id) === String(req.params.newsId));
    if (noticia) {
        const index = noticia.comentarios.findIndex(c => String(c.id) === String(req.params.commentId));
        if (index !== -1) {
            noticia.comentarios.splice(index, 1); 
            res.json({ mensagem: "Comentário eliminado do sistema." });
        } else {
            res.status(404).json({ erro: "Comentário não encontrado." });
        }
    } else {
        res.status(404).json({ erro: "Matéria não encontrada." });
    }
});

app.listen(3000, () => console.log("🔥 Servidor GLITCHcore online na porta 3000! Base pronta para CRUD completo."));