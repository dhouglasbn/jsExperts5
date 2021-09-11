import https from "https";
import fs from "fs";
import { Server } from "socket.io"

// logger foi uma função que fizemos para customizar nossos logd a nossa maneira
import { logger } from "./logger.js";
import Routes from "./routes.js";

// pegando o número da variável de ambiente PORT
// se não houver, essa variável vai ser criada com o valor 3000
const PORT = process.env.PORT || 3000;

// lendo os arquivos de certificados e pondo no objeto
const localHostSSL = {
    key: fs.readFileSync("./certificates/key.pem"),
    cert: fs.readFileSync("./certificates/cert.pem")
};

const routes = new Routes()

// instanciando o servidor, passando os certificados na SSL
// fazendo requisição para retornar uma mensagem no site
const server = https.createServer(
    localHostSSL,
    routes.handler.bind(routes)
);

// criando nosso servidor web socket dentro do nosso servidor
// passando algumas configurações para o servidor websocket
const io = new Server(server, {
    cors: {
        origin: "*",
        credentials: false
    }
})

// instanciando o servidor socket para emitir e receber eventos nas nossas rotas
routes.setSocketInstance(io)

// escutando uma conexão "connection"
// a função q recebe parametro socket, a ele vai ser atribuido já as informações da conexão
io.on("connection", (socket) => {
    // dando log na id de quem conectou
    logger.info(`someone connected: ${socket.id}`)
})

// função para dar log após o server ser iniciado
const startServer = () => {
    const { address, port } = server.address()
    logger.info(`app running at https://${address}:${port}`)
};

// dando um listen passando a porta e uma função que será executada após isso
server.listen(PORT, startServer)