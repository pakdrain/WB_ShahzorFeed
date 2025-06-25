#!/usr/bin/env python3
"""
Test script to check camera ANPR API endpoints
"""

import requests
import json

camera_ip = "10.10.10.146"
username = "admin"
password = "admin123"

# Common ANPR API endpoints for IP cameras
anpr_endpoints = [
    f"http://{username}:{password}@{camera_ip}/cgi-bin/anpr/info",
    f"http://{username}:{password}@{camera_ip}/cgi-bin/anpr/latest",
    f"http://{username}:{password}@{camera_ip}/anpr.cgi",
    f"http://{username}:{password}@{camera_ip}/cgi-bin/anpr.cgi",
    f"http://{username}:{password}@{camera_ip}/api/anpr",
    f"http://{username}:{password}@{camera_ip}/cgi-bin/anpr/config",
    f"http://{username}:{password}@{camera_ip}/cgi-bin/anpr/status"
]

print("Testing ANPR API endpoints...")
for endpoint in anpr_endpoints:
    try:
        print(f"\nTrying: {endpoint}")
        response = requests.get(endpoint, timeout=3)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.text[:200]}...")
        else:
            print(f"Error: {response.status_code}")
    except Exception as e:
        print(f"Failed: {e}")

# Test snapshot endpoints
print("\n\nTesting snapshot endpoints...")
snapshot_endpoints = [
    f"http://{username}:{password}@{camera_ip}/cgi-bin/snapshot.cgi",
    f"http://{username}:{password}@{camera_ip}/snapshot.jpg",
    f"http://{username}:{password}@{camera_ip}/cgi-bin/snapshot.jpg",
    f"http://{username}:{password}@{camera_ip}/image.jpg"
]

for endpoint in snapshot_endpoints:
    try:
        print(f"\nTrying: {endpoint}")
        response = requests.get(endpoint, timeout=3)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Content-Type: {response.headers.get('content-type', 'unknown')}")
            print(f"Content-Length: {len(response.content)} bytes")
        else:
            print(f"Error: {response.status_code}")
    except Exception as e:
        print(f"Failed: {e}")