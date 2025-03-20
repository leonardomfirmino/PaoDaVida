const { ipcRenderer } = require('electron');

const beneficiarioForm = document.querySelector("#beneficiarioForm");
const beneficiarioNome = document.querySelector("#nomeBeneficiario");
const beneficiarioTipo = document.querySelector("#tipoBeneficiario");
const beneficiarioAluno = document.querySelector("#nomeAluno");
const beneficiarioCPF = document.querySelector("#cpfBeneficiario");
const beneficiarioRenda = document.querySelector("#rendaFamiliar");
const autorizadoNome = document.querySelector("#nomeAutorizado");
const autorizadoCPF = document.querySelector("#cpfAutorizado");
const beneficiarioContainer = document.querySelector("#beneficiariosContainer");
const dependentesContainer = document.querySelector("#dependentesContainer");
const addDependenteBtn = document.querySelector("#addDependenteBtn");

let beneficiarios = [];
let editingStatus = false;
let editBeneficiarioId;

// Dependentes dinâmicos
addDependenteBtn.addEventListener("click", () => {
  const dependenteGroup = document.createElement("div");
  dependenteGroup.classList.add("dependente-group", "mb-3");
  dependenteGroup.innerHTML = `
    <input type="text" class="form-control nomeDependente mb-2" placeholder="Nome do Dependente" required>
    <input type="text" class="form-control cpfDependente mb-2" placeholder="CPF do Dependente" required>
    <button type="button" class="btn btn-danger btn-sm removeDependenteBtn">Remover Dependente</button>
  `;
  dependentesContainer.appendChild(dependenteGroup);

  // Remover dependente
  dependenteGroup.querySelector(".removeDependenteBtn").addEventListener("click", () => {
    dependentesContainer.removeChild(dependenteGroup);
  });
});

beneficiarioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dependentesData = Array.from(document.querySelectorAll(".dependente-group")).map(group => ({
    nome: group.querySelector(".nomeDependente").value,
    cpf: group.querySelector(".cpfDependente").value,
  }));

  const beneficiario = {
    nomeBeneficiario: beneficiarioNome.value,
    tipoBeneficiario: beneficiarioTipo.value,
    nomeAluno: beneficiarioAluno.value || null,
    cpfBeneficiario: beneficiarioCPF.value,
    rendaFamiliar: parseFloat(beneficiarioRenda.value),
    nomeAutorizado: autorizadoNome.value,
    cpfAutorizado: autorizadoCPF.value,
    dependentes: dependentesData,
  };

  if (!editingStatus) {
    await ipcRenderer.invoke('inserir-beneficiario', beneficiario);
  } else {
    await ipcRenderer.invoke('editar-beneficiario', beneficiario, editBeneficiarioId);
    editingStatus = false;
    editBeneficiarioId = "";
  }

  beneficiarioForm.reset();
  dependentesContainer.innerHTML = "";  // Limpa os dependentes após o envio
  getBeneficiarios();
});

// Função para renderizar os beneficiários
function renderBeneficiarios(beneficiarios) {
  beneficiarioContainer.innerHTML = "";
  beneficiarios.forEach((b) => {
    beneficiarioContainer.innerHTML += `
      <div class="card card-body my-2 animated fadeInLeft">
        <h4>${b.nome || "Nome não disponível"} (${b.tipo || "Tipo não disponível"})</h4>
        <p><strong>CPF:</strong> ${b.cpf || "CPF não disponível"}</p>
        <p><strong>Renda Familiar:</strong> R$ ${b.rendaFamiliar || "Renda não disponível"}</p>
        ${b.nomeAluno ? `<p><strong>Nome do Aluno:</strong> ${b.nomeAluno}</p>` : ''}
        
        <h5>Dependentes:</h5>
        <ul>${(b.dependentes || []).map(dep => `<li>${dep.nome} - CPF: ${dep.cpf || "CPF não disponível"}</li>`).join('')}</ul>

        <h5>Autorizado:</h5>
        <p>${b.autorizado ? `${b.autorizado.nome} - CPF: ${b.autorizado.cpf || "CPF não disponível"}` : "Não autorizado"}</p>

        <button class="btn btn-danger btn-sm" onclick="deleteBeneficiario('${b.id}')">Excluir</button>
        <button class="btn btn-secondary btn-sm" onclick="editBeneficiario('${b.id}')">Editar</button>
      </div>
    `;
  });
}

// Função para obter os beneficiários
async function getBeneficiarios() {
  beneficiarios = await ipcRenderer.invoke('buscar-beneficiarios');
  renderBeneficiarios(beneficiarios);
}

// Função para deletar um beneficiário
async function deleteBeneficiario(id) {
  await ipcRenderer.invoke('deletar-beneficiario', id);
  getBeneficiarios();
}

// Função para editar um beneficiário
async function editBeneficiario(id) {
  const beneficiario = await ipcRenderer.invoke('buscar-beneficiarios', id);
  beneficiarioNome.value = beneficiario.nome;
  beneficiarioTipo.value = beneficiario.tipo;
  beneficiarioAluno.value = beneficiario.nomeAluno || '';
  beneficiarioCPF.value = beneficiario.cpf;
  beneficiarioRenda.value = beneficiario.rendaFamiliar;
  autorizadoNome.value = beneficiario.autorizado ? beneficiario.autorizado.nome : '';
  autorizadoCPF.value = beneficiario.autorizado ? beneficiario.autorizado.cpf : '';

  dependentesContainer.innerHTML = '';
  (beneficiario.dependentes || []).forEach(dep => {
    const dependenteGroup = document.createElement("div");
    dependenteGroup.classList.add("dependente-group", "mb-3");
    dependenteGroup.innerHTML = `
      <input type="text" class="form-control nomeDependente mb-2" value="${dep.nome}" placeholder="Nome do Dependente" required>
      <input type="text" class="form-control cpfDependente mb-2" value="${dep.cpf}" placeholder="CPF do Dependente" required>
      <button type="button" class="btn btn-danger btn-sm removeDependenteBtn">Remover Dependente</button>
    `;
    dependentesContainer.appendChild(dependenteGroup);

    dependenteGroup.querySelector(".removeDependenteBtn").addEventListener("click", () => {
      dependentesContainer.removeChild(dependenteGroup);
    });
  });

  editingStatus = true;
  editBeneficiarioId = id;
}

// Função para voltar (fechar a página)
function voltar() {
  window.close();
}

// Inicializa a obtenção de beneficiários e evento do botão "Voltar" ao carregar a página
async function init() {
  // Adiciona o evento ao botão "Voltar"
  const voltarBtn = document.getElementById('voltarBtn');
  if (voltarBtn) {
    voltarBtn.addEventListener('click', voltar);
  }

  await getBeneficiarios();
}

init();
