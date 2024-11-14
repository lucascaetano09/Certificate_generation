##Passo-a-passo:
1- Com o projeto aberto digite no terminal
`docker compose up -d --build`
2- No postman, selecione o método POST e utilize as seguintes informações pra fazer a requisição
`curl --location 'http://localhost:3000/adicionar' \
--header 'Content-Type: application/json' \
--data '{
    "nomeAluno": "Lucas Caetano",
    "nacionalidade": "Brasileiro",
    "estado": "São Paulo",
    "dataNascimento": "09/07/2004",
    "cpf": "93537",
    "dataConclusao": "05/10/2024",
    "curso": "Sistemas de Informação",
    "dataEmissao": "11/11/2024"
}'`
