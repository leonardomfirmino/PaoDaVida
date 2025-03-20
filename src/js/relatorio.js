const { ipcRenderer } = require('electron');
const XLSX = require('xlsx');

let exportCount = 1;  // Variável para contar as exportações


document.getElementById("baixaBtn").addEventListener("click", async () => {
  const cestaId = document.getElementById('cestaSelect').value;
  if (!cestaId) return alert("Selecione uma cesta!");

  const checkboxes = document.querySelectorAll('.recebeu-checkbox');
  const beneficiarios = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.closest('tr').querySelector('td[data-id]').dataset.id);

  const dataRetirada = new Date().toISOString().split('T')[0];

  for (const id of beneficiarios) {
    try {
      const result = await ipcRenderer.invoke('registrar-retirada', { beneficiarioId: id, cestaId, dataRetirada });
      if (result.sucesso) {
        console.log(`Retirada registrada com sucesso para o ID ${id}`);
      } else {
        console.error(`Erro ao registrar a retirada para o ID ${id}: ${result.erro}`);
      }
    } catch (error) {
      console.error('Erro ao registrar a retirada:', error);
    }
  }

  alert('Baixa realizada com sucesso para os beneficiários selecionados.');
});


// Função para exportar para Excel com número incremental
document.getElementById('exportarExcel').addEventListener('click', async () => {
  const tabela = document.querySelector('#tabela-beneficiarios tbody');
  const linhas = tabela.querySelectorAll('tr');

  const beneficiarios = Array.from(linhas).map(linha => {
    const colunas = linha.querySelectorAll('td');
    return {
      Nome: colunas[1].textContent,
      CPF: colunas[2].textContent,
      Dependentes: parseInt(colunas[5].textContent),
      Assinatura: ""
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(beneficiarios);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiarios");

  // Gerando o nome do arquivo com número incremental e data
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];  // Formata a data como YYYY-MM-DD
  const fileName = `Relatorio_Beneficiarios_${exportCount}_${dateString}.xlsx`;
  exportCount++;  // Incrementa o número para a próxima exportação

  // Exporta o arquivo
  XLSX.writeFile(workbook, fileName);

  // Exibe o alerta de sucesso
  alert(`Exportação concluída com sucesso!\nO arquivo gerado é: ${fileName}`);
});

// Função para calcular a prioridade com novos critérios
function calcularPrioridade(beneficiario) {
  const hoje = new Date();
  const ultimaRetirada = beneficiario.cestaR ? new Date(beneficiario.cestaR) : null;
  const diasDesdeUltimaRetirada = ultimaRetirada ? Math.floor((hoje - ultimaRetirada) / (1000 * 60 * 60 * 24)) : Infinity;

  let nivel;
  if (beneficiario.tipo === 'Aluno') {
    nivel = "Alta";
  } else if (beneficiario.dependentes.length > 1) {
    nivel = "Média";
  } else {
    nivel = "Baixa";
  }

  return { nivel, diasDesdeUltimaRetirada };
}

// Função para carregar a lista de cestas
async function carregarCestas() {
  try {
    const cestas = await ipcRenderer.invoke('get-cestas');
    const cestaSelect = document.getElementById('cestaSelect');

    cestaSelect.innerHTML = '<option value="" disabled selected>Selecionar...</option>';

    cestas.forEach(cesta => {
      const option = document.createElement('option');
      option.value = cesta.id;
      option.textContent = `${cesta.tipo} (Quantidade: ${cesta.qtd})`;
      cestaSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar cestas:', error);
  }
}

// Função para carregar os beneficiários na tabela
async function carregarBeneficiarios(cestaId) {
  if (!cestaId) return;

  try {
    let beneficiarios = await ipcRenderer.invoke('buscar-beneficiarios-por-cesta', cestaId);

    beneficiarios = beneficiarios.sort((a, b) => {
      const diasA = calcularPrioridade(a).diasDesdeUltimaRetirada;
      const diasB = calcularPrioridade(b).diasDesdeUltimaRetirada;
      return diasB - diasA;  // Ordena em ordem decrescente de dias
    });

    // Limpa a tabela antes de preencher com novos dados
    const tabela = document.querySelector('#tabela-beneficiarios tbody');
    tabela.innerHTML = '';

    beneficiarios.forEach(beneficiario => {
      const linha = document.createElement('tr');
      const prioridade = calcularPrioridade(beneficiario);

      linha.innerHTML = `
        <td data-id="${beneficiario.id}">${beneficiario.id}</td>
        <td>${beneficiario.nome}</td>
        <td>${beneficiario.cpf}</td>
        <td>${prioridade.nivel} (${prioridade.diasDesdeUltimaRetirada} dias)</td>
        <td>${beneficiario.tipo}</td>
        <td>${beneficiario.dependentes.length}</td>
        <td>${beneficiario.rendaFamiliar.toFixed(2)}</td>
        <td><input type="checkbox" class="recebeu-checkbox"></td>
      `;
      tabela.appendChild(linha);
    });
  } catch (error) {
    console.error('Erro ao buscar beneficiários para a cesta selecionada:', error);
  }
}

carregarCestas();
