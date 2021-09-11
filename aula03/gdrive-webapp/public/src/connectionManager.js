// socket.io já esta sendo importado como dependencia lá em index.js
// e é importado já como uma variável global
export default class ConnectionManager {
    constructor({ apiUrl }) {
        this.apiUrl = apiUrl

        this.ioClient = io.connect(apiUrl, { withCredentials: false })
        this.socketId = ""
    }

    configureEvents({ onProgress }) {
        // se não passar o bind ele vai achar que o onConnect é do io
        this.ioClient.on("connect", this.onConnect.bind(this))
        this.ioClient.on("file-upload", onProgress)
    }

    onConnect(message) {
        console.log("connected! ", this.ioClient.id)
        this.socketId = this.ioClient.id
    }

    async uploadFile(file) {
        const formData = new FormData()
        formData.append("files", file)

        const response = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
            method: "POST",
            body: formData
        })

        return response.json()
    }

    // chamar os arquivos e retornar do servidor
    async currentFiles() {
        // fazendo a requisição get que vai retornar a json com os arquivos
        const files = await (await fetch(this.apiUrl)).json();
        return files;
    }
}