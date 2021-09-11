import { describe, test, expect, jest, beforeAll, afterAll } from "@jest/globals";
import fs from "fs";
import FileHelper from "../../src/fileHelper.js";
import { logger } from "../../src/logger.js"
import { tmpdir  } from "os";
import { join } from "path"

import Routes from "../../src/routes.js";
import FormData from "form-data";
import TestUtil from "../_util/testUtil.js";

describe("#Routes Integration Test", () => {
    let defaultDownloadsFolder = ""

    beforeAll( async() => {
        // gerar meus arquivos dentro de uma pasta aleatória temporária
        defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), "downloads-"))
    })

    afterAll( async() => {
        // deletar tudo
        await fs.promises.rm(defaultDownloadsFolder, { recursive: true })
    })

    // mockando o logger.info
    beforeEach(() => {
        jest.spyOn(logger, "info").mockImplementation()
    })

    describe("#getFileStatus", () => {
        const ioObject = {
            to: id => ioObject,
            emit: (event, message) => {}
        }

        test("should upload file to the folder", async () => {

        

            const filename = "nlw03.jpg";
            const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`)
            const response = TestUtil.generateWritableStream(() => { })

            const form = new FormData()
            form.append("photo", fileStream)

            const defaultParams = {
                request: Object.assign(form, {
                    headers: form.getHeaders(),
                    method: "POST",
                    url: "?socketId=10"
                }),
                response: Object.assign(response, {
                    setHeader: jest.fn(),
                    writeHead: jest.fn(),
                    end: jest.fn()
                }),
                values: () => Object.values(defaultParams)
            }

            // instanciando routes
            const routes = new Routes(defaultDownloadsFolder)

            // instanciando o server socket
            routes.setSocketInstance(ioObject)

            // lendo o diretório
            const dirBeforeRan = await fs.promises.readdir(defaultDownloadsFolder)
            
            // no começo o diretório deve ser vazio
            expect(dirBeforeRan).toEqual([])
            
            // chamando a rota post com a request,response
            await routes.handler(...Object.values(defaultParams))
            
            // lendo o diretório
            const dirAfterRan = await fs.promises.readdir(defaultDownloadsFolder)

            // após a requisição post, o diretório deve estar com o arquivo
            expect(dirAfterRan).toEqual([filename])

            // espera-se que a response seja chamada com a statusCode 200
            expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200);

            const expectedResult = JSON.stringify({ result: "Files uploaded with success!" })

            // espera-se que o end da response seja chamado com a mensagem de sucesso
            expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult);
        })
    })
})