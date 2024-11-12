const amqp = require("amqplib");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const mysql = require("mysql2");
const Diploma = require("./diploma");

async function gerarPDF(html) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Add these flags
  });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: "A4", landscape: true });
  await browser.close();
  return pdf;
}

function template(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function substituirDados(html, diplomaInstance) {
  return html.replace(/{{(\w+)}}/g, (match, p1) => diplomaInstance[p1] || "");
}

function formatDateToMySQL(dateString) {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
}

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

console.log("Waiting for RabbitMQ to start");

setTimeout(async () => {
  try {
    const connection = await amqp.connect("amqp://rabbitmq");
    const channel = await connection.createChannel();
    const queue = "certificados"; // Replace with the actual queue name

    await channel.assertQueue(queue, { durable: true });
    console.log("Waiting for messages in queue:", queue);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const messageContent = msg.content.toString();
        console.log("Received message:", messageContent);

        try {
          // Parse the JSON message
          const jsonData = JSON.parse(messageContent);

          // Create an instance of the Diploma object with JSON data
          const diplomaInstance = new Diploma(
            jsonData.nomeAluno,
            jsonData.nacionalidade,
            jsonData.estado,
            jsonData.dataNascimento,
            jsonData.cpf,
            jsonData.dataConclusao,
            jsonData.curso,
            jsonData.dataEmissao
          );

          // Load and populate the HTML template
          const diplomaTemplate = path.join(__dirname, "template.html");
          const diplomaHTML = template(diplomaTemplate);

          const filledHTML = substituirDados(diplomaHTML, diplomaInstance);
          const pdfBuffer = await gerarPDF(filledHTML);

          // Define the PDF path and write the file
          const uuid = uuidv4();
          const pdfPath = path.join(
            __dirname,
            "../diplomasGerados",
            `${uuid}.pdf`
          );
          fs.writeFileSync(pdfPath, pdfBuffer);
          console.log("PDF generated and saved at:", pdfPath);

          const query = `INSERT INTO diplomas (nome_aluno, nacionalidade, estado, data_nascimento, numero_cpf, data_conclusao, nome_curso, data_emissao, diploma_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          mysqlConnection.query(
            query,
            [
              diplomaInstance.nomeAluno,
              diplomaInstance.nacionalidade,
              diplomaInstance.estado,
              formatDateToMySQL(diplomaInstance.dataNascimento),
              diplomaInstance.cpf,
              formatDateToMySQL(diplomaInstance.dataConclusao),
              diplomaInstance.curso,
              formatDateToMySQL(diplomaInstance.dataEmissao),
              pdfPath,
            ],
            (err, result) => {
              if (err) {
                console.error("Erro ao salvar no MySQL:", err);
                return res
                  .status(500)
                  .send("Erro ao salvar no banco de dados.");
              }
            }
          );
          console.log("Data inserted in database.");

          // Acknowledge message processing
          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          channel.nack(msg);
        }
      }
    });
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
}, 40000);
