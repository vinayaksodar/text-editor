import "./editorcontainer.css";

export function createEditorContainer() {
  const container = document.createElement("div");
  container.className = "editor-container";
  container.id = "editor-container";
  return container;
}
