import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { pipeline } from "stream/promises";
import { logger } from "../../src/logger.js"
import UploadHandler from "../../src/uploadHandler.js";
import TestUtil from "../_util/testUtil.js";
import fs from "fs";
import { resolve } from "path";


describe("#UploadHandler test suite", () => {

    const ioObject = {
        to: id => ioObject,
        emit: (event, message) => {}
    }

    // dar logger como "resolvido"
    beforeEach(() => {
        jest.spyOn(logger, "info").mockImplementation()
    })
    describe("#registerEvents", () => {
        test("should call onFile and onFinish function on Busboy instance", () => {
            const uploadHandler = new UploadHandler({
                io: ioObject,
                socketId: "01"
            })

            // quando uploadHandler for instanciada, não quero testar a função onFile
            jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue()

            const headers = {
                "content-type": "multipart/form-data; boundary="
            }

            // função executada com sucesso
            const onFinish = jest.fn()

            // vai escutar as sockets "file" e "finish" e retornar a classe do busboy com suas funções 
            const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

            // vai retornar as informações de cada pedaço dos arquivos
            const fileStream = TestUtil.generateReadableStream([ "chunk", "of", "data" ]) 
            
            // fazendo emit em "file", passando a fieldname, o arquivo, e o nome do arquivo 
            busboyInstance.emit("file", "fieldname", fileStream, "filename.txt")

            busboyInstance.listeners("finish")[0].call()

            // espera-se que a função onFile seja chamada 
            expect(uploadHandler.onFile).toHaveBeenCalled()

            // espera-se que no onFile, a onFinished(nossa ficticia fn) seja chamada
            expect(onFinish).toHaveBeenCalled()
        })
        
    })
  
    describe("#onFile", () => {
        test("given a stream file it should save it on disk", async () => {
            const chunks = ["hey", "dude"];
            const downloadsFolder = "/tmp";
            const handler = new UploadHandler({
                io: ioObject,
                socketId: "01",
                downloadsFolder
            })

            const onData = jest.fn()

            // mockando a implementação da function de gerar a writable stream
            jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(() => TestUtil.generateWritableStream(onData))

            const onTransform = jest.fn()

            // mockando a implementação do generateTransformStream no handleFileBytes
            jest.spyOn(handler, handler.handleFileBytes.name).mockImplementation(() => TestUtil.generateTransformStream(onTransform))

            const params = {
                fieldname: "video",
                file: TestUtil.generateReadableStream(chunks),
                filename: "mockFile.mov"
            }

            // usando uma sintaxe aq pra cada valor de params ser um parametro em onFile
            await handler.onFile(...Object.values(params))

            // espera-se que o onData(com todas as chamadas unidas e postas em strings) sejam iguais a chunks(unidas)
            // ou seja: quando eu juntar cada pedacinho do arquivo, quero que seja igual a junção de chunks
            expect(onData.mock.calls.join()).toEqual(chunks.join())

            // espera-se que o onTransform(com todas as chamadas unidas e postas em strings) sejam iguais a chunks(unidas)
            // ou seja: quando eu juntar cada pedacinho do arquivo, quero que seja igual a junção de chunks
            expect(onTransform.mock.calls.join()).toEqual(chunks.join())

            const expectedFilename = resolve(handler.downloadsFolder, params.filename)

            // espera-se que a createWriteStream seja chamada junto com a path do arquivo
            expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
        })
    })
    
    describe("#handleFileBytes", () => {
        test("should call emit function and it's a transform stream", async() => {
            jest.spyOn(ioObject, ioObject.to.name)
            jest.spyOn(ioObject, ioObject.emit.name)
            
            const handler = new UploadHandler({
                io: ioObject,
                socketId: "01"
            })
            
            // mockando o return de true da function canExecute
            jest.spyOn(handler, handler.canExecute.name).mockReturnValue(true)
            
            const messages = ["hello"]
            
            const source = TestUtil.generateReadableStream(messages)
            const onWrite = jest.fn()
            const target = TestUtil.generateWritableStream(onWrite);
            
            await pipeline(
                source,
                handler.handleFileBytes("filename.txt"),
                target
                )
                
                // espera-se que o to e o emit sejam chamados a mesma quantidade de vezes
                // que a quantidade de partes do arquivo
                expect(ioObject.to).toHaveBeenCalledTimes(messages.length)
                expect(ioObject.emit).toHaveBeenCalledTimes(messages.length)
                
                // se o handleFileBytes for um transform stream, nosso pipeline
                // vai continar o processo, passando os dados para frente
                // e chamar nossa função no target a cada chunk
                
                expect(onWrite).toBeCalledTimes(messages.length)
                
                // validando se os parametros estão certos
                expect(onWrite.mock.calls.join()).toEqual(messages.join())
            })
            
            test("given message timerDelay as 2secs it should emit only two messages during 2 seconds period", async() => {
                jest.spyOn(ioObject, ioObject.emit.name)
                
                
                // Date.now() do this.lastMessage em handleFileBytes
                const day = "2021-07-01 01:01"
                
                const twoSecondsPeriod = 2000 // 2 segundos

                const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)
                
                // --> hello chegou
                const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
            const onSecondUpdateLastMessageSent = onFirstCanExecute;
            
            // --> segundo hello, está fora da janela de tempo!
            const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
            
            // --> world
            const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`) 
            

            TestUtil.mockDateNow(
                [   
                    onFirstLastMessageSent,
                    onFirstCanExecute,
                    onSecondUpdateLastMessageSent,
                    onSecondCanExecute,
                    onThirdCanExecute
                ]
            )
            
            
            const messages = [ "hello", "hello", "world"];
            const filename = "filename.avi"
            const expectedMessagesSent = 2;
            
            const source = TestUtil.generateReadableStream(messages)
            const handler = new UploadHandler({
                messageTimeDelay: twoSecondsPeriod,
                io: ioObject,
                socketId: "01"
            })

            await pipeline(
                source,
                handler.handleFileBytes(filename)
            )
            
            expect(ioObject.emit).toHaveBeenCalledTimes(expectedMessagesSent);

            const [firstCallResult, secondCallResult] = ioObject.emit.mock.calls
            expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: "hello".length, filename }])
            expect(secondCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: messages.join("").length, filename }])
        })
    }),

    describe("#canExecute", () => {
        const uploadHandler = new UploadHandler({
            io: {},
            socketId: ""
        })

        test("should return true when time is later than specified delay", () => {
            const timerDelay = 1000;
            const uploadHandler = new UploadHandler({
                io: {},
                socketId: "",
                messageTimeDelay: timerDelay
            })

            // testar um delay de 1 s para a diferença de 3 s
            const now = TestUtil.getTimeFromDate("2021-07-01 00:00:03")
            TestUtil.mockDateNow([now])

            const lastExecution = TestUtil.getTimeFromDate("2021-07-01 00:00:00")
            

            // true or false
            const result = uploadHandler.canExecute(lastExecution)
            
            expect(result).toBeTruthy()
        })

        test("should return false when time isnt later than specified delay", () => {
            const timerDelay = 3000;
            const uploadHandler = new UploadHandler({
                io: {},
                socketId: "",
                messageTimeDelay: timerDelay
            })

            // testar um delay de 1 s para a diferença de 3 s
            const now = TestUtil.getTimeFromDate("2021-07-01 00:00:02")
            TestUtil.mockDateNow([now])
            const lastExecution = TestUtil.getTimeFromDate("2021-07-01 00:00:01")

        
            // true or false
            const result = uploadHandler.canExecute(lastExecution)
            
            expect(result).toBeFalsy()
        })
    })
})