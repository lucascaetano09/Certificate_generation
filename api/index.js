const express = require("express");
const amqp = require("amqplib");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.json());

let mysqlConnection;

const mysqlInterval = setInterval(() => {
  mysqlConnection = mysql.createConnection({
    host: "mysql",
    user: "user",
    password: "userpassword",
    database: "sistema_diplomas",
  });

  mysqlConnection.connect((err) => {
    if (err) throw err;
    clearInterval(mysqlInterval);
    console.log("Connected to MySQL!");
  });
}, 5000);

async function checkIfExists(body, callback) {
  const nome = body.nomeAluno;
  const curso = body.curso;

  mysqlConnection.query(
    "SELECT COUNT(*) AS count FROM yourTable WHERE nome = ? AND curso = ?",
    [nome, curso],
    (err, results) => {
      const exists = results && results[0] && results[0].count > 0;
      callback(exists);
    }
  );
}

function encode(body) {
  const nomeAluno = body.nomeAluno;
  const curso = body.curso;

  const combinedString = `${nomeAluno}//${curso}`;

  const base64Encoded = Buffer.from(combinedString).toString("base64");

  return base64Encoded;
}

// Conexão RabbitMQ
async function sendToQueue(message) {
  try {
    const connection = await amqp.connect("amqp://rabbitmq");
    const channel = await connection.createChannel();
    const queue = "certificados";

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });

    console.log("Mensagem enviada para fila:", message);
  } catch (error) {
    console.error("Erro ao enviar mensagem para fila:", error);
  }
}

// Endpoint para receber JSON e salvar na fila
app.post("/adicionar", async (req, res) => {
  checkIfExists(req.body, (exists) => {
    if (exists) {
      res.send("O aluno já possúi um certificado desse curso.");
    } else {
      const encodedData = encode(req.body);

      sendToQueue(req.body);

      res
        .status(200)
        .send(
          `Dados recebidos e adicionados a fila. Para visualizar seu certificado posteriormente utilize o código: ${encodedData}`
        );
    }
  });
});

// app.get("/visualizarCertificado"){

// }

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
