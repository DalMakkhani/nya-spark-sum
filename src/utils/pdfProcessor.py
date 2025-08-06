#!/usr/bin/env python3
import base64
import json
import sys
import requests
from pathlib import Path

# AWS endpoint configuration
AWS_ENDPOINT = "https://jtwx63qbu1.execute-api.us-east-1.amazonaws.com/default/pdf-summarizer-function"
HEADERS = {
    "Content-Type": "application/json",
}

def encode_pdf_to_base64(file_path):
    """Encode PDF file to base64 string"""
    try:
        with open(file_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        return {"error": f"Failed to read PDF: {str(e)}"}

def send_to_aws(encoded_pdf):
    """Send encoded PDF to AWS endpoint"""
    try:
        payload = {"pdf_content": encoded_pdf}
        response = requests.post(AWS_ENDPOINT, headers=HEADERS, data=json.dumps(payload), timeout=60)
        
        if response.status_code == 200:
            try:
                return {"success": True, "data": response.json()}
            except:
                return {"success": True, "data": response.text}
        else:
            return {"error": f"HTTP {response.status_code}: {response.text}"}
            
    except requests.exceptions.Timeout:
        return {"error": "Request timed out after 60 seconds"}
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

def main():
    """Main function to process PDF"""
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python pdfProcessor.py <pdf_file_path>"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not Path(pdf_path).exists():
        print(json.dumps({"error": f"PDF file not found: {pdf_path}"}))
        sys.exit(1)
    
    # Encode PDF
    encoded_pdf = encode_pdf_to_base64(pdf_path)
    if isinstance(encoded_pdf, dict) and "error" in encoded_pdf:
        print(json.dumps(encoded_pdf))
        sys.exit(1)
    
    # Send to AWS
    result = send_to_aws(encoded_pdf)
    print(json.dumps(result))

if __name__ == "__main__":
    main()