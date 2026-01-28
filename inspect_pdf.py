#!/usr/bin/env python3
import PyPDF2
import sys

pdf_path = 'public/docs/SCAT6_Fillable.pdf'

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)

        # Get form fields
        if '/AcroForm' in reader.trailer['/Root']:
            fields = reader.get_fields()

            print(f"\n=== SCAT6 PDF FIELD NAMES ===")
            print(f"Total fields: {len(fields) if fields else 0}\n")

            if fields:
                for i, (name, field) in enumerate(fields.items(), 1):
                    field_type = field.get('/FT', 'Unknown')
                    print(f"{i}. '{name}' (Type: {field_type})")
            else:
                print("No form fields found")
        else:
            print("PDF has no form fields")

except FileNotFoundError:
    print(f"Error: PDF not found at {pdf_path}")
except Exception as e:
    print(f"Error: {e}")
