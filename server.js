const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;

// Configuração do banco
const dbConfig = {
  host: '%',
  user: 'root',
  password: '0702', // sua senha
  database: 'requisicoes_db'
};

let pool;

// Inicialização do banco e criação de tabelas
async function initDB() {
  try {
    // Cria banco se não existir
    const conn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await conn.end();

    // Cria pool para o banco
    pool = await mysql.createPool(dbConfig);

    // Tabelas
    await pool.query(`CREATE TABLE IF NOT EXISTS requisicoes_demo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero VARCHAR(100) NOT NULL,
      peca VARCHAR(255) NOT NULL,
      solicitante VARCHAR(100) NOT NULL,
      descricao TEXT,
      conclusao DATE NOT NULL,
      criado_em VARCHAR(50) NOT NULL
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS requisicoes_concluidas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero VARCHAR(100) NOT NULL,
      peca VARCHAR(255) NOT NULL,
      solicitante VARCHAR(100) NOT NULL,
      descricao TEXT,
      conclusao DATE NOT NULL,
      criado_em VARCHAR(50) NOT NULL
    )`);

    console.log("Banco e tabelas prontos!");
  } catch (err) {
    console.error("Erro ao inicializar banco:", err);
    process.exit(1);
  }
}

// Rotas

// Salvar nova requisição
app.post('/requisicoes', async (req, res) => {
  try {
    const { numero, peca, solicitante, descricao, conclusao, criado_em } = req.body;
    await pool.query(
      `INSERT INTO requisicoes_demo (numero, peca, solicitante, descricao, conclusao, criado_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [numero, peca, solicitante, descricao, conclusao, criado_em]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Buscar pendentes
app.get('/pendentes', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM requisicoes_demo ORDER BY id DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Buscar concluídas
app.get('/concluidas', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM requisicoes_concluidas ORDER BY id DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Concluir requisição
app.post('/concluir/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query(`SELECT * FROM requisicoes_demo WHERE id = ?`, [id]);
    if(rows.length === 0) return res.sendStatus(404);
    const r = rows[0];
    await pool.query(
      `INSERT INTO requisicoes_concluidas (numero, peca, solicitante, descricao, conclusao, criado_em)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [r.numero, r.peca, r.solicitante, r.descricao, r.conclusao, r.criado_em]
    );
    await pool.query(`DELETE FROM requisicoes_demo WHERE id = ?`, [id]);
    res.sendStatus(200);
  } catch(err){
    console.error(err);
    res.sendStatus(500);
  }
});

// Excluir pendente
app.delete('/requisicoes/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query(`DELETE FROM requisicoes_demo WHERE id = ?`, [id]);
    res.sendStatus(200);
  } catch(err){
    console.error(err);
    res.sendStatus(500);
  }
});

// Excluir concluída
app.delete('/concluidas/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query(`DELETE FROM requisicoes_concluidas WHERE id = ?`, [id]);
    res.sendStatus(200);
  } catch(err){
    console.error(err);
    res.sendStatus(500);
  }
});

// Inicializa DB e inicia servidor
initDB().then(()=>{
  app.listen(PORT, ()=>console.log(`Servidor rodando em http://localhost:${PORT}`));
});

