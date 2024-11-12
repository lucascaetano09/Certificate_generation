CREATE DATABASE IF NOT EXISTS sistema_diplomas;
USE sistema_diplomas;

CREATE TABLE IF NOT EXISTS diplomas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_aluno VARCHAR(255),
    nacionalidade VARCHAR(255),
    estado VARCHAR(255),
    data_nascimento DATE,
    numero_cpf VARCHAR(20),
    data_conclusao DATE,
    nome_curso VARCHAR(255),
    data_emissao DATE,
    diploma_path TEXT
);

CREATE TABLE IF NOT EXISTS assinaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diploma_id INT,
    cargo VARCHAR(255),
    nome VARCHAR(255),
    FOREIGN KEY (diploma_id) REFERENCES diplomas(id)
);