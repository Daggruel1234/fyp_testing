<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stroke Detection</title>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
    <p id="datetime" name="datetime"></p>
        <h1>Stroke Detection</h1>
        <p class="status" id="modelStatus">Loading model...</p>
        <div class="controls" action="insert_record.php" method="post">
            <button id="startCamera">Start Camera</button>
            <button id="stopCamera">Stop Camera</button>
            <button id="capture" disabled>Capture Image</button>
            <button id="analyze" disabled>Analyze</button>
            <button id="saveBtn" disabled>Save Result</button>
        </div>
        
        <video id="video" width="300" height="300" autoplay></video>
        
        <div class="preview" style="display: none;">
            <h3>Captured Image</h3>
            <canvas id="previewCanvas" width="224" height="224"></canvas>
        </div>
        
        <canvas id="processCanvas" width="224" height="224" style="display: none"></canvas>
        <p id="result">Ready for analysis</p>
        
        <div id="label-container"></div>
    </div>

   
    <script src="script.js"></script>
</body>
</html>

