
#!/usr/bin/env python3
"""
Enhanced OCR service for license plate recognition from actual camera feed
"""

import cv2
import pytesseract
import numpy as np
import json
import sys
import time
import requests
from urllib.parse import quote
import re

class LicensePlateOCR:
    def __init__(self, camera_ip="10.10.10.146", username="admin", password="admin123"):
        self.camera_ip = camera_ip
        self.username = username
        self.password = password
        self.rtsp_url = f"rtsp://{username}:{password}@{camera_ip}:554/cam/realmonitor?channel=1&subtype=0"
        
    def capture_frame_from_camera(self):
        """Capture frame directly from camera using multiple methods"""
        
        # Method 1: Try various camera snapshot APIs (more comprehensive list)
        snapshot_urls = [
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/snapshot.cgi",
            f"http://{self.username}:{self.password}@{self.camera_ip}/snapshot.jpg",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/currentpic.cgi",
            f"http://{self.username}:{self.password}@{self.camera_ip}/image.jpg",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/snapshot.cgi?channel=1",
            f"http://{self.username}:{self.password}@{self.camera_ip}/Streaming/Channels/1/picture",
            f"http://{self.username}:{self.password}@{self.camera_ip}/ISAPI/Streaming/channels/101/picture",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=wuuPhkmUCeI9WG7C&user={self.username}&password={self.password}"
        ]
        
        for url in snapshot_urls:
            try:
                print(f"Trying snapshot URL: {url}")
                response = requests.get(url, timeout=5, stream=True)
                if response.status_code == 200 and len(response.content) > 1000:
                    nparr = np.frombuffer(response.content, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is not None and frame.shape[0] > 100 and frame.shape[1] > 100:
                        print(f"Successfully captured frame from HTTP: {frame.shape}")
                        return frame
            except Exception as e:
                print(f"HTTP snapshot failed for {url}: {e}")
                continue
        
        # Method 2: Try enhanced ANPR API endpoints
        anpr_urls = [
            f"http://{self.username}:{self.password}@{self.camera_ip}/ISAPI/Traffic/channels/1/vehicleDetect/plates",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/anpr.cgi",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/anpr/info",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/anpr/latest",
            f"http://{self.username}:{self.password}@{self.camera_ip}/anpr.cgi",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/configManager.cgi?action=getConfig&name=VideoAnalyseRule",
            f"http://{self.username}:{self.password}@{self.camera_ip}/cgi-bin/TrafficSnapshot.cgi",
            f"http://{self.username}:{self.password}@{self.camera_ip}/ISAPI/Smart/channels/1/vehicleDetect"
        ]
        
        for url in anpr_urls:
            try:
                print(f"Trying ANPR API: {url}")
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    anpr_data = response.text
                    print(f"ANPR response: {anpr_data[:200]}...")
                    
                    # Enhanced plate number extraction patterns
                    plate_patterns = [
                        r'<licensePlate[^>]*>([A-Z0-9\-\s]+)</licensePlate>',
                        r'"licensePlate"\s*:\s*"([A-Z0-9\-\s]+)"',
                        r'"plateNumber"\s*:\s*"([A-Z0-9\-\s]+)"',
                        r'"plate"\s*:\s*"([A-Z0-9\-\s]+)"',
                        r'plate["\s]*[:=]["\s]*([A-Z0-9\-\s]+)',
                        r'number["\s]*[:=]["\s]*([A-Z0-9\-\s]+)',
                        r'licensePlate["\s]*[:=]["\s]*([A-Z0-9\-\s]+)',
                        r'([A-Z]{2,3}[\-\s]?\d{3,4})',
                        r'([A-Z]{1,2}\d{1,4}[A-Z]{1,2})',
                        r'(\d{1,3}[\-\s]?[A-Z]{2,3}[\-\s]?\d{1,4})',
                        r'([A-Z0-9]{5,8})'
                    ]
                    
                    for pattern in plate_patterns:
                        matches = re.findall(pattern, anpr_data, re.IGNORECASE)
                        if matches:
                            plate_number = matches[0].upper().strip().replace(' ', '').replace('-', '')
                            if len(plate_number) >= 4:
                                print(f"Found plate via ANPR API: {plate_number}")
                                return {"anpr_result": plate_number}
                            
            except Exception as e:
                print(f"ANPR API failed for {url}: {e}")
                continue
        
        # Method 3: Try RTSP stream capture with better parameters
        try:
            print(f"Trying RTSP: {self.rtsp_url}")
            cap = cv2.VideoCapture(self.rtsp_url)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FPS, 25)
            
            # Try to read frames (skip first few to get fresh frame)
            for i in range(8):
                ret, frame = cap.read()
                if ret and frame is not None:
                    if i >= 3:  # Use frame after skipping first 3
                        print(f"Successfully captured RTSP frame: {frame.shape}")
                        cap.release()
                        return frame
                time.sleep(0.1)
            cap.release()
        except Exception as e:
            print(f"RTSP capture failed: {e}")
            
        return None
    
    def detect_license_plates(self, image):
        """Enhanced license plate detection with multiple approaches"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply multiple preprocessing techniques
        preprocessed_images = []
        
        # Method 1: Edge detection
        edges = cv2.Canny(gray, 50, 200, apertureSize=3)
        preprocessed_images.append(("edges", edges))
        
        # Method 2: Adaptive threshold
        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        preprocessed_images.append(("adaptive", adaptive))
        
        # Method 3: Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morph = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
        preprocessed_images.append(("morph", morph))
        
        all_candidates = []
        
        for method_name, processed_img in preprocessed_images:
            try:
                contours, _ = cv2.findContours(processed_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for contour in contours:
                    x, y, w, h = cv2.boundingRect(contour)
                    aspect_ratio = w / h if h > 0 else 0
                    area = cv2.contourArea(contour)
                    
                    # Enhanced license plate criteria
                    if (1.5 <= aspect_ratio <= 8.0 and 
                        area > 300 and 
                        w > 40 and h > 10 and
                        w < image.shape[1] * 0.8 and
                        h < image.shape[0] * 0.5):
                        all_candidates.append((x, y, w, h, area, method_name))
            except Exception as e:
                print(f"Error in {method_name} detection: {e}")
                continue
        
        # Sort by area and return top candidates
        all_candidates.sort(key=lambda x: x[4], reverse=True)
        return all_candidates[:5]
    
    def preprocess_plate_region(self, image, region):
        """Enhanced preprocessing for better OCR"""
        x, y, w, h = region[:4]
        roi = image[y:y+h, x:x+w]
        
        if roi.shape[0] == 0 or roi.shape[1] == 0:
            return None
        
        # Resize if too small
        if roi.shape[0] < 40 or roi.shape[1] < 120:
            scale_factor = max(40 / roi.shape[0], 120 / roi.shape[1])
            new_width = int(roi.shape[1] * scale_factor)
            new_height = int(roi.shape[0] * scale_factor)
            roi = cv2.resize(roi, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # Convert to grayscale
        if len(roi.shape) == 3:
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        else:
            gray = roi
        
        # Apply multiple preprocessing techniques
        processed_versions = []
        
        # Version 1: Standard preprocessing
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        processed_versions.append(thresh1)
        
        # Version 2: Inverted threshold
        _, thresh2 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        processed_versions.append(thresh2)
        
        # Version 3: Adaptive threshold
        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        processed_versions.append(adaptive)
        
        # Version 4: Enhanced contrast
        enhanced = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(gray)
        _, thresh3 = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        processed_versions.append(thresh3)
        
        return processed_versions
    
    def extract_text_from_region(self, processed_images):
        """Extract text using OCR with multiple configurations and preprocessing"""
        
        if not processed_images:
            return "", 0
        
        # Enhanced OCR configurations
        configs = [
            '--oem 3 --psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            '--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            '--oem 3 --psm 13 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            '--oem 3 --psm 8',
            '--oem 3 --psm 7',
            '--oem 3 --psm 6'
        ]
        
        best_text = ""
        best_confidence = 0
        
        for processed_image in processed_images:
            for config in configs:
                try:
                    # Get text with confidence
                    data = pytesseract.image_to_data(processed_image, config=config, output_type=pytesseract.Output.DICT)
                    
                    # Extract text and calculate confidence
                    words = []
                    confidences = []
                    
                    for i in range(len(data['text'])):
                        if int(data['conf'][i]) > 30:  # Confidence threshold
                            text = data['text'][i].strip()
                            if text:
                                words.append(text)
                                confidences.append(int(data['conf'][i]))
                    
                    if words:
                        full_text = ''.join(words).upper()
                        # Clean text - only alphanumeric
                        full_text = ''.join(c for c in full_text if c.isalnum())
                        
                        if len(full_text) >= 3:
                            avg_confidence = sum(confidences) / len(confidences) / 100.0
                            
                            # Boost confidence for patterns that look like license plates
                            if re.match(r'^[A-Z]{2,3}\d{3,4}$', full_text) or re.match(r'^\d{1,3}[A-Z]{2,3}\d{1,4}$', full_text):
                                avg_confidence += 0.3
                            elif any(c.isdigit() for c in full_text) and any(c.isalpha() for c in full_text):
                                avg_confidence += 0.2
                            
                            if avg_confidence > best_confidence:
                                best_text = full_text
                                best_confidence = avg_confidence
                                
                except Exception as e:
                    continue
        
        return best_text, best_confidence
    
    def process_license_plate(self):
        """Main processing function with enhanced error handling"""
        try:
            print("Starting license plate recognition...")
            
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
                    "error": "Could not capture frame from camera. Please check camera connection and network accessibility.",
                    "timestamp": time.time()
                }
            
            print(f"Frame captured, size: {frame.shape}")
            
            # Detect license plate regions
            plate_regions = self.detect_license_plates(frame)
            print(f"Found {len(plate_regions)} potential plate regions")
            
            if not plate_regions:
                # If no specific regions detected, try full image OCR on smaller sections
                print("No plate regions detected, trying sectional full image OCR")
                h, w = frame.shape[:2]
                
                # Try different sections of the image
                sections = [
                    (0, h//3, w, h//3),  # Middle horizontal strip
                    (w//4, h//4, w//2, h//2),  # Center quarter
                    (0, 0, w, h)  # Full image as last resort
                ]
                
                best_text = ""
                best_confidence = 0
                
                for sx, sy, sw, sh in sections:
                    section = frame[sy:sy+sh, sx:sx+sw]
                    processed_versions = self.preprocess_plate_region(section, (0, 0, sw, sh))
                    if processed_versions:
                        text, confidence = self.extract_text_from_region(processed_versions)
                        if confidence > best_confidence:
                            best_text = text
                            best_confidence = confidence
            else:
                # Process each detected region
                best_text = ""
                best_confidence = 0
                
                for i, region in enumerate(plate_regions):
                    print(f"Processing region {i+1}: {region}")
                    processed_versions = self.preprocess_plate_region(frame, region)
                    if processed_versions:
                        text, confidence = self.extract_text_from_region(processed_versions)
                        print(f"Region {i+1} result: '{text}' (confidence: {confidence:.2f})")
                        
                        if confidence > best_confidence:
                            best_text = text
                            best_confidence = confidence
            
            print(f"Final result: '{best_text}' (confidence: {best_confidence:.2f})")
            
            if best_text and len(best_text) >= 3:
                return {
                    "success": True,
                    "plateNumber": best_text,
                    "confidence": best_confidence,
                    "timestamp": time.time(),
                    "method": "computer_vision_ocr"
                }
            else:
                return {
                    "success": False,
                    "error": "No license plate text could be detected. Please ensure vehicle is properly positioned with license plate clearly visible in camera view.",
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
