import Busboy from "busboy";
import { pipeline } from "stream/promises";
import fs from "fs";
import { logger } from "./logger.js";

export default class UploadHandler {
    constructor({ io, socketId, downloadsFolder, messageTimeDelay = 200 }) {
        this.io = io,
        this.socketId = socketId,
        this.downloadsFolder = downloadsFolder,
        this.ON_UPLOAD_EVENT = "file-upload",
        this.messageTimeDelay = messageTimeDelay
    }

    canExecute(lastExecution) {
        // returns true or false

        return (Date.now() - lastExecution) >= this.messageTimeDelay
    }

    handleFileBytes(filename) {
        this.lastMessageSent = Date.now()
        async function* handleData(source) {
            let processedAlready = 0;
            for await(const chunk of source) {
                // retorna chunk para a função generator
                yield chunk;
                processedAlready += chunk.length;
                if(!this.canExecute(this.lastMessageSent)) {
                    continue;
                }

                this.lastMessageSent = Date.now();

                this.io.to(this.socketId).emit(this.ON_UPLOAD_EVENT, { processedAlready, filename })
                logger.info(`File [${filename}] got ${processedAlready} bytes to ${this.socketId}`)
            }
        }

        return handleData.bind(this)
    }
    
    async onFile(fieldname, file, filename) {
        // fazer o funil das partes dos arquivos (pipeline)
        const saveTo = `${this.downloadsFolder}/${filename}`
        await pipeline(
            // 1º passo, pegar uma readable stream;

            file,
            // 2º passo, filtrar, converter, transformar dados!

            // apply pois é o mesmo que passar this.handleFileBytes(filename => {})
            this.handleFileBytes.apply(this, [ filename ]),

            // 3º passo, é a saida do processo, uma writable stream;

            fs.createWriteStream(saveTo)
        )
        
        logger.info(`File [${filename}] finished`)
    }

    registerEvents(headers, onFinish) {
        const busboy = new Busboy({ headers })

        // bind para ter certeza que é a função dessa classe
        // e não de outra classe da conexão socket
        busboy.on("file", this.onFile.bind(this))
        busboy.on("finish", onFinish)
        return busboy;
    }
}