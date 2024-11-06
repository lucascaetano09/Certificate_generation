const Minio = require('minio');
const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;

class DiplomaProcessor {
  constructor(context, minioClient) {
    this.context = context;
    this.minioClient = minioClient;
  }

  async processMessage(message) {
    const diplomaData = JSON.parse(message);

    console.log(`Processando diploma para ${diplomaData.nomeAluno}`);

    const templatePath = 'template-diploma.html';
    let templateHtml = await fs.readFile(templatePath, 'utf8');
    templateHtml = templateHtml.replace('{{nome_aluno}}', diplomaData.nomeAluno)
                               .replace('{{curso}}', diplomaData.curso)
                               .replace('{{data_conclusao}}', new Date(diplomaData.dataConclusao).toLocaleDateString('pt-BR'));

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome-stable',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(templateHtml);

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    const pdfFilePath = `diplomas/${diplomaData.nomeAluno}_${new Date(diplomaData.dataConclusao).toISOString().split('T')[0]}.pdf`;

    await this.minioClient.putObject('diplomas', pdfFilePath, pdfBytes);

    const diploma = {
      nomeAluno: diplomaData.nomeAluno,
      curso: diplomaData.curso,
      dataConclusao: diplomaData.dataConclusao,
      dataEmissao: new Date()
    };

    await this.context.execute(
      'INSERT INTO diplomas (nome_aluno, curso, data_conclusao, data_emissao) VALUES (?, ?, ?, ?)',
      [diploma.nomeAluno, diploma.curso, diploma.dataConclusao, diploma.dataEmissao]
    );

    console.log(`Diploma gerado e salvo em ${pdfFilePath}`);
  }
}

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'YOUR_MINIO_ACCESS_KEY',
  secretKey: 'YOUR_MINIO_SECRET_KEY'
});

const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'YOUR_MYSQL_PASSWORD',
  database: 'sistema_diplomas'
};

async function main() {
  const connection = await mysql.createConnection(mysqlConfig);
  const diplomaProcessor = new DiplomaProcessor(connection, minioClient);

  // Exemplo de uso da função (substitua `message` pelo JSON da mensagem a ser processada)
  const message = JSON.stringify({
    nomeAluno: 'João Silva',
    curso: 'Engenharia de Software',
    dataConclusao: '2024-06-15'
  });

  try {
    await diplomaProcessor.processMessage(message);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
