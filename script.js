document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const logContainer = document.getElementById('log');
  const emotionSummaryContainer = document.getElementById('emotion-summary');
  const faceCountElement = document.getElementById('face-count');
  const modelStatusElement = document.getElementById('model-status');
  const startButton = document.getElementById('start-btn');
  const stopButton = document.getElementById('stop-btn');
  const clearLogsButton = document.getElementById('clear-logs-btn');

  const emojis = {
    happy: '😊',
    sad: '😢',
    surprised: '😲',
    neutral: '😐',
    angry: '😠',
  };

  const overallEmotionSummary = {
    happy: 0,
    sad: 0,
    surprised: 0,
    neutral: 0,
    angry: 0,
  };

  const emotionSummary = {
    happy: 0,
    sad: 0,
    surprised: 0,
    neutral: 0,
    angry: 0,
  };

  const attendanceStats = {
    faceDetectedCount: 0,
    frameCount: 0,
  };

  let presentLogs = 0;
  let totalLogs = 0;

  const LOG_TYPE = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    REPORT: 'report',
  };

  let stopDetection = false;

  async function initializeModels() {
    try {
      logMessage('Initializing models...', LOG_TYPE.INFO);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models_1'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models_1'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models_1'),
      ]);
      logMessage('Models successfully loaded.', LOG_TYPE.INFO);
      modelStatusElement.textContent = 'Models Loaded';
      startVideoTracking();
    } catch (error) {
      logMessage(`Error loading models: ${error.message}`, LOG_TYPE.ERROR);
      modelStatusElement.textContent = 'Model Loading Failed';
    }
  }

  function startVideoTracking() {
    logMessage('Attempting to access webcam...', LOG_TYPE.INFO);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
          video.play();

          const scaleFactor = 0.5; // Reduce to 50% of original size
          canvas.width = video.videoWidth * scaleFactor;
          canvas.height = video.videoHeight * scaleFactor;

          logMessage('Webcam feed initialized.', LOG_TYPE.INFO);
          detectFaces();
        });
      })
      .catch((err) => {
        logMessage(`Error accessing webcam: ${err.message}`, LOG_TYPE.ERROR);
        modelStatusElement.textContent = 'Webcam Access Denied';
      });
  }

  async function detectFaces() {
    const context = canvas.getContext('2d');

    async function processFrame() {
      if (stopDetection) return;

      try {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          context.clearRect(0, 0, canvas.width, canvas.height);

          // Preprocess the video frame for low-light conditions
          const frame = preprocessFrame(video, canvas.width, canvas.height);
          context.putImageData(frame, 0, 0);

          const detections = await faceapi
            .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          // Update attendance stats
          attendanceStats.frameCount++;
          if (detections.length > 0) attendanceStats.faceDetectedCount++;

          faceCountElement.textContent = `Faces Detected: ${detections.length}`;
          processEmotions(detections);
        }
      } catch (error) {
        logMessage(`Error detecting faces: ${error.message}`, LOG_TYPE.ERROR);
      }

      if (!stopDetection) {
        requestAnimationFrame(processFrame);
      }
    }

    processFrame();
  }

  function preprocessFrame(video, width, height) {
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;

    // Draw the video frame on the temporary canvas
    tempContext.drawImage(video, 0, 0, width, height);

    // Get the image data
    const imageData = tempContext.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Adjust brightness and contrast
    for (let i = 0; i < data.length; i += 4) {
      // Brightness adjustment
      data[i] = Math.min(data[i] + 50, 255); // Red
      data[i + 1] = Math.min(data[i + 1] + 50, 255); // Green
      data[i + 2] = Math.min(data[i + 2] + 50, 255); // Blue

      // Contrast adjustment
      const contrastFactor = 1.2; // Increase for more contrast
      data[i] = Math.min(((data[i] - 128) * contrastFactor) + 128, 255);
      data[i + 1] = Math.min(((data[i + 1] - 128) * contrastFactor) + 128, 255);
      data[i + 2] = Math.min(((data[i + 2] - 128) * contrastFactor) + 128, 255);
    }

    tempContext.putImageData(imageData, 0, 0);
    return imageData;
  }

  console.log()

  // function preprocessFrame(video, width, height) {
  //   const tempCanvas = document.createElement('canvas');
  //   const tempContext = tempCanvas.getContext('2d');
  //   tempCanvas.width = width;
  //   tempCanvas.height = height;
  
  //   // Draw the video frame on the temporary canvas
  //   tempContext.drawImage(video, 0, 0, width, height);
  
  //   // Get the image data
  //   const imageData = tempContext.getImageData(0, 0, width, height);
  //   const data = imageData.data;
  
  //   // Apply brightness boost and gamma correction
  //   const gamma = 0.6; // Gamma < 1 brightens the image significantly
  //   for (let i = 0; i < data.length; i += 4) {
  //     // Brightness adjustment
  //     data[i] = Math.min(data[i] + 100, 255); // Red
  //     data[i + 1] = Math.min(data[i + 1] + 100, 255); // Green
  //     data[i + 2] = Math.min(data[i + 2] + 100, 255); // Blue
  
  //     // Gamma correction
  //     data[i] = Math.min(255 * Math.pow(data[i] / 255, gamma), 255); // Red
  //     data[i + 1] = Math.min(255 * Math.pow(data[i + 1] / 255, gamma), 255); // Green
  //     data[i + 2] = Math.min(255 * Math.pow(data[i + 2] / 255, gamma), 255); // Blue
  //   }
  
  //   // Adaptive histogram equalization (normalize contrast)
  //   const histogram = new Array(256).fill(0);
  
  //   // Calculate histogram for the brightness levels
  //   for (let i = 0; i < data.length; i += 4) {
  //     const brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]); // Grayscale value
  //     histogram[brightness]++;
  //   }
  
  //   // Calculate cumulative distribution
  //   const cumulativeDist = new Array(256);
  //   cumulativeDist[0] = histogram[0];
  //   for (let i = 1; i < histogram.length; i++) {
  //     cumulativeDist[i] = cumulativeDist[i - 1] + histogram[i];
  //   }
  
  //   // Normalize cumulative distribution
  //   const totalPixels = width * height;
  //   for (let i = 0; i < cumulativeDist.length; i++) {
  //     cumulativeDist[i] = Math.round((cumulativeDist[i] / totalPixels) * 255);
  //   }
  
  //   // Apply equalization to image
  //   for (let i = 0; i < data.length; i += 4) {
  //     const brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]); // Grayscale value
  //     const newBrightness = cumulativeDist[brightness];
  
  //     // Scale RGB values proportionally to maintain color balance
  //     const scale = newBrightness / Math.max(brightness, 1); // Avoid division by zero
  //     data[i] = Math.min(data[i] * scale, 255); // Red
  //     data[i + 1] = Math.min(data[i + 1] * scale, 255); // Green
  //     data[i + 2] = Math.min(data[i + 2] * scale, 255); // Blue
  //   }
  
  //   tempContext.putImageData(imageData, 0, 0);
  //   return imageData;
  // }

  console.log()

  // function preprocessFrame(video, width, height) {
  //   const tempCanvas = document.createElement('canvas');
  //   const tempContext = tempCanvas.getContext('2d');
  //   tempCanvas.width = width;
  //   tempCanvas.height = height;
  
  //   // Draw the video frame on the temporary canvas
  //   tempContext.drawImage(video, 0, 0, width, height);
  
  //   // Get the image data
  //   const imageData = tempContext.getImageData(0, 0, width, height);
  //   const data = imageData.data;
  
  //   // Calculate average brightness for dynamic adjustments
  //   let avgBrightness = 0;
  //   for (let i = 0; i < data.length; i += 4) {
  //     const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  //     avgBrightness += brightness;
  //   }
  //   avgBrightness /= (data.length / 4);
  
  //   // Dynamic brightness and contrast adjustment
  //   const brightnessBoost = avgBrightness < 50 ? 120 : 80; // Aggressive boost for dark frames
  //   const gamma = avgBrightness < 50 ? 0.5 : 0.8; // More aggressive gamma correction for darker frames
  
  //   for (let i = 0; i < data.length; i += 4) {
  //     // Brightness adjustment
  //     data[i] = Math.min(data[i] + brightnessBoost, 255); // Red
  //     data[i + 1] = Math.min(data[i + 1] + brightnessBoost, 255); // Green
  //     data[i + 2] = Math.min(data[i + 2] + brightnessBoost, 255); // Blue
  
  //     // Gamma correction
  //     data[i] = Math.min(255 * Math.pow(data[i] / 255, gamma), 255); // Red
  //     data[i + 1] = Math.min(255 * Math.pow(data[i + 1] / 255, gamma), 255); // Green
  //     data[i + 2] = Math.min(255 * Math.pow(data[i + 2] / 255, gamma), 255); // Blue
  //   }
  
  //   // Apply Gaussian blur for noise reduction
  //   const blurredData = applyGaussianBlur(imageData, width, height);
  
  //   tempContext.putImageData(blurredData, 0, 0);
  //   return tempContext.getImageData(0, 0, width, height);
  // }
  
  // Gaussian Blur Implementation
  // function applyGaussianBlur(imageData, width, height) {
  //   const kernel = [
  //     [1, 4, 7, 4, 1],
  //     [4, 16, 26, 16, 4],
  //     [7, 26, 41, 26, 7],
  //     [4, 16, 26, 16, 4],
  //     [1, 4, 7, 4, 1],
  //   ];
  
  //   const kernelSum = kernel.flat().reduce((sum, value) => sum + value, 0);
  
  //   const tempCanvas = document.createElement('canvas');
  //   const tempContext = tempCanvas.getContext('2d');
  //   tempCanvas.width = width;
  //   tempCanvas.height = height;
  
  //   tempContext.putImageData(imageData, 0, 0);
  
  //   const pixels = tempContext.getImageData(0, 0, width, height);
  //   const output = new Uint8ClampedArray(pixels.data);
  
  //   for (let y = 2; y < height - 2; y++) {
  //     for (let x = 2; x < width - 2; x++) {
  //       const pixelIndex = (y * width + x) * 4;
  
  //       let r = 0,
  //         g = 0,
  //         b = 0;
  
  //       for (let ky = -2; ky <= 2; ky++) {
  //         for (let kx = -2; kx <= 2; kx++) {
  //           const weight = kernel[ky + 2][kx + 2];
  //           const neighborIndex = ((y + ky) * width + (x + kx)) * 4;
  
  //           r += pixels.data[neighborIndex] * weight;
  //           g += pixels.data[neighborIndex + 1] * weight;
  //           b += pixels.data[neighborIndex + 2] * weight;
  //         }
  //       }
  
  //       output[pixelIndex] = r / kernelSum; // Red
  //       output[pixelIndex + 1] = g / kernelSum; // Green
  //       output[pixelIndex + 2] = b / kernelSum; // Blue
  //     }
  //   }
  
  //   const blurredImageData = new ImageData(output, width, height);
  //   return blurredImageData;
  // }
  
  

  function processEmotions(detections) {
    detections.forEach((detection) => {
      const expressions = detection.expressions;
      const dominantEmotion = Object.entries(expressions)
        .filter(([key, value]) => key in emotionSummary && value > 0.5)
        .sort((a, b) => b[1] - a[1])[0];

      if (dominantEmotion) {
        const [emotion] = dominantEmotion;
        emotionSummary[emotion]++;
        overallEmotionSummary[emotion]++;
      }
    });

    renderEmotionSummary();
  }

  function renderEmotionSummary() {
    emotionSummaryContainer.innerHTML = '';
    Object.entries(emotionSummary).forEach(([emotion, count]) => {
      const card = document.createElement('div');
      card.classList.add('emotion-card');
      card.innerHTML = `
        <div class="emoji">${emojis[emotion]}</div>
        <div class="emotion-name">${capitalizeFirstLetter(emotion)}</div>
        <div class="emotion-count">${count}</div>
      `;
      emotionSummaryContainer.appendChild(card);
    });
  }

  // Log every 10 seconds
  setInterval(() => {
    if (!stopDetection) {
      const totalEmotionCount = Object.values(emotionSummary).reduce((sum, count) => sum + count, 0);
      const emotionPercentages = Object.entries(emotionSummary)
        .map(([emotion, count]) => {
          const percentage = totalEmotionCount ? ((count / totalEmotionCount) * 100).toFixed(1) : 0;
          return `${capitalizeFirstLetter(emotion)}: ${percentage}% ${emojis[emotion]}`;
        })
        .join(', ');

      const attendancePercentage = (attendanceStats.faceDetectedCount / attendanceStats.frameCount) * 100;
      const isPresent = attendancePercentage >= 10;

      logMessage(
        `Emotion Summary: ${emotionPercentages}, Attendance: ${attendancePercentage.toFixed(
          1
        )}% ${isPresent ? '✅ Present' : '❌ Absent'}`,
        LOG_TYPE.INFO
      );

      if (isPresent) presentLogs++;
      totalLogs++;

      // Reset stats for next interval
      Object.keys(emotionSummary).forEach((key) => (emotionSummary[key] = 0));
      attendanceStats.faceDetectedCount = 0;
      attendanceStats.frameCount = 0;
    }
  }, 10000);

  function generateSummaryReport() {
    const totalEmotionCount = Object.values(overallEmotionSummary).reduce((sum, count) => sum + count, 0);
    const overallEmotionPercentages = Object.entries(overallEmotionSummary)
      .map(([emotion, count]) => {
        const percentage = totalEmotionCount ? ((count / totalEmotionCount) * 100).toFixed(1) : 0;
        return `${capitalizeFirstLetter(emotion)}: ${percentage}% ${emojis[emotion]}`;
      })
      .join(', ');

    const overallAttendancePercentage = (presentLogs / totalLogs) * 100;
    const attendanceStatus = overallAttendancePercentage > 50 ? '✅ Present' : '❌ Absent';

    logMessage(
      `Final Summary Report: ${overallEmotionPercentages}, Overall Attendance: ${attendanceStatus}`,
      LOG_TYPE.REPORT
    );
  }

  function logMessage(message, type = LOG_TYPE.INFO) {
    if (logContainer.childNodes.length > 50) {
      logContainer.removeChild(logContainer.lastChild);
    }

    const logEntry = document.createElement('div');
    logEntry.classList.add('log-message', `log-${type}`);

    if (logContainer.childNodes.length % 2 === 0) {
      logEntry.classList.add('even-log'); // Even logs
    } else {
      logEntry.classList.add('odd-log'); // Odd logs
    }

    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.prepend(logEntry);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  startButton.addEventListener('click', () => {
    stopDetection = false;
    logMessage('Face detection started.', LOG_TYPE.INFO);
    detectFaces();
  });

  stopButton.addEventListener('click', () => {
    stopDetection = true;
    logMessage('Face detection stopped.', LOG_TYPE.WARNING);
    generateSummaryReport();
  });

  clearLogsButton.addEventListener('click', () => {
    logContainer.innerHTML = '';
    logMessage('Logs cleared.', LOG_TYPE.INFO);
  });

  initializeModels();
});
