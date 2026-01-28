#!/usr/bin/env python3
import PyPDF2

pdf_path = 'public/docs/SCAT6_Fillable.pdf'

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        if '/AcroForm' in reader.trailer['/Root']:
            fields = reader.get_fields()

            print(f"\n{'='*80}")
            print(f"COMPLETE SCAT6 PDF FIELD AUDIT")
            print(f"Total fields: {len(fields)}")
            print(f"{'='*80}\n")

            # Organize fields by type
            text_fields = {}
            button_fields = {}
            unknown_fields = {}

            for name, field in fields.items():
                field_type = field.get('/FT')

                if field_type == '/Tx':
                    text_fields[name] = field
                elif field_type == '/Btn':
                    button_fields[name] = field
                else:
                    unknown_fields[name] = field

            print(f"TEXT FIELDS ({len(text_fields)}):")
            print("-" * 80)
            for name in sorted(text_fields.keys()):
                field = text_fields[name]
                # Check if it's a rich text field
                is_rich_text = False
                if '/RV' in field or ('/Ff' in field and field['/Ff'] & (1 << 25)):
                    is_rich_text = True

                max_len = field.get('/MaxLen', 'unlimited')
                print(f"  {name:20} MaxLen: {str(max_len):10} {'[RICH TEXT - UNSUPPORTED]' if is_rich_text else ''}")

            print(f"\nBUTTON FIELDS ({len(button_fields)}):")
            print("-" * 80)
            for name in sorted(button_fields.keys()):
                field = button_fields[name]

                # Count options
                options = []
                if '/Kids' in field:
                    for kid in field['/Kids']:
                        kid_obj = kid.get_object()
                        if '/AP' in kid_obj and '/N' in kid_obj['/AP']:
                            opts = kid_obj['/AP']['/N'].get_object()
                            if hasattr(opts, 'keys'):
                                for opt in opts.keys():
                                    if opt not in options and opt != '/Off':
                                        options.append(opt)

                options_sorted = sorted(set(options))
                field_subtype = "checkbox" if len(options_sorted) <= 2 else "radio"
                print(f"  {name:20} Type: {field_subtype:10} Options: {options_sorted}")

            if unknown_fields:
                print(f"\nUNKNOWN FIELDS ({len(unknown_fields)}):")
                print("-" * 80)
                for name in sorted(unknown_fields.keys()):
                    print(f"  {name}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
