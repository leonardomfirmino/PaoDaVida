CREATE DATABASE IF NOT EXISTS ongdb;
USE ongdb;

-- Tabela de Beneficiários
CREATE TABLE IF NOT EXISTS beneficiario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo ENUM('Aluno', 'Nao Aluno') NOT NULL,
    nome_aluno VARCHAR(255) DEFAULT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    renda_familiar DECIMAL(10,2) NOT NULL,
    cestaR DATE DEFAULT NULL
);

-- Tabela de Dependentes
CREATE TABLE IF NOT EXISTS dependente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiario_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id) ON DELETE CASCADE
);

-- Tabela de Autorizados
CREATE TABLE IF NOT EXISTS autorizado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiario_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id) ON DELETE CASCADE
);

-- Tabela de Cestas Básicas
CREATE TABLE IF NOT EXISTS cesta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL
);

-- Tabela de Retiradas de Cestas
CREATE TABLE IF NOT EXISTS retirada (
    id INT AUTO_INCREMENT PRIMARY KEY,
    beneficiario_id INT NOT NULL,
    cesta_id INT NOT NULL,
    data_retirada DATE NOT NULL,
    FOREIGN KEY (beneficiario_id) REFERENCES beneficiario(id) ON DELETE CASCADE,
    FOREIGN KEY (cesta_id) REFERENCES cesta(id) ON DELETE CASCADE
);
