#!/usr/bin/env python3
"""
Test script to capture and save a frame for OCR testing
"""

import cv2
import sys
import json
import time

def test_camera_capture():
    # Test with a sample image or create a test pattern
    # For now, create a test image with text
    import numpy as np
    
    # Create a test image with license plate text
    test_image = np.ones((480, 640, 3), dtype=np.uint8) * 255
    
    # Add some text that looks like a license plate
    font = cv2.FONT_HERSHEY_SIMPLEX
    text = "ABC-1234"
    text_size = cv2.getTextSize(text, font, 2, 3)[0]
    text_x = (test_image.shape[1] - text_size[0]) // 2
    text_y = (test_image.shape[0] + text_size[1]) // 2
    
    # Add black rectangle background
    cv2.rectangle(test_image, (text_x-20, text_y-text_size[1]-10), 
                  (text_x+text_size[0]+20, text_y+10), (0, 0, 0), -1)
    
    # Add white text
    cv2.putText(test_image, text, (text_x, text_y), font, 2, (255, 255, 255), 3)
    
    # Save test image
    cv2.imwrite('test_plate.jpg', test_image)
    print("Test image created: test_plate.jpg")
    
    return test_image

if __name__ == "__main__":
    test_camera_capture()