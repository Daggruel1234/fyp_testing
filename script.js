const video = document.getElementById("video");
const startCamera = document.getElementById("startCamera");
const stopCamera = document.getElementById("stopCamera");
const captureBtn = document.getElementById("capture");
const analyzeBtn = document.getElementById("analyze");
const processCanvas = document.getElementById("processCanvas");
const previewCanvas = document.getElementById("previewCanvas");
const resultText = document.getElementById("result");
const modelStatus = document.getElementById("modelStatus");
const preview = document.querySelector(".preview");
const saveBtn = document.getElementById("saveBtn");

let stream = null;
let model = null;
let capturedImage = null;
let webcam = null;
let labelContainer = null;
let maxPredictions = 0;

const URL = "https://teachablemachine.withgoogle.com/models/YmZz2MPBa/";
const modelURL = URL + "model.json";
const metadataURL = URL + "metadata.json";

async function loadModel() {
    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        modelStatus.textContent = "✅ Model loaded successfully!";
        console.log("✅ Model loaded successfully!");
        
        // Initialize label container
        labelContainer = document.getElementById("label-container");
        if (!labelContainer) {
            labelContainer = document.createElement("div");
            labelContainer.id = "label-container";
            document.querySelector(".container").appendChild(labelContainer);
        }
        
        // Create prediction labels
        labelContainer.innerHTML = ""; // Clear any existing content
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
    } catch (error) {
        modelStatus.textContent = "❌ Error loading model. Check console for details.";
        console.error("❌ Error loading model:", error);
    }
}

// Start camera function
startCamera.addEventListener("click", async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 300 }, height: { ideal: 300 }, facingMode: "user" } 
        });
        video.srcObject = stream;
        captureBtn.disabled = false;
        startCamera.textContent = "Restart Camera";
        
        // Setup teachable machine webcam if needed for live predictions
        const flip = true;
        webcam = new tmImage.Webcam(300, 300, flip);
        await webcam.setup(stream); // Use the same stream
    } catch (error) {
        console.error("❌ Error accessing webcam:", error);
        resultText.textContent = "Error: Could not access camera. Check permissions.";
    }
});

// Stop camera function
stopCamera.addEventListener("click", () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        captureBtn.disabled = true;
        analyzeBtn.disabled = true;
        resultText.textContent = "Camera stopped.";
        
        if (webcam) {
            webcam.stop();
        }
    } else {
        resultText.textContent = "No active camera stream.";
    }
});

captureBtn.addEventListener("click", () => {
    const ctx = processCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0, processCanvas.width, processCanvas.height);
    
    const previewCtx = previewCanvas.getContext("2d");
    previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
    
    preview.style.display = "block";
    
    capturedImage = processCanvas.toDataURL("image/jpeg");
    
    analyzeBtn.disabled = false;
    resultText.textContent = "Image captured. Click 'Analyze' to process.";
});


async function analyzeImage() {
    if (!model) {
        //resultText.textContent = "Model not loaded. Please wait or refresh.";
        console.log("Model not loaded. Please wait or refresh!")
        return;
    }

    resultText.textContent = "Analyzing...";

    try {
        const predictions = await model.predict(processCanvas);
        
        console.log("🔍 Prediction Output:", predictions);
        
        let resultHTML = "";
        let resultPrediction = {className:"", probability:0};

        for (let i = 0; i < predictions.length; i++) {
            const classPrediction = 
                predictions[i].className + ": " + (predictions[i].probability * 100).toFixed(2) + "%";
            
            if (labelContainer && labelContainer.childNodes[i]) {
                labelContainer.childNodes[i].innerHTML = classPrediction;
            }
            
            resultHTML += classPrediction + "<br>";
        }
        
        //resultText.innerHTML = "Analysis complete:<br>" + resultHTML;
        console.log("Analysis complete:<br>" + resultHTML);
        console.log("Result will be saved to database")

        if(resultPrediction.classname){
            try{
                await savedPredictionToDatabase(
                    resultPrediction.classname,
                    resultPrediction.probability,
                    captureImage
                );
            }catch(saveError){
                console.error("Data saved error" + saveError);

            }
        }
        
    } catch (error) {
        console.error("Error during analysis:", error);
    }
}

async function savedPredictionToDatabase(predictionType, confidence, imageData) {
    try {
        const response = await fetch('heath_record.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                predictionType: predictionType,
                confidence: confidence,
                imageData: imageData
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Save result:', result);

        if (result.status === 'success') {
            console.log('Result saved successfully into the database!');
        } else {
            console.error('Failed to save result into database:', result.message);
        }

        return result;
    } catch (error) {
        console.error('Error saving prediction:', error);
        throw error;
    }
}


async function loop() {
    if (webcam && webcam.canvas) {
        webcam.update();
        await predict();
        window.requestAnimationFrame(loop);
    }
}

async function predict() {
    if (!model || !webcam || !webcam.canvas) return;
    
    try {
        const predictions = await model.predict(webcam.canvas);
        
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = 
                predictions[i].className + ": " + predictions[i].probability.toFixed(2);
            if (labelContainer && labelContainer.childNodes[i]) {
                labelContainer.childNodes[i].innerHTML = classPrediction;
            }
        }
    } catch (error) {
        console.error("Error during live prediction:", error);
    }
}

analyzeBtn.addEventListener("click", async () => {
    analyzeImage();

    const predictions = await analyzeImage();
    preview.style.display = "block";
    if (predictions) {
        saveBtn.disabled = false;
    }
});

async function init() {
    await loadModel();
   
    
}



// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
    // Check if required libraries are loaded
    if (typeof tmImage === 'undefined') {
        modelStatus.textContent = "⚠️ Teachable Machine library not loaded. Make sure to include it in your HTML.";
    } else {
        await init();
    }
});

// Clean up when leaving the page
window.addEventListener("beforeunload", () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (webcam) {
        webcam.stop();
    }
});

//Current DateTime Clock
function updateTime() {
    const now = new Date();
    document.getElementById('datetime').innerHTML = now.toLocaleString();
  }
  updateTime(); // Initial call
  setInterval(updateTime, 1000); // Update every second


//Save to database
saveBtn.addEventListener("click", async () => {
    const now = new Date();
    const detectedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    
    // Get the highest probability prediction
    const predictions = await model.predict(processCanvas);
    let highestPrediction = { className: "", probability: 0 };
    
    for (let i = 0; i < predictions.length; i++) {
        if (predictions[i].probability > highestPrediction.probability) {
            highestPrediction = predictions[i];
        }
    }
    
    // Determine symptom text
    const symptom = highestPrediction.className === "stroke" && 
                   highestPrediction.probability >= 0.5 ? 
                   "Stroke detected" : "No stroke detected";
    
    try {
        const response = await fetch('insert_record.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `symptom=${encodeURIComponent(symptom)}&detected_At=${encodeURIComponent(detectedAt)}`
        });
        
        const result = await response.text();
        console.log('Save result:', result);
        alert(result); // Show the success message with record ID
        saveBtn.disabled = true; // Disable save button after successful save
    } catch (error) {
        console.error('Error saving record:', error);
        alert('Error saving record');
    }
});