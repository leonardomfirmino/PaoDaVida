const { app, BrowserWindow, Notification } = require('electron');
const { ipcMain } = require('electron'); 
const { getConnection } = require("./database");
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
let mainWindow;

// Função para criar janelas
const createWindow = (filePath, width = 800, height = 600) => {
  const window = new BrowserWindow({
    width,
    height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  window.loadFile(path.join(__dirname, filePath));
  window.setMenuBarVisibility(false);
  return window;
};

// Inicialização da aplicação
app.on('ready', () => {
  mainWindow = createWindow('src/html/menu.html');
});

// Abre a tela de cadastro de cestas
ipcMain.on('abrir-cadastro-cestas', () => {
  createWindow('src/html/cestas.html');
});

// Abre a tela de cadastro de beneficiários
ipcMain.on('abrir-cadastro-beneficiario', () => {
  createWindow('src/html/beneficiario.html', 900, 700);
});

// Abre a tela de geração de relatório
ipcMain.on('abrir-gerer-relatorio', () => {
  createWindow('src/html/relatorio.html', 900, 700);
});

ipcMain.handle('buscar-beneficiarios', async () => {
  try {
    const conn = await getConnection();
    const beneficiarios = await conn.query("SELECT * FROM beneficiario ORDER BY id DESC");

    for (const beneficiario of beneficiarios) {
      const beneficiarioId = beneficiario.id;

      const dependentes  = await conn.query("SELECT * FROM dependente WHERE beneficiarioId = ?", [beneficiarioId]);
      beneficiario.dependentes = dependentes;

      const autorizado = await conn.query("SELECT * FROM autorizado WHERE beneficiarioId = ?", [beneficiarioId]);
      beneficiario.autorizado = autorizado[0] || { nome: "", cpf: "" };  // Definir valores padrão se não houver autorizado
    }

    console.log(beneficiarios);  // Log para verificar os dados retornados
    return beneficiarios;

  } catch (error) {
    console.error('Erro ao buscar beneficiários:', error);
    throw error;
  }
});

ipcMain.handle('buscar-beneficiarios-por-cesta', async (event, cestaId) => {
  try {
    const conn = await getConnection();
    
    // Obtém a quantidade de cestas pela cestaId
    const [cesta] = await conn.query("SELECT qtd FROM cesta WHERE id = ?", [cestaId]);
    const quantidade = cesta.qtd;

    // Obtém beneficiários limitados pela quantidade da cesta
    const beneficiarios = await conn.query("SELECT * FROM beneficiario ORDER BY id DESC LIMIT ?", [quantidade]);
    
    for (const beneficiario of beneficiarios) {
      const beneficiarioId = beneficiario.id;
      const dependentes = await conn.query("SELECT * FROM dependente WHERE beneficiarioId = ?", [beneficiarioId]);
      beneficiario.dependentes = dependentes;
      
      const autorizado = await conn.query("SELECT * FROM autorizado WHERE beneficiarioId = ?", [beneficiarioId]);
      beneficiario.autorizado = autorizado[0] || { nome: "", cpf: "" };
    }

    return beneficiarios;

  } catch (error) {
    console.error('Erro ao buscar beneficiários por cesta:', error);
    throw error;
  }
});


// Funções de banco de dados para beneficiários
ipcMain.handle('inserir-beneficiario', async (event, beneficiario) => {
  try {
    const conn = await getConnection();
    const { nomeBeneficiario, tipoBeneficiario, nomeAluno, cpfBeneficiario, rendaFamiliar, nomeAutorizado, cpfAutorizado, dependentes } = beneficiario;

    // Converte rendaFamiliar para float e garante que não seja string vazia
    const rendaFamiliarDecimal = parseFloat(rendaFamiliar) || 0.00;

    // Insere o beneficiário
    const result = await conn.query(
      "INSERT INTO beneficiario (nome, tipo, cpf, rendaFamiliar, nomeAluno) VALUES (?, ?, ?, ?, ?)", 
      [nomeBeneficiario, tipoBeneficiario, cpfBeneficiario, rendaFamiliarDecimal, nomeAluno]
    );

    const beneficiarioId = result.insertId;

    // Insere autorizado
    await conn.query(
      "INSERT INTO autorizado (nome, cpf, beneficiarioId) VALUES (?, ?, ?)",
      [nomeAutorizado, cpfAutorizado, beneficiarioId]
    );

    // Insere dependentes
    for (const dependente of dependentes) {
      await conn.query(
        "INSERT INTO dependente (nome, beneficiarioId) VALUES (?, ?)",
        [dependente.nome, beneficiarioId]
      );
    }

    new Notification({
      title: "Cadastro de Beneficiário",
      body: "Beneficiário cadastrado com sucesso!",
    }).show();

    return { success: true };
  } catch (error) {
    console.error('Erro ao inserir beneficiário:', error);
    throw error;
  }
});

// Função para editar beneficiário
ipcMain.handle('editar-beneficiario', async (event, beneficiario, id) => {
  try {
    const conn = await getConnection();

    // Atualizar dados do beneficiário
    await conn.query(
      "UPDATE beneficiario SET nome = ?, tipo = ?, cpf = ?, rendaFamiliar = ?, nomeAluno = ? WHERE id = ?",
      [beneficiario.nomeBeneficiario, beneficiario.tipoBeneficiario, beneficiario.cpfBeneficiario, beneficiario.rendaFamiliar, beneficiario.nomeAluno, id]
    );

    // Atualizar dados do autorizado
    await conn.query(
      "UPDATE autorizado SET nome = ?, cpf = ? WHERE beneficiarioId = ?",
      [beneficiario.nomeAutorizado, beneficiario.cpfAutorizado, id]
    );

    // Remover dependentes antigos e inserir os novos
    await conn.query("DELETE FROM dependente WHERE beneficiarioId = ?", [id]);
    for (const dependente of beneficiario.dependentes) {
      await conn.query(
        "INSERT INTO dependente (nome, beneficiarioId) VALUES (?, ?)",
        [dependente.nome, id]
      );
    }

    return { message: "Beneficiário atualizado com sucesso!" };
  } catch (error) {
    console.error('Erro ao editar beneficiário:', error);
    throw error;
  }
});

// Função para deletar beneficiário
ipcMain.handle('deletar-beneficiario', async (event, id) => {
  try {
    const conn = await getConnection();

    // Remover dependentes e autorizado relacionados ao beneficiário
    await conn.query("DELETE FROM dependente WHERE beneficiarioId = ?", [id]);
    await conn.query("DELETE FROM autorizado WHERE beneficiarioId = ?", [id]);

    // Remover beneficiário
    const result = await conn.query("DELETE FROM beneficiario WHERE id = ?", [id]);

    return result;
  } catch (error) {
    console.error('Erro ao deletar beneficiário:', error);
    throw error;
  }
});

// Funções de banco de dados para cestas (já implementadas)
ipcMain.handle('criar-cesta', async (event, cesta) => {
  try {
    const conn = await getConnection();
    const result = await conn.query("INSERT INTO cesta SET ?", cesta);
    cesta.id = result.insertId;

    new Notification({
      title: "Cadastro de Cestas",
      body: "Nova cesta cadastrada com sucesso!",
    }).show();

    return cesta;
  } catch (error) {
    console.log(error);
  }
});

ipcMain.handle('get-cestas', async () => {
  const conn = await getConnection();
  const results = await conn.query("SELECT * FROM cesta ORDER BY id DESC");
  return results;
});

ipcMain.handle('delete-cesta', async (event, id) => {
  const conn = await getConnection();
  const result = await conn.query("DELETE FROM cesta WHERE id = ?", id);
  return result;
});

ipcMain.handle('get-cesta-by-id', async (event, id) => {
  const conn = await getConnection();
  const result = await conn.query("SELECT * FROM cesta WHERE id = ?", id);
  return result[0];
});

ipcMain.handle('update-cestas', async (event, id, cesta) => {
  const conn = await getConnection();
  const result = await conn.query("UPDATE cesta SET ? WHERE id = ?", [cesta, id]);
  return result;
});

// Modificação para dar-baixa 
ipcMain.handle('dar-baixa', async (event, { certinhos, cestaId }) => {
  console.log("CPFs recebidos no backend para dar baixa:", certinhos);
  console.log("CestaId recebido:", cestaId);
  
  try {
    const conn = await getConnection();
    const date = new Date().toISOString().slice(0, 10);

    // Atualizar CestaR e subtrair 1 da quantidade na tabela cesta
    const promises = certinhos.map(cpf => {
      return conn.query('UPDATE beneficiario SET CestaR = ? WHERE cpf = ?', [date, cpf]);
    });
    await Promise.all(promises);
    await conn.query('UPDATE cesta SET qtd = qtd - ? WHERE id = ? AND qtd > 0', [certinhos.length, cestaId]);

    console.log("Baixa realizada e quantidade atualizada no banco de dados");
    return 'Baixa realizada com sucesso';
  } catch (err) {
    console.error('Erro ao dar baixa:', err);
    return 'Erro ao dar baixa: ' + err.message;
  }
});s
s

ipcMain.handle('registrar-retirada', async (event, { beneficiarioId, cestaId, dataRetirada }) => { 
  let connection;

  try {
      connection = await getConnection();

      // Query para registrar a retirada da cesta
      const insertQuery = `
          INSERT INTO retirada (beneficiarioId, cestaId, dataRetirada)
          VALUES (?, ?, ?)
      `;

      // Executa a query de inserção na tabela retirada
      await connection.query(insertQuery, [beneficiarioId, cestaId, dataRetirada]);

      // Query para subtrair uma unidade da quantidade de cestas na tabela `cesta`
      const updateQuery = `
          UPDATE cesta
          SET qtd = qtd - 1
          WHERE id = ? AND qtd > 0
      `;

      // Executa a query para atualizar a quantidade de cestas
      await connection.query(updateQuery, [cestaId]);

      // Query para atualizar a data na coluna cestaR da tabela `beneficiario`
      const updateBeneficiarioQuery = `
          UPDATE beneficiario
          SET cestaR = ?
          WHERE id = ?
      `;

      // Executa a query para atualizar a data de retirada na tabela beneficiario
      await connection.query(updateBeneficiarioQuery, [dataRetirada, beneficiarioId]);

      console.log(`Retirada registrada com sucesso para o beneficiário ${beneficiarioId} e cesta ${cestaId}. Quantidade de cestas atualizada e data registrada.`);
      return { sucesso: true };

  } catch (error) {
      console.error('Erro ao registrar a retirada no banco de dados:', error);
      return { sucesso: false, erro: error.message };
  
  } 
});




ipcMain.on('exportar-excel', (event, beneficiarios) => {
  try {
    const workbook = xlsx.utils.book_new();

    const dados = beneficiarios.map(beneficiario => ({
      Nome: beneficiario.Nome,
      CPF: beneficiario.CPF,
      Dependentes: beneficiario.Dependentes || 0,
      Assinatura: beneficiario.Assinatura || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(dados);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Beneficiários');

    // Diretório de downloads
    const downloadDir = app.getPath('downloads');

    // Verifica o maior número de arquivo existente
    let numero = 1;
    let nomeArquivo;
    do {
      nomeArquivo = `Relatorio_Beneficiarios_${numero}.xlsx`;
      const filePath = path.join(downloadDir, nomeArquivo);
      if (!fs.existsSync(filePath)) {
        break;
      }
      numero++;
    } while (true);

    const filePath = path.join(downloadDir, nomeArquivo);

    // Escrever o arquivo Excel no caminho especificado
    xlsx.writeFile(workbook, filePath);

    console.log(`Arquivo salvo em: ${filePath}`);

    // Enviar confirmação para o front-end com o caminho do arquivo
    event.sender.send('exportacao-completa', filePath);
  } catch (error) {
    console.error('Erro ao exportar arquivo:', error);
    // Enviar mensagem de erro para o front-end
    event.sender.send('erro-exportacao', 'Erro ao exportar arquivo para Excel.');
  }
});

