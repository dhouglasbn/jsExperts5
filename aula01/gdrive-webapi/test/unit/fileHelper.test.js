import { describe, test, expect, jest } from "@jest/globals";
import fs from "fs";
import FileHelper from "../../src/fileHelper.js";

import Routes from "./../../src/routes.js";

describe("#FileHelper", () => {
    describe("#getFileStatus", () => {
        test("it should return statuses in correct format", async () => {

            const statMock = {
                dev: 2054,
                mode: 33204,
                nlink: 1,
                uid: 1000,
                gid: 1000,
                rdev: 0,
                blksize: 4096,
                ino: 11146110,
                size: 1620360,
                blocks: 3168,
                atimeMs: 1630962069339.718,
                mtimeMs: 1630962069027.7112,
                ctimeMs: 1630962069027.7112,
                birthtimeMs: 1630962069003.7107,
                atime: "2021-09-06T21:01:09.340Z",
                mtime: "2021-09-06T21:01:09.028Z",
                ctime: "2021-09-06T21:01:09.028Z",
                birthtime: "2021-09-06T21:01:09.004Z"
            }

            // usando mockUser na env_var USER e expectedResult
            const mockUser = "dhouglas";
            process.env.USER = mockUser

            // para ser usado em expectedResult
            const filename = "file.png"

            // arrancar tudo o que é função externa relacionada a manipulação dos arquivos

            // na função stat, eu não quero saber o que vai acontecer com o diretório do arquivo
            jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue([filename])

            // na função stat, eu não quero saber o que vai acontecer com statMock
            jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(statMock)

            const result = await FileHelper.getFilesStatus("/tmp")


            const expectedResult = [
                {
                    size: "1.62 MB",
                    lastModified: statMock.birthtime,
                    owner: mockUser,
                    file: filename
                }
            ]

            // espera-se que esse método seja chamado junto com esse path
            expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`);

            // espera-se que os objetos tenham os mesmos itens
            expect(result).toMatchObject(expectedResult);
        })
    })
})