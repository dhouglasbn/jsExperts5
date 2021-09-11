import FileHelper from "./fileHelper.js"
import { logger } from "./logger.js";
import { dirname, resolve } from "path";
import { fileURLToPath, parse } from "url";
import UploadHandler from "./uploadHandler.js";
import { pipeline } from "stream/promises";

// pegando o nome da pasta atual
const __dirname = dirname(fileURLToPath(import.meta.url))

// pegando a pasta dos arquivos 
const defaultDownloadsFolder = resolve( __dirname, "../", "downloads")

export default class Routes {
    constructor(downloadsFolder = defaultDownloadsFolder) {
        this.downloadsFolder = downloadsFolder
        this.fileHelper = FileHelper
        this.io = {}
    }

    // trazendo o servidor socket para poder emitir e receber eventos aqui
    setSocketInstance(io) {
        this.io = io
    }

    async DefaultRoute(request, response) {
        response.end("hello world")
    }

    async options(request, response) {
        response.writeHead(204)
        response.end()
    }

    async post(request, response) {
        const { headers } = request;

        // pegar as variáveis das query params
        const { query: { socketId } } = parse(request.url, true);

        const uploadHandler = new UploadHandler({
            socketId,
            io: this.io,
            downloadsFolder: this.downloadsFolder
        })

        const onFinish = response => () => {
            response.writeHead(200);
            const data = JSON.stringify({ result: "Files uploaded with success!" })
            response.end(data)
        }

        const busboyInstance = uploadHandler.registerEvents(headers, onFinish(response))

        await pipeline(
            request,
            busboyInstance
        )

        logger.info("Request finished with success!")
    }

    async get(request, response) {
        const files = await this.fileHelper.getFilesStatus(this.downloadsFolder);

        response.writeHead(200)
        response.end(JSON.stringify(files))
    }
    
    handler(request, response) {
        // liberar as funcionalidades do cors
        response.setHeader("Access-Control-Allow-Origin", "*")

        // vai chegar aqui o post, vou deixá-lo minúsculo e minha função post será executada
        // se não houver valor aqui na request, vou chamar a defaultRoute
        const chosen = this[request.method.toLowerCase()] || this.DefaultRoute // POST, GET

          // o apply é para eu poder referenciar o meu this e usar as funções de Routes
          // como se fosse chosen(request, response)
          // ai vai passar a função post(request, response), ou get(request, response)        
        return chosen.apply(this, [request, response])
    }
}