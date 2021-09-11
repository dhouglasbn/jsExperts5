// static por que não vou precisar trabalhar com o this
import fs from "fs";
import prettyBytes from "pretty-bytes";

export default class FileHelper {
    static async getFilesStatus(downloadsFolder) {

        // pegando os arquivos em seu diretório
        const currentFiles = await fs.promises.readdir(downloadsFolder)

        // array com todos os status de cada arquivo arquivo
        const statuses = await Promise.all(
            currentFiles.map(file => fs.promises.stat(`${downloadsFolder}/${file}`))
        )

        // array de objetos com os status q me interessam
        const filesStatuses = []
        for( const fileIndex in currentFiles ) {
            // cada arquivo do array currentFiles, vou pegar o birthtime e size
            const { birthtime, size } = statuses[fileIndex]

            // cada arquivo de currentFiles vou adicionar um objeto com os status do arquivo em fileStatuses
            filesStatuses.push({
                size: prettyBytes(size),
                file: currentFiles[fileIndex],
                lastModified: birthtime,
                owner: process.env.USER
            })
        }

        return filesStatuses;
    }
}