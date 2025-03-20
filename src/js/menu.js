const { ipcRenderer } = require('electron');

// Seleciona o botão para cadastro de cestas
const cadastroCestasBtn = document.getElementById('cadastroCestasBtn');
const cadastroBeneficiarioBtn = document.getElementById('cadastroBeneficiarioBtn');
const gerarPlanilhasBtn = document.getElementById('gerarPlanilhasBtn');
const darBaixaBtn = document.getElementById('configuracaoBtn');


// Envia uma mensagem IPC para abrir a janela de cadastro de cestas
cadastroCestasBtn.addEventListener('click', () => {
  ipcRenderer.send('abrir-cadastro-cestas');
});


cadastroBeneficiarioBtn.addEventListener('click', () => {
  ipcRenderer.send('abrir-cadastro-beneficiario');
});

gerarPlanilhasBtn.addEventListener('click', () => {
  ipcRenderer.send('abrir-gerer-relatorio');
});

darBaixaBtn.addEventListener('click', () => {
  ipcRenderer.send('abrir-configuracao');
});


// Carregar o nome da ONG quando a página for carregada
document.addEventListener('DOMContentLoaded', carregarNomeOng);