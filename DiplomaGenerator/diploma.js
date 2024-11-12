class Diploma {
  constructor(
    nomeAluno,
    nacionalidade,
    estado,
    dataNascimento,
    cpf,
    dataConclusao,
    curso,
    dataEmissao
  ) {
    this.nomeAluno = nomeAluno;
    this.nacionalidade = nacionalidade;
    this.estado = estado;
    this.dataNascimento = dataNascimento;
    this.cpf = cpf;
    this.dataConclusao = dataConclusao;
    this.curso = curso;
    this.dataEmissao = dataEmissao;
  }
}

module.exports = Diploma;
