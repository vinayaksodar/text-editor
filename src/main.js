import "./style.css";
import { EditorModel } from "./editor/EditorModel.js";
import { EditorView } from "./editor/EditorView.js";
import { EditorController } from "./editor/EditorController.js";
import { createWidgetLayer } from "./components/WidgetLayer/WidgetLayer.js";
import { createToolbar } from "./components/Toolbar/Toolbar.js";
import { createEditorContainer } from "./components/EditorContainer/EditorContainer.js";
import { createLineNumbers } from "./components/LineNumbers/LineNumbers.js";
const app = document.querySelector("#app");

// Root wrapper
const wrapper = document.createElement("div");
wrapper.className = "editor-wrapper";

// Toolbar container
const toolbar = createToolbar();

// Widget layer
const widgetLayer = createWidgetLayer();

// Create editor area container (holds line numbers + editor)
const editorArea = document.createElement("div");
editorArea.className = "editor-area";

// Line numbers container
const lineNumbersContainer = createLineNumbers();

// Editor container
const editorContainer = createEditorContainer();

// Assemble editor area
editorArea.appendChild(lineNumbersContainer);
editorArea.appendChild(editorContainer);

// Assemble
wrapper.appendChild(toolbar);
wrapper.appendChild(widgetLayer);
wrapper.appendChild(editorArea);

app.appendChild(wrapper);

// Generate a lot of text
let bigText = "";
for (let i = 1; i <= 20000; i++) {
  bigText += `Line ${i}: This is some sample text for testing the editor.\n`;
}

// Setup editor with generated text
const model = new EditorModel(bigText);
const view = new EditorView(model, editorContainer, widgetLayer, lineNumbersContainer);
const controller = new EditorController(model, view, wrapper, toolbar);

view.render();
