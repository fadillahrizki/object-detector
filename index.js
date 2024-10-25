import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0";

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Reference the elements that we will need
const fileUpload = document.getElementById("file-upload");
const imageContainer = document.getElementById("image-container");

let video = document.querySelector("#video");
let click_button = document.querySelector("#click-photo");
let tryagain_button = document.querySelector("#tryagain-btn");
let canvas = document.querySelector("#canvas");
let loading = document.querySelector("#loading");
let readyTo = document.querySelector("#ready-to");
let loader = document.querySelector(".loader");

let stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: false,
});
video.srcObject = stream;

const detector = await pipeline("object-detection");
readyTo.style.display = "flex";
loading.style.display = "none";

click_button.addEventListener("click", function () {
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  let image_data_url = canvas.toDataURL("image/jpeg");

  video.style.display = "none";

  imageContainer.innerHTML = "";
  const image = document.createElement("img");
  image.src = image_data_url;
  imageContainer.appendChild(image);
  detect(image);
});

fileUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    video.style.display = "none";

    const reader = new FileReader();

    // Set up a callback when the file is loaded
    reader.onload = function (e2) {
        imageContainer.innerHTML = '';
        const image = document.createElement('img');
        image.src = e2.target.result;
        imageContainer.appendChild(image);
        detect(image);
    };
    reader.readAsDataURL(file);
});

// Detect objects in the image
async function detect(img) {
  click_button.textContent = "Analysing...";
  loader.style.display = "block";
  readyTo.style.display = "none";

  let output = await detector(img.src, {
    threshold: 0.5,
    percentage: true,
  });
  tryagain_button.style.display = "block";
  click_button.style.display = "none";

  loader.style.display = "none";
  readyTo.style.display = "flex";
  output = output.filter(out=>out.score>=0.8)
  console.log(output);
  output.forEach(renderBox);
}

// Render a bounding box and label on the image
function renderBox({ box, label, score}) {
  const { xmax, xmin, ymax, ymin } = box;

  // Generate a random color for the box
  const color =
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, 0);

  // Draw the box
  const boxElement = document.createElement("div");
  boxElement.className = "bounding-box";
  Object.assign(boxElement.style, {
    borderColor: color,
    left: 100 * xmin + "%",
    top: 100 * ymin + "%",
    width: 100 * (xmax - xmin) + "%",
    height: 100 * (ymax - ymin) + "%",
  });

  // Draw label
  const labelElement = document.createElement("span");
  labelElement.textContent = label + ` (${(score*100).toFixed(2)}%)`;
  labelElement.className = "bounding-box-label";
  labelElement.style.backgroundColor = color;

  boxElement.appendChild(labelElement);
  imageContainer.appendChild(boxElement);
}

tryagain_button.addEventListener("click", function () {
  click_button.textContent = "Capture";
  click_button.disabled = false;
  click_button.style.display = "block";
  tryagain_button.style.display = "none";
  imageContainer.innerHTML = "";

  video.style.display = "block";
});
