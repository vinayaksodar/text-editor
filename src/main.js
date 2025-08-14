import "./style.css";
import { EditorModel } from "./model.js";
import { EditorView } from "./view.js";
import { EditorController } from "./controller.js";

// Create editor container dynamically
const container = document.createElement("div");
container.id = "editor-container";
document.body.appendChild(container);

// Setup editor
const model = new EditorModel(
  "Hello, World!\nHello, World!\nThis is a basic editor."
);
const view = new EditorView(model, container);
const controller = new EditorController(model, view, container);

view.render();
