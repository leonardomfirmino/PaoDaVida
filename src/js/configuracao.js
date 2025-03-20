// Importa o ipcRenderer para comunicação com o backend
const { ipcRenderer } = require('electron');

// Função para enviar dados ao backend
async function enviarDados(nome, imagemBase64,id=1) {
    try {
        const result = await ipcRenderer.invoke('atualizar-ong', { nome, imagemBase64,id});
        const statusEl = document.getElementById("status");
        if (result.sucesso) {
            statusEl.textContent = "Dados atualizados com sucesso!";
            statusEl.style.color = "green";
        } else {
            statusEl.textContent = `Erro ao atualizar dados: ${result.erro}`;
            statusEl.style.color = "red";
        }
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const atualizarBtn = document.getElementById('atualizarBtn');
    const nomeInput = document.getElementById('nomeInput');
    const fileInput = document.getElementById('fileInput');
    const statusEl = document.getElementById("status");

    atualizarBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        const nome = nomeInput.value.trim();

        if (!nome) {
            statusEl.textContent = "Por favor, insira o nome da ONG.";
            statusEl.style.color = "red";
            return;
        }

        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const imagemBase64 = reader.result.split(',')[1];

                if (!imagemBase64) {
                    console.error('imagemBase64 está indefinido.');
                    return;
                }

                await enviarDados(nome, imagemBase64);
            };
            reader.readAsDataURL(file);
        } else {
            statusEl.textContent = "Por favor, selecione uma imagem.";
            statusEl.style.color = "red";
        }
    });
});
