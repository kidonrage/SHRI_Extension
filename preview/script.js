const vscode = acquireVsCodeApi();

const previewContent = document.body.querySelector('#preview-content');

function togglePreviewMode(newMode) {
  vscode.setState({ previewMode: newMode });

  vscode.postMessage({
    command: 'changePreviewMode',
    newMode
  })
}

const modeSwitchPanel = document.querySelector("#preview-mode-switcher");

modeSwitchPanel.addEventListener('click', function(e) {
  const target = e.target;
  
  const modeData = target.attributes['mode-data'];

  if (!modeData) {
    return;
  }

  togglePreviewMode(modeData.value);
});

let selectedButton;

const modeSwitchButtons = document.querySelectorAll('button.preview-types-button');

modeSwitchButtons.forEach(button => {
  const modeName = button.attributes["mode-data"];

  if (!modeName) {
    return;
  }

  if (modeSwitchPanel.classList.contains(modeName.value)) {
    selectedButton = button;
  }
});


const previousState = vscode.getState();


if (selectedButton) {
  selectedButton.classList.add("active");

  const activePreviewType = selectedButton.attributes["mode-data"].value;

  togglePreviewMode(activePreviewType);
}