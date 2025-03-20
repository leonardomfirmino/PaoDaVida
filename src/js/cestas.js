const { ipcRenderer } = require('electron');

const cestasForm = document.querySelector("#cestasForm");
const cestaTipo = document.querySelector("#tipo");
const cestaQtd = document.querySelector("#qtd");
const cestaEntrega = document.querySelector("#entrega");
const cestaRecebimento = document.querySelector("#recebimento");
const cestaDescricao = document.querySelector("#descricao");
const cestaList = document.querySelector("#cestas");

let cestas = [];
let editingStatus = false;
let editCestatId;
// Função de pesquisa de cestas
pesquisaCestas.addEventListener("input", () => {
  const termoPesquisa = pesquisaCestas.value.toLowerCase();
  const cestasFiltradas = cestas.filter(cesta =>
    cesta.tipo.toLowerCase().includes(termoPesquisa)
  );
  renderCestas(cestasFiltradas);
});
// Funções de manipulação de DOM e envio de mensagens via IPC
const deleteCesta = async (id) => {
  const response = confirm("Tem certeza que deseja deletar essa doação?");
  if (response) {
    await ipcRenderer.invoke('delete-cesta', id);
    await getCestas();
  }
  return;
};

const editCesta = async (id) => { 
  const cesta = await ipcRenderer.invoke('get-cesta-by-id', id);
  cestaTipo.value = cesta.tipo;
  cestaQtd.value = cesta.qtd;
  cestaDescricao.value = cesta.observacao;
  cestaEntrega.value = cesta.entrega;
  cestaRecebimento.value = cesta.recebimento;

  editingStatus = true;
  editCestatId = id;
};

cestasForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cesta = {
    tipo: cestaTipo.value,
    qtd: parseInt(cestaQtd.value, 10),
    observacao: cestaDescricao.value,
    entrega: cestaEntrega.value,
    recebimento: cestaRecebimento.value,
  };

  if (!editingStatus) {
    await ipcRenderer.invoke('criar-cesta', cesta);
  } else {
    await ipcRenderer.invoke('update-cestas', editCestatId, cesta);
    editingStatus = false;
    editCestatId = "";
  }

  cestasForm.reset();
  getCestas();
});

function renderCestas(cestas) {
  cestaList.innerHTML = "";
  cestas.forEach((t) => {
    const recebimentoDate = new Date(t.recebimento).toLocaleDateString("pt-BR");
    const entregaDate = new Date(t.entrega).toLocaleDateString("pt-BR");

    cestaList.innerHTML += `
      <div class="card card-body my-2 animated fadeInLeft">
        <h4>${t.tipo}</h4>
        <p>${t.observacao}</p>
        <h3>Quantidade: ${t.qtd}</h3>
        <h5>Recebimento: ${recebimentoDate}</h5>
        <h5>Entrega: ${entregaDate}</h5>
        <p>
        <button class="btn btn-danger btn-sm" onclick="deleteCesta('${t.id}')">DELETAR</button>
        <button class="btn btn-secondary btn-sm" onclick="editCesta('${t.id}')">EDITAR</button>
        </p>
      </div>
    `;
  });
}

const getCestas = async () => {
  cestas = await ipcRenderer.invoke('get-cestas');
  renderCestas(cestas);
};

async function init() {
  getCestas();
}

init();

// Função para voltar (fechar a página)
document.getElementById('voltarBtn').addEventListener('click', () => {
  window.close();
});
