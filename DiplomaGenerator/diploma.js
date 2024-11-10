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
    this.dataNascimento = new Date(dataNascimento);
    this.cpf = cpf;
    this.dataConclusao = new Date(dataConclusao);
    this.curso = curso;
    this.dataEmissao = new Date(dataEmissao);
  }
}
