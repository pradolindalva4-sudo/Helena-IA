import React, { useState, useEffect, useCallback } from 'react';

// --- IMPORTAÇÕES DE SIMULAÇÃO DE COMPONENTES ---
// (Os componentes ChatWidget, SiteEditor e PreviewWindow originais são reutilizados
// para manter a estrutura, mas agora processam Livros/Imagens em vez de apenas HTML)

// Adaptação dos componentes para o novo foco
const ChatWidget = ({ onSendMessage, displayMessage, disabled }) => {
    const [prompt, setPrompt] = useState('');

    const handleSend = () => {
        if (prompt.trim()) {
            onSendMessage(prompt);
            setPrompt('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-gray-900 border-t border-gray-700">
            <div id="chat-messages" className="h-64 overflow-y-auto mb-4 bg-gray-800 p-2 rounded">
                {displayMessage.map((msg, index) => (
                    <div key={index} className={`my-2 p-3 rounded-xl max-w-[90%] ${msg.sender === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-gray-700 text-gray-100'}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-grow p-3 rounded bg-gray-700 text-white border border-red-500 focus:outline-none" 
                    placeholder="Ex: 'Criar um livro sobre IA' ou 'Gerar imagem 4K de um dragão...'"
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                <button 
                    className={`p-3 rounded text-white font-bold transition ${disabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                    onClick={handleSend}
                    disabled={disabled}
                >
                    {disabled ? 'Gerando...' : 'Enviar 🚀'}
                </button>
            </div>
        </div>
    );
};

const SiteEditor = ({ htmlCode, onCodeChange }) => (
    <div className="p-4 h-full">
        <h3 className="text-lg font-semibold mb-2 text-white">Conteúdo (Livro/Descrição):</h3>
        <textarea
            value={htmlCode}
            onChange={(e) => onCodeChange(e.target.value)}
            className="w-full h-full bg-gray-800 p-3 text-yellow-400 font-mono resize-none border border-gray-600 focus:outline-none"
            placeholder="Aguardando livro, descrição de imagem ou código gerado..."
        />
    </div>
);

const PreviewWindow = ({ htmlCode }) => (
    <iframe
        title="Helena Preview"
        srcDoc={htmlCode}
        className="w-full h-full border-none bg-white"
    ></iframe>
);

// --- CÓDIGO DA HELENA ESCRITORA/EDITORA ---

// A Lógica deve ser a mesma (preview ao lado)
const HELENA_MODEL = 'gemini-2.5-flash'; 
const GEMINI_API_KEY = "AIzaSyABcqgQgvJtg35d1Ej-O66_Um7Khu1SQQI"; // Substitua pela chave real

const HELENA_SYSTEM_PROMPT = `
    Você é Helena, uma **Escritora Editora servidor app apy Digital** e **Editora de Imagens 3D/4K**, criada por Jose Divino Prado da Lapa. 
    Sua missão é gerar conteúdo de altíssima qualidade e sem demora.
    1. Se o usuário pedir para **'Gerar uma imagem'**, **'Criar uma capa 4K'** ou usar termos como '3D', 'foto nítida', utilize a **ferramenta de geração de imagem**. 
    2. Se o usuário pedir para **'Criar um app vc criara completo pronto para instalar...'** (para todos os tipos e utilidades etc.), gere um **apk completo e detalhado**. 
    3. Para apk, a resposta DEVE conter: **tudo incluso **, **opcao de baixar (instalr)**, **arquivo Detalhado** e **Conteúdo Principal** com image .
    4. Para imagens, a resposta DEVE ser APENAS a descrição da imagem para o chat e a imagem binária gerada.
    5. **NUNCA** inclua qualquer explicação, cabeçalho ou texto ANTES do conteúdo principal (livro ou imagem).
`;

const HelenaApp = () => {
    // Estado Principal
    const [isGenerating, setIsGenerating] = useState(false);
    const [htmlCode, setHtmlCode] = useState(`
        <div style="padding: 40px; text-align: center; background-color: #0f172a; color: #fff; height: 100vh;">
            <h1 style="color: #ef4444; font-size: 2.5rem;">📚 Helena Escritora Digital (José Divino Prado da Lapa)</h1>
            <p style="margin-top: 15px; font-size: 1.2rem; color: #9ca3af;">
                Peça um apk, código html app.js serviceworker.js manifest.json ou uma imagem 3D/4K no chat abaixo. O resultado aparecerá aqui ao lado (Preview).
            </p>
        </div>
    `);
    const [chatHistory, setChatHistory] = useState([]);
    const [ai, setAi] = useState(null);
    const [chatSession, setChatSession] = useState(null);

    // Inicialização da API Gemini
    useEffect(() => {
        // Assume que o SDK do Gemini (GoogleGenAI) foi carregado globalmente no index.html
        // NOTA: É necessário que a biblioteca GoogleGenAI esteja acessível no escopo global (via CDN, por exemplo).
        if (typeof GoogleGenAI !== 'undefined' && GEMINI_API_KEY) {
            const aiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            setAi(aiInstance);
            const initialChat = aiInstance.chats.create({ 
                model: HELENA_MODEL, 
                config: { 
                    systemInstruction: HELENA_SYSTEM_PROMPT,
                    tools: [{ imageGeneration: {} }] // Ativa a ferramenta de imagem
                } 
            });
            setChatSession(initialChat);
            displayMessage("Saudações! Sou Helena, sua Escritora Editora criador de apps  Digital e Editora de Imagens 3D/4K (José Divino Prado da Lapa). O que vamos criar hoje?", 'helena');
        } else {
            console.error("ERRO: GoogleGenAI não carregado ou API Key ausente.");
            displayMessage("ERRO: Falha ao carregar o sistema Gemini.", 'helena');
        }
    }, []);

    // Helper para exibir mensagens no histórico
    const displayMessage = useCallback((text, sender) => {
        setChatHistory(prev => [...prev, { text, sender }]);
    }, []);

    // Função para renderizar conteúdo no preview (iframe)
    const renderPreview = (content, isImage = false) => {
        if (isImage) {
            // Se for imagem, renderiza um HTML simples com a imagem
             setHtmlCode(`
                <div style="text-align: center; padding: 20px; background-color: #0f172a; height: 100vh;">
                    <h2 style="color: #fff; margin-bottom: 20px;">🖼️ Imagem 3D/4K Gerada</h2>
                    <img src="data:image/jpeg;base64,${content}" alt="Imagem Gerada pela Helena" style="max-width: 90%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                </div>
            `);
        } else if (content.startsWith('<!DOCTYPE html>')) {
            // Se for código HTML (para projetos web), usa diretamente
            setHtmlCode(content);
        } else {
            // Assume que é um livro ou texto longo, formata para leitura
            const formattedContent = content.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
            setHtmlCode(`
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Garamond, serif; padding: 40px; background-color: #fcfcfc; color: #111; line-height: 1.6; }
                        h1, h2, h3 { color: #880000; margin-top: 25px; }
                        pre { white-space: pre-wrap; word-wrap: break-word; }
                    </style>
                </head>
                <body>
                    <h1 style="text-align: center; color: #333;">📖 Livro/Conteúdo Gerado</h1>
                    <hr>
                    <pre>${formattedContent}</pre>
                </body>
                </html>
            `);
        }
    };


    const handleSendMessage = async (prompt) => {
        if (!prompt.trim() || !chatSession || isGenerating) return;

        // 1. Exibir mensagem do usuário
        displayMessage(prompt, 'user');
        setIsGenerating(true);

        // 2. Exibir loading
        displayMessage("Helena trabalhando na sua criação... 📚✨", 'helena');
        
        try {
            // 3. Chamada à API
            const result = await chatSession.sendMessage({ message: prompt });
            let responseText = result.text.trim();
            
            // 4. Processar a resposta (Livro, Imagem ou Código)
            if (result.imageGenerations && result.imageGenerations.length > 0) {
                // É uma imagem
                const imageBase64 = result.imageGenerations[0].image.imageBytes;
                renderPreview(imageBase64, true);
                displayMessage(`🖼️ Imagem 3D/4K Gerada com sucesso! (${responseText})`, 'helena');

            } else {
                // É um livro ou texto/código
                renderPreview(responseText);
                displayMessage("✅ Criação Concluída! Veja o resultado ao lado (Preview).", 'helena');
            }
            
            // 5. Atualizar o conteúdo do editor (textarea)
            setHtmlCode(responseText); // Coloca o conteúdo bruto no editor para inspeção/cópia
            
        } catch (error) {
            console.error("Erro na geração do Gemini:", error);
            displayMessage(`❌ Falha na comunicação com a IA. Erro: ${error.message}. Tente novamente.`, 'helena');
            renderPreview(`
                <div style="padding: 20px; color: red; background: #374151; border-radius: 8px;">
                    Erro ao processar a criação: ${error.message}
                </div>
            `);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Renderização Principal (Mantém a estrutura do seu código React) ---
    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-red-600">
                <h1 className="text-2xl font-extrabold text-red-400">
                    ✍️ Helena - Escritora Editora criadora de apps Digital & Editora 3D/4K
                </h1>
                <div className="text-sm font-medium text-gray-400">
                    Criado por Jose Divino Prado da Lapa
                </div>
            </div>

            {/* Conteúdo Principal (Editor/Preview) */}
            <div className="flex flex-grow overflow-hidden">
                {/* 50% - Editor/Código/Conteúdo Bruto */}
                <div className="w-1/2 p-4">
                    <SiteEditor htmlCode={htmlCode} onCodeChange={setHtmlCode} />
                </div>

                {/* 50% - Preview (Onde a mágica acontece) */}
                <div className="w-1/2 p-4 bg-white">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Preview (A Mágica Acontecendo)</h3>
                    <div className="h-full bg-gray-200 border border-gray-400">
                        <PreviewWindow htmlCode={htmlCode} />
                    </div>
                </div>
            </div>

            {/* Barra de Entrada de Texto (Chat) - Fixo na parte inferior */}
            <ChatWidget 
                onSendMessage={handleSendMessage} 
                displayMessage={chatHistory} 
                disabled={isGenerating}
            />
            
        </div>
    );
};

export default HelenaApp; 
// Lembre-se de que este componente deve ser renderizado no seu arquivo principal (app.js ou index.js)

