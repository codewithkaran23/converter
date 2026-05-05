import os
import zipfile
from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image
import io
import fitz  # PyMuPDF
from docx2pdf import convert as docx_to_pdf_conv
from pdf2docx import Converter as pdf_to_docx_conv
import tempfile
import shutil
import pythoncom

app = Flask(__name__)

# Ensure temp directory exists
TEMP_DIR = os.path.join(os.path.dirname(__file__), 'temp')
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/image-converter')
def image_converter_page():
    return render_template('index.html', tool_title="Image Converter", tool_desc="Transform your images instantly with precision quality. Support for PNG, JPG, WEBP, and more, all processed with lightning-fast speed.", tool_type="IMG", accept="image/*")

@app.route('/word-to-pdf')
def word_to_pdf_page():
    return render_template('index.html', tool_title="Document Converter", tool_desc="Seamlessly convert between Word and PDF formats. Our professional-grade engine preserves your formatting, fonts, and layout with absolute accuracy.", tool_type="DOC", accept=".docx,.pdf")

@app.route('/pdf-to-image')
def pdf_to_img_page():
    return render_template('index.html', tool_title="PDF Converter", tool_desc="Convert between PDF and Images instantly with high quality.", tool_type="PDF", accept=".pdf,image/*")

@app.route('/convert', methods=['POST'])
def convert_image():
    files = request.files.getlist('files')
    if not files or len(files) == 0 or files[0].filename == '':
        return jsonify({'error': 'No selected files'}), 400
        
    target_format = request.form.get('format', 'WEBP').upper()
    quality = int(request.form.get('quality', 80))
    
    converted_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            try:
                img = Image.open(file)
                if target_format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                img_io = io.BytesIO()
                save_format = target_format
                if save_format == 'JPG': save_format = 'JPEG'
                if save_format in ['JPEG', 'WEBP']:
                    img.save(img_io, format=save_format, quality=quality)
                else:
                    img.save(img_io, format=save_format)
                img_io.seek(0)
                original_name = file.filename.rsplit('.', 1)[0]
                new_filename = f"{original_name}.{target_format.lower()}"
                converted_files.append((new_filename, img_io))
            except Exception as e:
                return jsonify({'error': f"Failed to convert {file.filename}: {str(e)}"}), 500

    if not converted_files: return jsonify({'error': 'No valid files'}), 400

    if len(converted_files) == 1:
        new_filename, img_io = converted_files[0]
        return send_file(img_io, mimetype=f'image/{target_format.lower()}', as_attachment=True, download_name=new_filename)
        
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, img_io in converted_files:
            zipf.writestr(filename, img_io.getvalue())
    zip_io.seek(0)
    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='converted_images.zip')

@app.route('/convert-docx', methods=['POST'])
def convert_docx():
    files = request.files.getlist('files')
    if not files: return jsonify({'error': 'No files'}), 400
    
    # Check direction
    target_ext = request.form.get('target_ext') or request.form.get('format') or 'pdf'
    target_ext = target_ext.lower()
    
    converted_files = []
    
    for file in files:
        if not file.filename: continue
        
        # Use a more robust way to handle extensions
        base_name = os.path.splitext(file.filename)[0]
        temp_in = os.path.abspath(os.path.join(TEMP_DIR, file.filename))
        temp_out = os.path.abspath(os.path.join(TEMP_DIR, f"{base_name}.{target_ext}"))
        
        try:
            file.save(temp_in)
            if target_ext == 'pdf':
                # Word to PDF
                pythoncom.CoInitialize()
                try:
                    docx_to_pdf_conv(temp_in, temp_out)
                finally:
                    pythoncom.CoUninitialize()
            else:
                # PDF to Word
                cv = pdf_to_docx_conv(temp_in)
                cv.convert(temp_out)
                cv.close()
            
            if os.path.exists(temp_out):
                with open(temp_out, 'rb') as f:
                    data = f.read()
                converted_files.append((os.path.basename(temp_out), data))
            else:
                print(f"Error: Output file {temp_out} was not created.")
        except Exception as e:
            print(f"Conversion Error for {file.filename}: {e}")
        finally:
            # Safe cleanup
            try:
                if os.path.exists(temp_in): os.remove(temp_in)
                if os.path.exists(temp_out): os.remove(temp_out)
            except: pass

    if not converted_files:
        return jsonify({'error': 'Conversion failed. Check file format.'}), 500

    if len(converted_files) == 1:
        name, data = converted_files[0]
        mimetype = 'application/pdf' if target_ext == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        return send_file(io.BytesIO(data), mimetype=mimetype, as_attachment=True, download_name=name)

    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for name, data in converted_files:
            zipf.writestr(name, data)
    zip_io.seek(0)
    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='converted_docs.zip')

@app.route('/convert-pdf', methods=['POST'])
def convert_pdf():
    files = request.files.getlist('files')
    if not files: return jsonify({'error': 'No files'}), 400
    
    target_format = request.form.get('format', 'PNG').upper()
    
    # Image to PDF Mode
    if target_format == 'PDF':
        img_list = []
        for file in files:
            try:
                img = Image.open(file)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                img_list.append(img)
            except Exception as e:
                print(f"Img to PDF error: {e}")
        
        if not img_list: return jsonify({'error': 'No valid images'}), 400
        
        pdf_io = io.BytesIO()
        img_list[0].save(pdf_io, format='PDF', save_all=True, append_images=img_list[1:])
        pdf_io.seek(0)
        return send_file(pdf_io, mimetype='application/pdf', as_attachment=True, download_name='combined.pdf')

    # PDF to Image Mode
    if target_format == 'JPEG': target_format = 'JPEG'
    
    all_images = []
    for file in files:
        pdf_data = file.read()
        try:
            doc = fitz.open(stream=pdf_data, filetype="pdf")
            pdf_name = file.filename.rsplit('.', 1)[0]
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                img_io = io.BytesIO()
                ext = target_format.lower()
                if ext == 'jpeg': ext = 'jpg'
                img.save(img_io, format=target_format)
                prefix = f"{pdf_name}_" if len(files) > 1 else ""
                all_images.append((f"{prefix}page_{page_num+1}.{ext}", img_io.getvalue()))
            doc.close()
        except Exception as e:
            print(f"PDF Error: {e}")

    if not all_images: return jsonify({'error': 'PDF conversion failed.'}), 500
    if len(all_images) == 1:
        name, data = all_images[0]
        return send_file(io.BytesIO(data), mimetype='image/png', as_attachment=True, download_name=name)
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for name, data in all_images:
            zipf.writestr(name, data)
    zip_io.seek(0)
    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='pdf_pages.zip')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
