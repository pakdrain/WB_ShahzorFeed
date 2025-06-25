#!/usr/bin/env python3
"""
Real OCR service for license plate recognition from actual camera feed
"""

import cv2
import pytesseract
import numpy as np
import json
import sys
import time
import requests
from urllib.parse import quote

class LicensePlateOCR:
    def __init__(self, camera_ip="10.10.10.146", username="admin", password="admin123"):
        self.camera_ip = camera_ip
        self.username = username
        self.password = password
        self.rtsp_url = f"rtsp://{username}:{password}@{camera_ip}:554/cam/realmonitor?channel=1&subtype=0"
        
    def capture_frame_from_camera(self):
        """Capture frame directly from camera using multiple methods"""
        
        # Method 1: Try camera's built-in snapshot API
        snapshot_urls = [
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/snapshot.cgi",
            f"http://{self.username}:{self.password}@{self.camera_ip}/snapshot.jpg",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/currentpic.cgi",
            f"http://{self.username}:{self.password}@{self.camera_ip}/image.jpg"
        ]
        
        for url in snapshot_urls:
            try:
                print(f"Trying snapshot URL: {url}")
                response = requests.get(url, timeout=3)
                if response.status_code == 200 and len(response.content) > 1000:  # Valid image should be larger
                    nparr = np.frombuffer(response.content, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is not None:
                        print(f"Successfully captured frame from HTTP: {frame.shape}")
                        return frame
            except Exception as e:
                print(f"HTTP snapshot failed for {url}: {e}")
                continue
        
        # Method 2: Try RTSP stream capture
        try:
            print(f"Trying RTSP: {self.rtsp_url}")
            cap = cv2.VideoCapture(self.rtsp_url)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            # Try to read frames (skip first few to get fresh frame)
            for i in range(5):
                ret, frame = cap.read()
                if ret and frame is not None:
                    if i >= 2:  # Use frame after skipping first 2
                        print(f"Successfully captured RTSP frame: {frame.shape}")
                        cap.release()
                        return frame
            cap.release()
        except Exception as e:
            print(f"RTSP capture failed: {e}")
        
        # Method 3: Try camera's ANPR API if available
        anpr_urls = [
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/anpr/info",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/anpr/latest",
            f"http://{self.username}:{self.password}@{self.camera_ip}/anpr.cgi"
        ]
        
        for url in anpr_urls:
            try:
                print(f"Trying ANPR API: {url}")
                response = requests.get(url, timeout=3)
                if response.status_code == 200:
                    # Try to parse ANPR response
                    anpr_data = response.text
                    print(f"ANPR response: {anpr_data}")
                    
                    # Look for license plate in response
                    import re
                    plate_patterns = [
                        r'plate["\s]*[:=]["\s]*([A-Z0-9-]+)',
                        r'number["\s]*[:=]["\s]*([A-Z0-9-]+)',
                        r'licensePlate["\s]*[:=]["\s]*([A-Z0-9-]+)',
                        r'([A-Z]{2,3}-?\d{3,4})',
                        r'([A-Z]{1,2}\d{1,4}[A-Z]{1,2})'
                    ]
                    
                    for pattern in plate_patterns:
                        matches = re.findall(pattern, anpr_data, re.IGNORECASE)
                        if matches:
                            plate_number = matches[0].upper()
                            print(f"Found plate via ANPR API: {plate_number}")
                            return {"anpr_result": plate_number}
                            
            except Exception as e:
                print(f"ANPR API failed for {url}: {e}")
                continue
        
        # Method 4: Try connecting via local server's stream endpoint
        try:
            print("Trying local server stream...")
            response = requests.get("http://127.0.0.1:5000/api/stream/1/mjpeg", 
                                  stream=True, timeout=5)
            if response.status_code == 200:
                # Read MJPEG stream
                data = b''
                for chunk in response.iter_content(chunk_size=1024):
                    data += chunk
                    if b'\xff\xd8' in data and b'\xff\xd9' in data:
                        start = data.find(b'\xff\xd8')
                        end = data.find(b'\xff\xd9', start) + 2
                        jpeg_data = data[start:end]
                        
                        nparr = np.frombuffer(jpeg_data, np.uint8)
                        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                        if frame is not None:
                            print(f"Successfully captured from local stream: {frame.shape}")
                            return frame
                        break
        except Exception as e:
            print(f"Local stream capture failed: {e}")
            
        return None
    
    def detect_license_plates(self, image):
        """Detect license plate regions in the image"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        plate_candidates = []
        
        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / h
            area = cv2.contourArea(contour)
            
            # License plate criteria: aspect ratio 2-6, minimum area
            if 2.0 <= aspect_ratio <= 6.0 and area > 500 and w > 50 and h > 15:
                plate_candidates.append((x, y, w, h, area))
        
        # Sort by area (largest first)
        plate_candidates.sort(key=lambda x: x[4], reverse=True)
        
        return plate_candidates[:3]  # Return top 3 candidates
    
    def preprocess_plate_region(self, image, region):
        """Preprocess plate region for better OCR"""
        x, y, w, h = region[:4]
        roi = image[y:y+h, x:x+w]
        
        # Resize if too small
        if roi.shape[0] < 30 or roi.shape[1] < 80:
            scale_factor = max(30 / roi.shape[0], 80 / roi.shape[1])
            new_width = int(roi.shape[1] * scale_factor)
            new_height = int(roi.shape[0] * scale_factor)
            roi = cv2.resize(roi, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Convert to grayscale
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Apply threshold
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        return processed
    
    def extract_text_from_region(self, processed_image):
        """Extract text using OCR with multiple configurations"""
        
        # Different OCR configurations to try
        configs = [
            '--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            '--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            '--oem 3 --psm 13'
        ]
        
        best_text = ""
        best_confidence = 0
        
        for config in configs:
            try:
                text = pytesseract.image_to_string(processed_image, config=config).strip()
                # Clean text
                text = ''.join(c for c in text.upper() if c.isalnum() or c in '-')
                
                if len(text) >= 3:  # Minimum reasonable plate length
                    # Simple confidence based on length and character mix
                    confidence = min(len(text) * 0.1, 1.0)
                    if any(c.isdigit() for c in text) and any(c.isalpha() for c in text):
                        confidence += 0.2
                    
                    if confidence > best_confidence:
                        best_text = text
                        best_confidence = confidence
                        
            except Exception as e:
                print(f"OCR config failed: {e}")
                continue
        
        return best_text, best_confidence
    
    def process_license_plate(self):
        """Main processing function"""
        try:
            # Capture frame from camera
            frame_or_anpr = self.capture_frame_from_camera()
            
            # Check if we got ANPR result directly
            if isinstance(frame_or_anpr, dict) and "anpr_result" in frame_or_anpr:
                return {
                    "success": True,
                    "plateNumber": frame_or_anpr["anpr_result"],
                    "confidence": 0.95,
                    "timestamp": time.time(),
                    "method": "camera_anpr_api"
                }
            
            frame = frame_or_anpr
            if frame is None:
                return {
                    "success": False,
                    "error": "Could not capture frame from camera. Please check camera connection and ensure it's accessible from this network.",
                    "timestamp": time.time()
                }
            
            # Detect license plate regions
            plate_regions = self.detect_license_plates(frame)
            
            if not plate_regions:
                # If no specific regions detected, try full image OCR
                print("No plate regions detected, trying full image OCR")
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                text, confidence = self.extract_text_from_region(gray)
            else:
                # Process each detected region
                best_text = ""
                best_confidence = 0
                
                for region in plate_regions:
                    processed_region = self.preprocess_plate_region(frame, region)
                    text, confidence = self.extract_text_from_region(processed_region)
                    
                    if confidence > best_confidence:
                        best_text = text
                        best_confidence = confidence
                
                text = best_text
                confidence = best_confidence
            
            if text and len(text) >= 3:
                return {
                    "success": True,
                    "plateNumber": text,
                    "confidence": confidence,
                    "timestamp": time.time(),
                    "method": "computer_vision_ocr"
                }
            else:
                return {
                    "success": False,
                    "error": "No license plate text could be detected in the image. Camera may not be showing a clear view of license plates.",
                    "timestamp": time.time()
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"OCR processing error: {str(e)}",
                "timestamp": time.time()
            }

def main():
    ocr = LicensePlateOCR()
    result = ocr.process_license_plate()
    print(json.dumps(result))

if __name__ == "__main__":
    main()