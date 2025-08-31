import "./style.css";
import { EditorModel } from "./model.js";
import { EditorView } from "./view.js";
import { EditorController } from "./controller.js";

document.querySelector("#app").innerHTML = `
  <div class="editor-wrapper">
    <div class="widget-layer" id="widget-layer"></div>
    <div class="editor-container" id="editor-container"></div>
  </div>
`;

const editorContainer = document.querySelector("#editor-container");
const widgetLayer = document.querySelector("#widget-layer");
const wrapper = document.querySelector(".editor-wrapper");

// Setup editor
const model = new EditorModel(
  "Hello, World!\nHello, World!\nThis is a basic editor."
);
const view = new EditorView(model, editorContainer, widgetLayer);
const controller = new EditorController(model, view, wrapper);

view.render();
