#!/usr/bin/env python3
import PyPDF2

pdf_path = 'public/docs/SCAT6_Fillable.pdf'

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        if '/AcroForm' in reader.trailer['/Root']:
            fields = reader.get_fields()

            # Check orientation fields
            print("\n=== ORIENTATION FIELDS (ori1-ori5) DETAILED ===\n")
            for i in range(1, 6):
                field_name = f'ori{i}'
                if field_name in fields:
                    field = fields[field_name]
                    print(f"{field_name}:")
                    print(f"  Type: {field.get('/FT')}")

                    if '/Kids' in field:
                        print(f"  Has Kids: {len(field['/Kids'])}")
                        for j, kid in enumerate(field['/Kids']):
                            kid_obj = kid.get_object()
                            print(f"  Kid {j}:")
                            if '/AP' in kid_obj and '/N' in kid_obj['/AP']:
                                options = kid_obj['/AP']['/N'].get_object()
                                if hasattr(options, 'keys'):
                                    print(f"    Options: {list(options.keys())}")
                            if '/AS' in kid_obj:
                                print(f"    Appearance State: {kid_obj['/AS']}")
                    print()

            # Check immediate memory trial fields
            print("\n=== IMMEDIATE MEMORY TRIAL FIELDS (Sample) ===\n")
            for field_name in ['Tri1a', 'Tri1b', 'Tri2a']:
                if field_name in fields:
                    field = fields[field_name]
                    print(f"{field_name}:")
                    print(f"  Type: {field.get('/FT')}")

                    if '/Kids' in field:
                        print(f"  Has Kids: {len(field['/Kids'])}")
                        for j, kid in enumerate(field['/Kids']):
                            kid_obj = kid.get_object()
                            if '/AP' in kid_obj and '/N' in kid_obj['/AP']:
                                options = kid_obj['/AP']['/N'].get_object()
                                if hasattr(options, 'keys'):
                                    print(f"    Options: {list(options.keys())}")
                    print()

            # Check athlete background checkboxes
            print("\n=== ATHLETE BACKGROUND CHECKBOXES ===\n")
            for i in range(1, 6):
                field_name = f'Check Box{i}'
                if field_name in fields:
                    field = fields[field_name]
                    print(f"{field_name}:")
                    print(f"  Type: {field.get('/FT')}")

                    if '/Kids' in field:
                        print(f"  Has Kids: {len(field['/Kids'])}")
                        for j, kid in enumerate(field['/Kids']):
                            kid_obj = kid.get_object()
                            if '/AP' in kid_obj and '/N' in kid_obj['/AP']:
                                options = kid_obj['/AP']['/N'].get_object()
                                if hasattr(options, 'keys'):
                                    print(f"    Options: {list(options.keys())}")
                    print()

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
