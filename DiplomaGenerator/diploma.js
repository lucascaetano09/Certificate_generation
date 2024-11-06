class Diploma {
    constructor(id, nomeAluno, curso, dataConclusao, dataEmissao) {
        this.id = id;
        this.nomeAluno = nomeAluno;
        this.curso = curso;
        this.dataConclusao = new Date(dataConclusao);
        this.dataEmissao = new Date(dataEmissao);
    }
}
