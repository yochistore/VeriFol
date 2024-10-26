let followers = new Set();
let verifiedFollowers = new Set(); // Conjunto para seguidores verificados
let maxFollowers = Infinity; // Capturar todos os seguidores
let verifiedFollowerCount = 0;
let fullVersionUnlocked = false;

// Recupera o estado de desbloqueio da versão completa
chrome.storage.local.get(['fullVersionUnlocked'], (result) => {
    fullVersionUnlocked = result.fullVersionUnlocked || false;
    console.log("Estado de desbloqueio carregado no content script:", fullVersionUnlocked); // Log de depuração
});

// Função para capturar seguidores verificados
function getVerifiedFollowers() {
    console.log("Coletando seguidores...");

    // Captura elementos que podem conter usernames
    document.querySelectorAll('span').forEach(element => {
        const textContent = element.textContent;

        // Verifica se há um "@" e captura apenas o primeiro encontrado
        const atIndex = textContent.indexOf('@');
        if (atIndex !== -1) {
            // Extrai o username começando do "@" até o próximo espaço ou fim da string
            const follower = textContent.slice(atIndex).split(' ')[0].trim();
            console.log(`Seguidor encontrado: ${follower}`);

            // Adiciona o seguidor à lista se ainda não foi adicionado
            if (!followers.has(follower)) {
                followers.add(follower);
                
                // Verifica se o seguidor já foi verificado
                if (!verifiedFollowers.has(follower)) {
                    verifiedFollowers.add(follower);
                    verifiedFollowerCount++;
                    console.log(`Seguidor verificado adicionado: ${follower}`);
                    chrome.runtime.sendMessage({ action: "incrementVerifiedCount" });
                }
            }
        }
    });

    console.log(`Total de seguidores coletados: ${followers.size}`);
    console.log(`Total de seguidores verificados: ${verifiedFollowerCount}`);

    // Exibe o aviso e desabilita a coleta após 100 seguidores verificados
    if (verifiedFollowerCount >= 100 && !fullVersionUnlocked) {
        alert("Você atingiu a cota free de 100 seguidores verificados. Use o código para versão full !");
        return false;
    }

    return true;
}

// Função para rolar e coletar seguidores
function scrollAndCollectFollowers(callback) {
    let previousHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    setTimeout(() => {
        let newHeight = document.body.scrollHeight;
        console.log(`Altura anterior: ${previousHeight}, Nova altura: ${newHeight}`);
        if (getVerifiedFollowers() && followers.size < maxFollowers && newHeight !== previousHeight) {
            scrollAndCollectFollowers(callback);
        } else {
            callback(followers);
        }
    }, 1800); // Ajustado para 1,8 segundos
}

// Escuta mensagens do popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Mensagem recebida no content script:", request.action);
    if (request.action === "getFollowers" || request.action === "getFollowersFull") {
        console.log("Iniciando coleta de seguidores:", request.action);
        maxFollowers = request.action === "getFollowersFull" ? Infinity : 100; // Mudança para 100 seguidores
        followers = new Set();
        verifiedFollowers = new Set(); // Reseta o conjunto de verificados
        verifiedFollowerCount = 0;  // Reseta contador
        scrollAndCollectFollowers((followers) => {
            let filename = request.action === "getFollowersFull" ? 'seguidores_verificados.csv' : 'seguidores_parciais.csv';
            downloadCSV(filename);
            sendResponse({status: "completed", followers: Array.from(verifiedFollowers)});
        });
    } else if (request.action === "unlockFullVersion") {
        console.log("Tentativa de desbloqueio com código:", request.code); // Log de depuração
        // Verifica o código de desbloqueio
        if (request.code === "MY_SECRET_CODE") {
            fullVersionUnlocked = true;
            chrome.storage.local.set({ fullVersionUnlocked: true }, () => {
                console.log("Versão completa desbloqueada e estado salvo."); // Log de depuração
                sendResponse({status: "full_version_unlocked"});
            });
        } else {
            console.log("Código inválido recebido."); // Log de depuração
            sendResponse({status: "invalid_code"}); // Resposta para código inválido
        }
    }
});

// Função para baixar CSV
function downloadCSV(filename = 'seguidores_verificados.csv') {
    const csvContent = "data:text/csv;charset=utf-8," + Array.from(verifiedFollowers).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Arquivo CSV baixado');
}
