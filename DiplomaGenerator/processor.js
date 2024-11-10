const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require("uuid");
const uuid = uuidv4();


async function gerarPDF(html) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4', landscape: true });
  await browser.close();
  return pdf;
}

function template(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function substituirDados(html, dados) {
  return Object.entries(dados).reduce((conteudo, [dados, value]) => {
    return conteudo.replace(new RegExp(dados, 'g'), value);
  }, html);
}

(async () => {
  const diplomaTemplate = path.join(__dirname, 'template.html');
  const pdfGerado = path.join(__dirname, '../diplomasGerados', `${uuid}.pdf`);
  
  const diplomaHTML = template(diplomaTemplate);

  const jsonTeste = {
    "{{nome_aluno}}": "Guilherme Viana",
    "{{nacionalidade}}": "Brasileiro",
    "{{estado}}": "São Paulo",
    "{{data_nascimento}}": "07/03/2003",
    "{{documento}}": "92954",
    "{{data_conclusao}}": "01/01/0001",
    "{{curso}}": "Sistemas de Informação",
    "{{data_emissao}}": "06/11/2024",
    "{{nome_assinatura}}": "José Romualdo",
    "{{cargo}}": "Professor"
  };

  const conteudoFinal = substituirDados(diplomaHTML, jsonTeste);
  const pdfBuffer = await gerarPDF(conteudoFinal);
  
  fs.writeFileSync(pdfGerado, pdfBuffer);
  console.log('PDF gerado com sucesso:', pdfGerado);
})().catch(console.error);
