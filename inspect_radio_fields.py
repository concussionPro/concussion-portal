#!/usr/bin/env python3
import PyPDF2
import sys

pdf_path = 'public/docs/SCAT6_Fillable.pdf'

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        if '/AcroForm' in reader.trailer['/Root']:
            fields = reader.get_fields()

            # Focus on symptom radio buttons s1-s22
            print("\n=== SYMPTOM RADIO BUTTON FIELDS (s1-s22) ===\n")

            for i in range(1, 23):
                field_name = f's{i}'
                if field_name in fields:
                    field = fields[field_name]
                    field_type = field.get('/FT', 'Unknown')

                    print(f"{field_name}:")
                    print(f"  Type: {field_type}")

                    # Try to get options/values
                    if '/Kids' in field:
                        print(f"  Has Kids: {len(field['/Kids'])}")
                        for kid in field['/Kids']:
                            kid_obj = kid.get_object()
                            if '/AP' in kid_obj and '/N' in kid_obj['/AP']:
                                options = kid_obj['/AP']['/N'].get_object()
                                if hasattr(options, 'keys'):
                                    print(f"    Options: {list(options.keys())}")

                    if '/V' in field:
                        print(f"  Default Value: {field['/V']}")

                    if '/DV' in field:
                        print(f"  Default: {field['/DV']}")

                    print()

            # Also check orientation checkboxes
            print("\n=== ORIENTATION CHECKBOXES (ori1-ori5) ===\n")
            for i in range(1, 6):
                field_name = f'ori{i}'
                if field_name in fields:
                    field = fields[field_name]
                    print(f"{field_name}: {field.get('/FT', 'Unknown')}")
                    if '/V' in field:
                        print(f"  Value: {field['/V']}")
                    print()

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
