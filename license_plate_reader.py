#!/usr/bin/env python3
"""
License Plate Recognition Service
Captures frames from RTSP camera and performs OCR to detect license plates
"""

import cv2
import pytesseract
import numpy as np
import re
import sys
import json
from PIL import Image
import requests
from io import BytesIO
import time

class LicensePlateReader:
    def __init__(self, camera_ip="10.10.10.146", username="admin", password="admin123"):
        self.camera_ip = camera_ip
        self.username = username
        self.password = password
        self.rtsp_url = f"rtsp://{username}:{password}@{camera_ip}:554/cam/realmonitor?channel=1&subtype=0"
        
    def preprocess_image(self, image):
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply threshold to get binary image
        _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Morphological operations to clean up the image
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Resize image for better OCR
        height, width = opening.shape
        if height < 200:
            scale_factor = 200 / height
            new_width = int(width * scale_factor)
            opening = cv2.resize(opening, (new_width, 200), interpolation=cv2.INTER_CUBIC)
        
        return opening
    
    def detect_license_plate_regions(self, image):
        """Detect potential license plate regions using contours"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply edge detection
        edges = cv2.Canny(gray, 30, 200)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        plate_regions = []
        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter contours based on aspect ratio and size
            aspect_ratio = w / h
            area = cv2.contourArea(contour)
            
            # License plates typically have aspect ratio between 2:1 and 5:1
            if 2.0 <= aspect_ratio <= 6.0 and area > 1000:
                plate_regions.append((x, y, w, h))
        
        return plate_regions
    
    def extract_text_from_region(self, image, region):
        """Extract text from a specific region of the image"""
        x, y, w, h = region
        roi = image[y:y+h, x:x+w]
        
        # Preprocess the region
        processed_roi = self.preprocess_image(roi)
        
        # Configure tesseract for license plate recognition
        config = '--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
        
        try:
            text = pytesseract.image_to_string(processed_roi, config=config).strip()
            return self.clean_license_plate_text(text)
        except:
            return ""
    
    def clean_license_plate_text(self, text):
        """Clean and validate license plate text"""
        # Remove extra spaces and newlines
        text = re.sub(r'\s+', '', text)
        
        # Common license plate patterns (adjust based on your region)
        patterns = [
            r'^[A-Z]{2,3}-?\d{3,4}$',  # ABC-1234 or ABC1234
            r'^[A-Z]{1,2}\d{1,4}[A-Z]{1,2}$',  # A123B
            r'^\d{2,4}[A-Z]{2,3}$',  # 1234ABC
            r'^[A-Z]\d{3}[A-Z]{2}$',  # A123BC
        ]
        
        for pattern in patterns:
            if re.match(pattern, text):
                return text
        
        # If no pattern matches but we have alphanumeric text, return it
        if re.match(r'^[A-Z0-9-]{3,8}$', text):
            return text
        
        return ""
    
    def capture_frame_from_rtsp(self):
        """Capture a frame from RTSP stream"""
        cap = cv2.VideoCapture(self.rtsp_url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        try:
            ret, frame = cap.read()
            if ret:
                return frame
        except Exception as e:
            print(f"Error capturing frame: {e}")
        finally:
            cap.release()
        
        return None
    
    def capture_frame_from_mjpeg(self):
        """Alternative: capture frame from MJPEG stream endpoint"""
        try:
            # Use 0.0.0.0 instead of localhost for Replit environment
            response = requests.get(f"http://0.0.0.0:5000/api/stream/1/mjpeg", 
                                  stream=True, timeout=10)
            if response.status_code == 200:
                # Read first frame from MJPEG stream
                data = b''
                for chunk in response.iter_content(chunk_size=1024):
                    data += chunk
                    # Look for JPEG boundaries
                    if b'\xff\xd8' in data and b'\xff\xd9' in data:
                        start = data.find(b'\xff\xd8')
                        end = data.find(b'\xff\xd9', start) + 2
                        jpeg_data = data[start:end]
                        
                        # Convert to OpenCV image
                        nparr = np.frombuffer(jpeg_data, np.uint8)
                        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        if frame is not None:
                            print(f"Successfully captured frame: {frame.shape}")
                            return frame
                        break
        except Exception as e:
            print(f"Error capturing MJPEG frame: {e}")
        
        return None
    
    def read_license_plate(self):
        """Main function to read license plate from camera"""
        # Try MJPEG endpoint first (more reliable in this setup)
        frame = self.capture_frame_from_mjpeg()
        
        # Fallback to direct RTSP if MJPEG fails
        if frame is None:
            frame = self.capture_frame_from_rtsp()
        
        if frame is None:
            return {"success": False, "error": "Could not capture frame from camera"}
        
        # Detect potential license plate regions
        plate_regions = self.detect_license_plate_regions(frame)
        
        best_text = ""
        best_confidence = 0
        
        if plate_regions:
            # Try OCR on detected regions
            for region in plate_regions:
                text = self.extract_text_from_region(frame, region)
                if text and len(text) >= 3:
                    # Simple confidence based on text length and character types
                    confidence = len(text) * 0.1 + (0.5 if re.search(r'\d', text) else 0)
                    if confidence > best_confidence:
                        best_text = text
                        best_confidence = confidence
        
        # If no regions detected, try full image OCR
        if not best_text:
            processed_frame = self.preprocess_image(frame)
            config = '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
            
            try:
                full_text = pytesseract.image_to_string(processed_frame, config=config)
                print(f"Full OCR text: '{full_text}'")
                
                # Look for license plate patterns in full text
                lines = full_text.split('\n')
                for line in lines:
                    cleaned = self.clean_license_plate_text(line.strip())
                    if cleaned:
                        best_text = cleaned
                        best_confidence = 0.7
                        break
                        
                # If still no match, try with different PSM modes
                if not best_text:
                    for psm in [7, 8, 13]:
                        config = f'--oem 3 --psm {psm} -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'
                        try:
                            text = pytesseract.image_to_string(processed_frame, config=config).strip()
                            cleaned = self.clean_license_plate_text(text)
                            if cleaned:
                                best_text = cleaned
                                best_confidence = 0.6
                                break
                        except:
                            continue
                            
            except Exception as e:
                print(f"OCR error: {e}")
        
        if best_text:
            return {
                "success": True,
                "plateNumber": best_text,
                "confidence": best_confidence,
                "timestamp": time.time()
            }
        else:
            return {
                "success": False,
                "error": "No license plate detected",
                "timestamp": time.time()
            }

if __name__ == "__main__":
    reader = LicensePlateReader()
    result = reader.read_license_plate()
    print(json.dumps(result))