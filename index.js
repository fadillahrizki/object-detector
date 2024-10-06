import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Reference the elements that we will need
const fileUpload = document.getElementById('file-upload');
const imageContainer = document.getElementById('image-container');

let video = document.querySelector("#video");
let click_button = document.querySelector("#click-photo");
let canvas = document.querySelector("#canvas");
let loading = document.querySelector("#loading");
let readyTo = document.querySelector("#ready-to");

let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
	video.srcObject = stream;

const detector = await pipeline('object-detection');
readyTo.style.display = 'flex'
loading.style.display = 'none'


click_button.addEventListener('click', function() {
   	canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
   	let image_data_url = canvas.toDataURL('image/jpeg');

    video.style.display = 'none'

    imageContainer.innerHTML = '';
    const image = document.createElement('img');
    image.src = image_data_url;
    imageContainer.appendChild(image);
    detect(image_data_url);
});

fileUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    startAnalyze(file)    
});


function startAnalyze(file){
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
}


// Detect objects in the image
async function detect(img) {
    click_button.textContent = 'Analysing...';
    click_button.disabled = true
    const output = await detector(img, {
        threshold: 0.5,
        percentage: true,
    });
    click_button.textContent = 'Capture';
    video.style.display = 'block'
    output.forEach(renderBox);
}

// Render a bounding box and label on the image
function renderBox({ box, label }) {
    const { xmax, xmin, ymax, ymin } = box;

    // Generate a random color for the box
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0);

    // Draw the box
    const boxElement = document.createElement('div');
    boxElement.className = 'bounding-box';
    Object.assign(boxElement.style, {
        borderColor: color,
        left: 100 * xmin + '%',
        top: 100 * ymin + '%',
        width: 100 * (xmax - xmin) + '%',
        height: 100 * (ymax - ymin) + '%',
    });

    // Draw label
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    labelElement.className = 'bounding-box-label';
    labelElement.style.backgroundColor = color;

    boxElement.appendChild(labelElement);
    imageContainer.appendChild(boxElement);
}