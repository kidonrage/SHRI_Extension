let previewModes = [];

const getBodyClass = (mode) => 'body___' + mode;

function togglePreviewMode(newMode) {
  const modeClasses = previewModes.map(mode => {
    return getBodyClass(mode)
  });

  modeClasses.forEach(modeClass => document.body.classList.remove(modeClass));

  document.body.classList.add(getBodyClass(newMode));
}

let selectedButton;

const radioButtons = document.querySelectorAll('input[name="preview-type"]');

radioButtons.forEach(radioButton => {
  const modeName = radioButton.value;

  if (!modeName) {
    return;
  }

  if (radioButton.checked) {
    selectedButton = radioButton;
  }

  previewModes.push(modeName)

  radioButton.addEventListener('change', function() {
    togglePreviewMode(modeName);
  });
})

if (selectedButton) {
  const activePreviewType = selectedButton.value;

  togglePreviewMode(activePreviewType);
}