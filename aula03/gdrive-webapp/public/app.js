import AppController from "./src/appController.js";
import ConnectionManager from "./src/connectionManager.js";
import DragAndDropManager from "./src/dragAndDropManager.js";
import ViewManager from "./src/viewManager.js";

const API_URL = "https://0.0.0.0:3000";

const appController = new AppController({
    viewManager: new ViewManager(),
    dragAndDropManager: new DragAndDropManager(),
    // essa key vai ter todas as funçõess de connectionManager
    // que chama os arquivos no server
    connectionManager: new ConnectionManager({
        apiUrl: API_URL
    })
})

try {
    // chamar os dados do server
    await appController.initialize()
} catch (error) {
    console.error("error on initializing", error)
    
}