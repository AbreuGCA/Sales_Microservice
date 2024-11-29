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

// Função para calcular o valor total da venda
async function calcularValorTotal(idProdutos, quantidades) {
    try {
      const query = 'SELECT preco FROM estoque WHERE id IN (?)';
      const [produtos] = await pool.promise().query(query, [idProdutos]);
  
      let valorTotal = 0;
  
      // Calcular o valor total
      for (let i = 0; i < produtos.length; i++) {
        const preco = produtos[i].preco;
        const quantidade = quantidades[i];
        valorTotal += preco * quantidade;
      }
  
      return valorTotal;
    } catch (err) {
      console.error('Erro ao calcular o valor total:', err);
      throw new Error('Erro ao calcular o valor total');
    }
  }
  
  // Função para atualizar o estoque após uma venda
  async function atualizarEstoque(idProdutos, quantidades) {
    try {
      for (let i = 0; i < idProdutos.length; i++) {
        const query = 'UPDATE estoque SET quantidade = quantidade - ? WHERE id = ?';
        await pool.promise().query(query, [quantidades[i], idProdutos[i]]);
      }
    } catch (err) {
      console.error('Erro ao atualizar o estoque:', err);
      throw new Error('Erro ao atualizar o estoque');
    }
  }
  
  // Rota POST para registrar uma venda
  app.post('/venda', async (req, res) => {
    const { id_produtos, quantidade, data_venda } = req.body;
  
    // Verificar se todos os dados necessários estão presentes
    if (!id_produtos || !quantidade || !data_venda) {
      return res.status(400).json({ error: 'ID dos produtos, quantidade e data da venda são obrigatórios.' });
    }
  
    try {
      // Calcular o valor total da venda
      const valorTotal = await calcularValorTotal(id_produtos, quantidade);
  
      // Registrar a venda na tabela vendas
      const query = 'INSERT INTO vendas (id_produtos, quantidade, valor_total, data_venda) VALUES (?, ?, ?, ?)';
      const [result] = await pool.promise().query(query, [
        id_produtos.join(','), // Junta os IDs dos produtos em uma string separada por vírgula
        quantidade.join(','),   // Junta as quantidades dos produtos em uma string separada por vírgula
        valorTotal,
        data_venda,
      ]);
  
      // Atualizar o estoque
      await atualizarEstoque(id_produtos, quantidade);
  
      // Retornar os dados da venda registrada
      res.status(201).json({
        id: result.insertId,
        id_produtos,
        quantidade,
        valor_total: valorTotal,
        data_venda,
      });
    } catch (err) {
      console.error('Erro ao registrar venda:', err);
      res.status(500).json({ error: 'Erro ao registrar venda' });
    }
  });
  
  // Rota GET para buscar todas as vendas
app.get('/vendas', async (req, res) => {
    try {
      const query = 'SELECT * FROM vendas';
      const [result] = await pool.promise().query(query);
  
      // Verifica se há vendas
      if (result.length === 0) {
        return res.status(404).json({ message: 'Nenhuma venda registrada.' });
      }
  
      res.status(200).json(result);
    } catch (err) {
      console.error('Erro ao buscar as vendas:', err);
      res.status(500).json({ error: 'Erro ao buscar as vendas.' });
    }
  });
  

  // Iniciar o servidor
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });