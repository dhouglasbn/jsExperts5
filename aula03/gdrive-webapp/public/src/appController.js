import DragAndDropManager from "./dragAndDropManager.js";

export default class AppController {
    constructor({ connectionManager, viewManager, dragAndDropManager }) {
        this.connectionManager = connectionManager
        this.viewManager = viewManager
        this.dragAndDropManager = dragAndDropManager

        this.uploadingFiles = new Map()
    }

    async initialize() {
        // chamar o input files quando clicar no botão new
        this.viewManager.configureFileBtnClick();

        // deffinindo como a modal funcionará
        this.viewManager.configureModal()

        // chamar o diretório quando clicar no botão new
        this.viewManager.configureOnFileChange(this.onFileChange.bind(this))

        // a partir daqui, o js fica vendo se eu arrasto algum arquivo porcima do D&D
        // e ai eu posso fazer o que quiser com este arquivo
        this.dragAndDropManager.initialize({
            onDropHandler: this.onFileChange.bind(this)
        })
        
        // escutar as io calls "connect" "file-upload"
        this.connectionManager.configureEvents({
            onProgress: this.onProgress.bind(this)
        })

        this.viewManager.updateStatus(0)


        // chamar os dados do server
        await this.updateCurrentFiles()
    }

    async onProgress({ processedAlready, filename }) {
        const file = this.uploadingFiles.get(filename)
        console.debug({ processedAlready, file })
        const alreadyProcessed = Math.ceil(processedAlready / file.size * 100)
        this.updateProgress(file, alreadyProcessed)

        if(alreadyProcessed < 98) return;

        return this.updateCurrentFiles()
    }

    updateProgress(file, percent) {
        const uploadingFiles = this.uploadingFiles;
        file.percent = percent;

        const total = [...uploadingFiles.values()]
            .map(({ percent }) => percent ?? 0) // se não houver percent passa 0
            .reduce((total, current) => total + current, 0) // se não houver nada o somatório é 0

        this.viewManager.updateStatus(total)
    }
 
    async onFileChange(files) {

        // aqui há um bug conhecido, se no meio do upload
        // vc fazer outro upload, ele vai fechar o modal e iniciar do zero
        // para não continuar a contagem após o 100%
        this.uploadingFiles.clear()

        this.viewManager.openModal();
        this.viewManager.updateStatus(0);

        const requests = []
        for (const file of files) {
            this.uploadingFiles.set(file.name, file)
            requests.push(this.connectionManager.uploadFile(file))
        }

        // esperar após todos os uploads concluirem, a array estar completa
        await Promise.all(requests);
        this.viewManager.updateStatus(100);

        setTimeout(() => {
            this.viewManager.closeModal()
        }, 1000);

        // chamando a rota get no server de novo
        await this.updateCurrentFiles()
    }

    async updateCurrentFiles() {
        // chamando os dados do server
        const files = await this.connectionManager.currentFiles();
        this.viewManager.updateCurrentFiles(files)
    }
}