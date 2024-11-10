const amqp = require("amqplib");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const uuid = uuidv4();
const Diploma = require("./diploma");

async function gerarPDF(html) {
  const browser = await puppeteer.launch();
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

(async () => {
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
          const pdfPath = path.join(
            __dirname,
            "../diplomasGerados",
            `${uuid}.pdf`
          );
          fs.writeFileSync(pdfPath, pdfBuffer);
          console.log("PDF generated and saved at:", pdfPath);

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
})().catch(console.error);
