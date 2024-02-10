const video = document.getElementById("video");
let savedDescriptors = [];
let isChecking = false;

const startCam = () => {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        detectFace();
      };
    })
    .catch((err) => {
      console.log(err);
    });
};

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
]).then(startCam);

const detectFace = async () => {
  const videoEl = document.getElementById("video");
  const canvas = faceapi.createCanvasFromMedia(videoEl);
  document.body.append(canvas);
  const displaySize = {
    width: videoEl.width,
    height: videoEl.height,
  };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    if (!isChecking) {
      isChecking = true;
      const detections = await faceapi
        .detectAllFaces(videoEl, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        console.log("Лицо обнаружено!");
        let isNewFace = true;
        for (const detection of detections) {
          for (const savedDescriptor of savedDescriptors) {
            if (compareDescriptors(savedDescriptor, detection.descriptor)) {
              //   console.log(savedDescriptors);
              console.log("Это уже известное лицо!");
              isNewFace = false;
              break;
            }
          }
          if (isNewFace) {
            savedDescriptors.push(detection.descriptor);
            console.log("Новое лицо сохранено!");
          }
        }
      }
      isChecking = false;
    }
  }, 1000);
};

const compareDescriptors = (descriptor1, descriptor2) => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  const threshold = 0.8;
  return distance < threshold;
};

console.log(savedDescriptors);
