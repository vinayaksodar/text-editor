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

// Generate a lot of text
let bigText = "";
for (let i = 1; i <= 20000; i++) {
  bigText += `Line ${i}: This is some sample text for testing the editor.\n`;
}

// Setup editor with generated text
const model = new EditorModel(bigText);
const view = new EditorView(model, editorContainer, widgetLayer);
const controller = new EditorController(model, view, wrapper);

view.render();
