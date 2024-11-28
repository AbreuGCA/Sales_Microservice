const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para tratar JSON
app.use(express.json());

// Inicializar o banco de dados SQLite
let db;

(async () => {
  db = await open({
    filename: './vendas.db',
    driver: sqlite3.Database,
  });

  // Criar tabela de vendas caso não exista
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produtos TEXT NOT NULL,
      data TEXT NOT NULL,
      valor REAL NOT NULL
    )
  `);
})();

// POST - Criar uma venda
app.post('/vendas', async (req, res) => {
  try {
    const { produtos, data, valor } = req.body;

    // Exemplo de chamada futura ao microserviço de Estoque:
    // Verificar se os produtos estão disponíveis no estoque
    // const estoqueDisponivel = await verificarEstoque(produtos);
    // if (!estoqueDisponivel) {
    //   return res.status(400).json({ message: 'Estoque insuficiente para um ou mais produtos.' });
    // }

    // Inserir venda no banco
    const result = await db.run(
      'INSERT INTO vendas (produtos, data, valor) VALUES (?, ?, ?)',
      [JSON.stringify(produtos), data, valor]
    );

    res.status(201).json({ id: result.lastID, message: 'Venda registrada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar a venda.' });
  }
});

// GET - Listar todas as vendas
app.get('/vendas', async (req, res) => {
  try {
    const vendas = await db.all('SELECT * FROM vendas');
    res.status(200).json(vendas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar as vendas.' });
  }
});

// DELETE - Deletar uma venda pelo ID
app.delete('/vendas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.run('DELETE FROM vendas WHERE id = ?', id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Venda não encontrada.' });
    }

    res.status(200).json({ message: 'Venda deletada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao deletar a venda.' });
  }
});

// Subir o servidor
app.listen(PORT, () => {
  console.log(`Microserviço de Vendas rodando na porta ${PORT}`);
});
