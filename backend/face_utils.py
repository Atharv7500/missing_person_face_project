import os
import cv2
import numpy as np
import requests
import io
from PIL import Image

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# OpenCV Deep Learning Face Detector (SSD ResNet10)
DETECTOR_CFG = os.path.join(MODEL_DIR, "deploy.prototxt")
DETECTOR_WEIGHTS = os.path.join(MODEL_DIR, "res10_300x300_ssd_iter_140000.caffemodel")

# OpenFace 128-D Embedding Model (Torch format supported by OpenCV DNN)
EMBEDDED_MODEL = os.path.join(MODEL_DIR, "openface.nn4.small2.v1.t7")

def _download_file(url, path):
    if not os.path.exists(path):
        print(f"Downloading {os.path.basename(path)}...")
        r = requests.get(url, stream=True)
        r.raise_for_status()
        with open(path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

# Download necessary files to run native OpenCV DNN
_download_file("https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt", DETECTOR_CFG)
_download_file("https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20180205_fp16/res10_300x300_ssd_iter_140000_fp16.caffemodel", DETECTOR_WEIGHTS)
# We use a reliable source for the openface model
_download_file("https://storage.cmusatyalab.org/openface-models/nn4.small2.v1.t7", EMBEDDED_MODEL)

# Load networks globally
detector = cv2.dnn.readNetFromCaffe(DETECTOR_CFG, DETECTOR_WEIGHTS)
embedder = cv2.dnn.readNetFromTorch(EMBEDDED_MODEL)

def get_face_encoding(image_bytes: bytes) -> list[float] | None:
    try:
        # 1. Decode image bytes into an OpenCV matrix (BGR format)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None:
            return None

        (h, w) = image.shape[:2]

        # 2. Detect Face
        # construct a blob from the image
        blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
        detector.setInput(blob)
        detections = detector.forward()

        # Check if at least one face was found
        if detections.shape[2] == 0:
            return None

        # Find the detection with the highest confidence
        i = np.argmax(detections[0, 0, :, 2])
        confidence = detections[0, 0, i, 2]

        if confidence < 0.5:
            return None # Face not confident enough

        # Compute bounding box
        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        (startX, startY, endX, endY) = box.astype("int")

        # Extract the face ROI (Region of Interest)
        face = image[startY:endY, startX:endX]
        if face.shape[0] < 20 or face.shape[1] < 20:
            return None # Face too small

        # 3. Get 128-d Embedding using OpenFace via OpenCV
        # OpenFace expects 96x96 images
        faceBlob = cv2.dnn.blobFromImage(face, 1.0 / 255, (96, 96), (0, 0, 0), swapRB=True, crop=False)
        embedder.setInput(faceBlob)
        vec = embedder.forward()
        
        # Flatten and return as a list of 128 floats
        return vec.flatten().tolist()
    except Exception as e:
        print(f"[OpenCV Face] Warning: Could not extract face. {e}")
        return None
