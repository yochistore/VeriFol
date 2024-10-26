let fullVersionUnlocked = false;

// Carregar o estado de desbloqueio ao iniciar o popup
chrome.storage.local.get(['fullVersionUnlocked'], (result) => {
    fullVersionUnlocked = result.fullVersionUnlocked || false;
    console.log("Estado de desbloqueio carregado no popup:", fullVersionUnlocked);
    if (fullVersionUnlocked) {
        document.getElementById('unlock').style.display = 'none'; // Esconder botão se já estiver desbloqueado
    }
});

document.getElementById('start').addEventListener('click', () => {
    console.log("Botão de iniciar clicado");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("Tabs query:", tabs);
        const action = fullVersionUnlocked ? "getFollowersFull" : "getFollowers";
        chrome.tabs.sendMessage(tabs[0].id, { action: action }, (response) => {
            console.log("Resposta do script de conteúdo:", response);
            if (response && response.status === "completed") {
                console.log("Coleta de seguidores concluída");
            }
        });
    });
});

document.getElementById('unlock').addEventListener('click', () => {
    const code = prompt("Digite seu código de desbloqueio:");
    // Verifica o código no Supabase
    fetch('https://wkbjyymnbywokogucqkw.supabase.co/rest/v1/codes?code=eq.' + code, {
        method: 'GET',
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmp5eW1uYnl3b2tvZ3VjcWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3OTkwNTMsImV4cCI6MjA0NTM3NTA1M30.uSU3Aqr-1qEGvfumsniH9esVZyx8o_L4Rw_y2fj15is',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmp5eW1uYnl3b2tvZ3VjcWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3OTkwNTMsImV4cCI6MjA0NTM3NTA1M30.uSU3Aqr-1qEGvfumsniH9esVZyx8o_L4Rw_y2fj15is',
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(async data => {
        if (data.length > 0 && !data[0].is_used) {
            // O código é válido e não foi utilizado
            alert("Versão completa desbloqueada! Não esqueça de apertar F5 para recomeçar a contar");
            chrome.storage.local.set({ fullVersionUnlocked: true }); // Salvar estado de desbloqueio
            document.getElementById('unlock').style.display = 'none'; // Esconde o botão após desbloqueio

            // Marca o código como utilizado no Supabase
            await fetch('https://wkbjyymnbywokogucqkw.supabase.co/rest/v1/codes?code=eq.' + code, {
                method: 'PATCH',
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmp5eW1uYnl3b2tvZ3VjcWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3OTkwNTMsImV4cCI6MjA0NTM3NTA1M30.uSU3Aqr-1qEGvfumsniH9esVZyx8o_L4Rw_y2fj15is',
                    'Authorization': 'Bearer your_api_key',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_used: true })
            });
        } else if (data.length > 0 && data[0].is_used) {
            // O código já foi utilizado
            alert("Este código já foi utilizado.");
        } else {
            // O código é inválido
            alert("Código inválido. Tente novamente.");
        }
    })
    .catch(error => {
        console.error('Erro ao verificar código:', error);
        alert("Ocorreu um erro. Tente novamente mais tarde.");
    });
});

let verifiedFollowerCount = 0;

function updateVerifiedFollowerCount() {
    document.getElementById('verifiedCount').innerText = `Seguidores verificados: ${verifiedFollowerCount}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Mensagem recebida no popup:", request.action);
    if (request.action === "incrementVerifiedCount") {
        verifiedFollowerCount++;
        updateVerifiedFollowerCount();
        console.log(`Contagem de seguidores verificados incrementada: ${verifiedFollowerCount}`);
        sendResponse({ status: "count_updated" });
    }
});
