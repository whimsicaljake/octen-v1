const radioOption = document.getElementById("changehtml");
const label = document.querySelector('label[for="changehtml"]');

radioOption.addEventListener("change", () => {
  if (radioOption.checked) {
    label.style.color = "green"; // Change label color when radio button is checked
  } else {
    label.style.color = "black"; // Revert label color when radio button is unchecked
  }
});
