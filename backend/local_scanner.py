import os
import sys
import asyncio
import cv2
import numpy as np

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import AsyncSessionLocal
from models import MissingPerson
from sqlalchemy import select
from face_utils import detector, embedder

async def load_known_faces():
    """Load all registered persons and their encodings from DB."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(MissingPerson).where(MissingPerson.encoding != None))
        persons = result.scalars().all()
        return persons

def main():
    print("Loading registry database...")
    persons = asyncio.run(load_known_faces())
    if not persons:
        print("No registered persons with face encodings found in the database. Please register someone first.")
        return
        
    print(f"Loaded {len(persons)} persons from the database.")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return
        
    print("Starting webcam... Press 'q' to quit.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        (h, w) = frame.shape[:2]
        
        # Detect Face using OpenCV DNN
        blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
        detector.setInput(blob)
        detections = detector.forward()
        
        # Loop over all detected faces
        for i in range(0, detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            # Confidence threshold to confirm it's actually a face
            if confidence > 0.3:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                (startX, startY, endX, endY) = box.astype("int")
                
                # Clamp coordinates to frame geometry
                startX = max(0, startX)
                startY = max(0, startY)
                endX = max(0, min(w, endX))
                endY = max(0, min(h, endY))
                
                face = frame[startY:endY, startX:endX]
                if face.shape[0] < 20 or face.shape[1] < 20:
                    continue
                    
                # Get the 128-D embedding using OpenFace via OpenCV
                faceBlob = cv2.dnn.blobFromImage(cv2.resize(face, (96, 96)), 1.0 / 255, (96, 96), (0, 0, 0), swapRB=True, crop=False)
                embedder.setInput(faceBlob)
                vec = embedder.forward().flatten()
                
                # Compare against all known people using L2 Euclidean Distance
                best_distance = float('inf')
                best_match = None
                
                for p in persons:
                    known_vec = np.array(p.encoding)
                    dist = np.linalg.norm(known_vec - vec)
                    if dist < best_distance:
                        best_distance = dist
                        best_match = p
                
                conf_pct = max(0.0, 1.0 - best_distance) * 100
                color = (0, 0, 255) # Red for unknown
                label = "Unknown"
                
                # Match Threshold Check
                if best_distance < 0.6 and best_match is not None:
                    color = (0, 255, 0) # Green for Match
                    label = f"MATCH: {best_match.name} ({conf_pct:.1f}%)"
                    
                # Draw Box and Display Label
                cv2.rectangle(frame, (startX, startY), (endX, endY), color, 2)
                
                (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                cv2.rectangle(frame, (startX, startY - 20), (max(endX, startX + label_w), startY), color, -1)
                cv2.putText(frame, label, (startX + 5, startY - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        # Show Output Stream
        cv2.imshow("Live Native OpenCV Scanner", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
