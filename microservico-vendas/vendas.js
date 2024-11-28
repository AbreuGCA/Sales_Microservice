const express = require('express');
const mysql = require('mysql2'); // Mudando para mysql2
const app = express();
const port = 3000;

app.use(express.json()); // Para tratar requisições com corpo em JSON

// Conexão com o banco de dados MySQL (usando variável de ambiente no Railway ou um banco local)
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost', // URL do host do banco
  user: process.env.MYSQLUSER || 'root', // Nome de usuário do banco
  password: process.env.MYSQLPASSWORD || '12345678', // Senha do banco
  database: process.env.DB_NAME || 'vendas', // Nome do banco de dados
});

// Função para criar a tabela de vendas (caso não exista)
async function createTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS vendas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        produtos TEXT NOT NULL,
        data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valor_total DECIMAL(10, 2) NOT NULL
      );
    `;
    pool.query(query, (err, results) => {
      if (err) throw err;
      console.log('Tabela de vendas criada com sucesso.');
    });
  } catch (err) {
    console.error('Erro ao criar tabela:', err);
  }
}

// Chama a função para criar a tabela ao iniciar o servidor
createTable();

// Rota POST para registrar uma venda
app.post('/venda', (req, res) => {
  const { produtos, valor_total } = req.body;

  if (!produtos || !valor_total) {
    return res.status(400).json({ error: 'Produtos e valor total são obrigatórios.' });
  }

  const query = 'INSERT INTO vendas (produtos, valor_total) VALUES (?, ?)';
  pool.query(query, [produtos, valor_total], (err, results) => {
    if (err) {
      console.error('Erro ao registrar venda:', err);
      return res.status(500).json({ error: 'Erro ao registrar venda' });
    }
    res.status(201).json({
      id: results.insertId,
      produtos,
      valor_total,
      data_venda: new Date(),
    });
  });
});

// Rota GET para listar todas as vendas registradas
app.get('/vendas', (req, res) => {
  const query = 'SELECT * FROM vendas';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao listar vendas:', err);
      return res.status(500).json({ error: 'Erro ao listar vendas' });
    }
    res.status(200).json(results);
  });
});

// Rota DELETE para remover uma venda
app.delete('/venda/:id', (req, res) => {
  const vendaId = parseInt(req.params.id);

  if (isNaN(vendaId)) {
    return res.status(400).json({ error: 'ID da venda inválido' });
  }

  const query = 'DELETE FROM vendas WHERE id = ?';
  pool.query(query, [vendaId], (err, results) => {
    if (err) {
      console.error('Erro ao deletar venda:', err);
      return res.status(500).json({ error: 'Erro ao deletar venda' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.status(200).json({ message: 'Venda deletada com sucesso' });
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
