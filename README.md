# PaoDaVida


# **Pão da Vida - Sistema de Gestão de Cestas Básicas**  

## **Descrição do Projeto**  
O **Pão da Vida** é um sistema de gestão desenvolvido em **Electron e Node.js**, com um banco de dados **MySQL**, voltado para o controle de distribuição de cestas básicas em um projeto social. O sistema permite o cadastro de beneficiários, o gerenciamento de cestas arrecadadas e distribuídas, além da geração de relatórios detalhados para auxiliar na organização das doações.  

## **Funcionalidades**  
- **Cadastro de beneficiários** (alunos e não alunos)  
- **Gerenciamento de cestas básicas** (arrecadação e distribuição)  
- **Priorização automática** baseada em critérios como renda, número de dependentes e última retirada  
- **Importação de dados via Excel (.xlsx)**  
- **Geração de relatórios** sobre beneficiários e distribuição  
- **Interface desktop amigável** desenvolvida com Electron  

## **Requisitos para Rodar o Projeto**  

### **1. Instalar Dependências**  
Antes de rodar o projeto, certifique-se de que seu ambiente possui os seguintes requisitos instalados:  

- **Node.js** (Recomendado: versão LTS)  
- **MySQL Server** (Banco de dados para armazenar as informações)  
- **Electron** (Framework para aplicações desktop)  

### **2. Configurar o Banco de Dados**  
O MySQL deve estar rodando em um servidor local ou na rede. Certifique-se de configurar o banco de dados corretamente com os seguintes passos:  

1. Criar o banco de dados e as tabelas necessárias (script de criação incluído no projeto)  
2. Configurar a conexão no arquivo `database.js`, informando host, usuário, senha e nome do banco  

### **3. Rodar o Projeto**  

- Para iniciar o sistema sem abrir o terminal, use o arquivo `.bat` incluso no projeto.  
- Caso queira rodar manualmente, execute os seguintes comandos no terminal dentro da pasta do projeto:  

```sh
npm install  # Instala as dependências do projeto
npm start    # Inicia a aplicação Electron
```

## **Execução Automática**  
Para rodar o projeto com um clique, utilize o arquivo `IniciarPaoDaVida.bat`, que já está configurado para executar o sistema sem precisar abrir o terminal.  
