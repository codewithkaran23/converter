import os
import zipfile
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename
from PIL import Image
import io
import fitz  # PyMuPDF
from pdf2docx import Converter as pdf_to_docx_conv
import tempfile
import shutil
import threading
import uuid
if os.name == 'nt':
    import pythoncom
    from docx2pdf import convert as docx_to_pdf_conv
else:
    pythoncom = None
    docx_to_pdf_conv = None


app = Flask(__name__)
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_FILES_PER_REQUEST = 20
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_BYTES

# Ensure temp directory exists
TEMP_DIR = os.path.join(os.path.dirname(__file__), 'temp')
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'}
BG_OUTPUT_FORMATS = {'PNG', 'JPEG', 'JPG', 'WEBP'}
IMAGE_OUTPUT_FORMATS = {'PNG', 'JPEG', 'JPG', 'WEBP', 'PDF'}
IMAGE_MIME_TYPES = {
    'PNG': 'image/png',
    'JPEG': 'image/jpeg',
    'JPG': 'image/jpeg',
    'WEBP': 'image/webp',
    'PDF': 'application/pdf',
}
_bg_sessions = {}
_bg_session_lock = threading.Lock()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_uploads(files, allowed_extensions=None, max_file_bytes=MAX_UPLOAD_BYTES):
    selected_files = [file for file in files if file and file.filename]
    if not selected_files:
        return None, ('No files were selected.', 400)
    if len(selected_files) > MAX_FILES_PER_REQUEST:
        return None, (f'You can upload at most {MAX_FILES_PER_REQUEST} files at once.', 400)

    for file in selected_files:
        safe_name = secure_filename(file.filename)
        extension = safe_name.rsplit('.', 1)[-1].lower() if '.' in safe_name else ''
        if not safe_name or (allowed_extensions is not None and extension not in allowed_extensions):
            return None, (f'Unsupported file: {file.filename}', 400)
        current_position = file.stream.tell()
        file.stream.seek(0, os.SEEK_END)
        file_size = file.stream.tell()
        file.stream.seek(current_position)
        if file_size > max_file_bytes:
            max_size_mb = max_file_bytes // (1024 * 1024)
            return None, (f'{file.filename} is larger than the {max_size_mb} MB limit.', 413)
        file.filename = safe_name

    return selected_files, None

@app.errorhandler(RequestEntityTooLarge)
def upload_too_large(_error):
    return jsonify({'error': 'Upload is too large. Select files totalling 50 MB or less.'}), 413

@app.errorhandler(500)
def unexpected_error(_error):
    return jsonify({'error': 'Something went wrong while processing the file. Please try again.'}), 500

def get_bg_session(high_precision=False):
    """Create each background-removal model once and reuse it for later files."""
    from rembg import new_session

    model_name = 'isnet-general-use' if high_precision else 'u2netp'
    with _bg_session_lock:
        if model_name not in _bg_sessions:
            _bg_sessions[model_name] = new_session(model_name)
        return _bg_sessions[model_name]

def save_image_with_target_size(image, image_format, quality, target_size_kb=None):
    """Save JPG/WEBP at the best quality that fits the requested maximum size."""
    if not target_size_kb or image_format not in {'JPEG', 'WEBP'}:
        output = io.BytesIO()
        save_args = {'format': image_format}
        if image_format in {'JPEG', 'WEBP'}:
            save_args['quality'] = quality
        image.save(output, **save_args)
        return output

    target_bytes = target_size_kb * 1024
    low, high = 1, min(quality, 95)
    best_output = None
    while low <= high:
        current_quality = (low + high) // 2
        candidate = io.BytesIO()
        image.save(candidate, format=image_format, quality=current_quality)
        if candidate.tell() <= target_bytes:
            best_output = candidate
            low = current_quality + 1
        else:
            high = current_quality - 1

    if best_output is None:
        best_output = io.BytesIO()
        image.save(best_output, format=image_format, quality=1)
    return best_output

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
    files, error = validate_uploads(request.files.getlist('files'), ALLOWED_EXTENSIONS, MAX_IMAGE_UPLOAD_BYTES)
    if error:
        return jsonify({'error': error[0]}), error[1]
        
    target_format = request.form.get('format', 'WEBP').upper()
    if target_format not in IMAGE_OUTPUT_FORMATS:
        return jsonify({'error': 'Output format must be PNG, JPG, WEBP, or PDF.'}), 400
    try:
        quality = int(request.form.get('quality', 80))
    except (TypeError, ValueError):
        return jsonify({'error': 'Quality must be a number between 1 and 100.'}), 400
    if not 1 <= quality <= 100:
        return jsonify({'error': 'Quality must be between 1 and 100.'}), 400
    raw_target_size = request.form.get('target_size_kb')
    try:
        target_size_kb = int(raw_target_size) if raw_target_size else None
    except ValueError:
        return jsonify({'error': 'Target size must be a whole number.'}), 400
    if target_size_kb is not None and not 10 <= target_size_kb <= 10240:
        return jsonify({'error': 'Target size must be between 10 KB and 10 MB.'}), 400
    
    converted_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            try:
                img = Image.open(file)
                img.load()
                if target_format in {'JPEG', 'JPG', 'PDF'} and img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                save_format = target_format
                if save_format == 'JPG': save_format = 'JPEG'
                img_io = save_image_with_target_size(img, save_format, quality, target_size_kb)
                img_io.seek(0)
                original_name = file.filename.rsplit('.', 1)[0]
                extension = 'jpg' if target_format in {'JPEG', 'JPG'} else target_format.lower()
                new_filename = f"{original_name}.{extension}"
                converted_files.append((new_filename, img_io))
            except Exception as e:
                return jsonify({'error': f'Could not convert {file.filename}. Please upload a valid image and try again.'}), 400

    if not converted_files: return jsonify({'error': 'No valid files'}), 400

    if len(converted_files) == 1:
        new_filename, img_io = converted_files[0]
        return send_file(img_io, mimetype=IMAGE_MIME_TYPES[target_format], as_attachment=True, download_name=new_filename)
        
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, img_io in converted_files:
            zipf.writestr(filename, img_io.getvalue())
    zip_io.seek(0)
    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='converted_images.zip')

@app.route('/convert-docx', methods=['POST'])
def convert_docx():
    files, error = validate_uploads(request.files.getlist('files'), {'doc', 'docx', 'pdf'})
    if error:
        return jsonify({'error': error[0]}), error[1]
    
    # Check direction
    target_ext = request.form.get('target_ext') or request.form.get('format') or 'pdf'
    target_ext = target_ext.lower()
    if target_ext not in {'pdf', 'docx'}:
        return jsonify({'error': 'Document output must be PDF or DOCX.'}), 400

    source_extensions = {file.filename.rsplit('.', 1)[-1].lower() for file in files}
    if target_ext == 'pdf' and not source_extensions.issubset({'doc', 'docx'}):
        return jsonify({'error': 'Word to PDF ke liye sirf DOC ya DOCX file upload karo.'}), 400
    if target_ext == 'docx' and source_extensions != {'pdf'}:
        return jsonify({'error': 'PDF to Word ke liye sirf PDF file upload karo.'}), 400
    
    converted_files = []
    failed_files = []
    
    for file in files:
        if not file.filename: continue
        
        # Use a more robust way to handle extensions
        base_name = os.path.splitext(file.filename)[0]
        unique_name = uuid.uuid4().hex
        temp_in = os.path.join(TEMP_DIR, f"{unique_name}_{file.filename}")
        temp_out = os.path.join(TEMP_DIR, f"{unique_name}_{base_name}.{target_ext}")
        
        try:
            file.save(temp_in)
            if target_ext == 'pdf':
                # Word to PDF
                if os.name != 'nt' or pythoncom is None:
                    return jsonify({'error': 'Word to PDF conversion is only supported on Windows servers with Microsoft Word installed. For cloud deployment, consider using an alternative library or API.'}), 400
                
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
            failed_files.append(file.filename)
        finally:
            # Safe cleanup
            try:
                if os.path.exists(temp_in): os.remove(temp_in)
                if os.path.exists(temp_out): os.remove(temp_out)
            except: pass

    if not converted_files:
        files_text = ', '.join(failed_files) if failed_files else 'the selected file'
        if target_ext == 'pdf':
            return jsonify({'error': f'Could not convert {files_text}. Check that Microsoft Word is installed and the document opens correctly.'}), 400
        return jsonify({'error': f'Could not convert {files_text}. Check that the PDF is valid and not password protected.'}), 400

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
    files, error = validate_uploads(request.files.getlist('files'), ALLOWED_EXTENSIONS | {'pdf'})
    if error:
        return jsonify({'error': error[0]}), error[1]
    
    target_format = request.form.get('format', 'PNG').upper()
    if target_format not in {'PNG', 'JPEG', 'WEBP', 'PDF'}:
        return jsonify({'error': 'Output format must be PNG, JPG, WEBP, or PDF.'}), 400
    if target_format not in BG_OUTPUT_FORMATS:
        return jsonify({'error': 'Output format must be PNG, JPG, JPEG, or WEBP.'}), 400
    
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
    failed_files = []
    for file in files:
        pdf_data = file.read()
        try:
            doc = fitz.open(stream=pdf_data, filetype="pdf")
            pdf_name = file.filename.rsplit('.', 1)[0]
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                img_io = io.BytesIO()
                ext = target_format.lower()
                if ext == 'jpeg': ext = 'jpg'
                img.save(img_io, format=target_format)
                prefix = f"{pdf_name}_" if len(files) > 1 else ""
                all_images.append((f"{prefix}page_{page_num+1}.{ext}", img_io.getvalue()))
            doc.close()
        except Exception as e:
            failed_files.append(file.filename)

    if not all_images:
        files_text = ', '.join(failed_files) if failed_files else 'the selected file'
        return jsonify({'error': f'Could not convert {files_text}. Please upload a valid PDF.'}), 400
    if len(all_images) == 1:
        name, data = all_images[0]
        return send_file(io.BytesIO(data), mimetype=IMAGE_MIME_TYPES[target_format], as_attachment=True, download_name=name)
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for name, data in all_images:
            zipf.writestr(name, data)
    zip_io.seek(0)
    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='pdf_pages.zip')

@app.route('/bg-remover')
def bg_remover_page():
    return render_template('index.html', tool_title="AI Background Remover", tool_desc="Professional-grade background extraction in seconds. Upload your product photo and let our neural engine do the rest.", tool_type="BGREM", accept="image/*")

@app.route('/watermark')
def watermark_page():
    return render_template('index.html', tool_title="Watermark", tool_desc="Add custom text watermarks to protect and brand your photos. Choose position, opacity, font size, and color.", tool_type="WMARK", accept="image/*")

@app.route('/remove-bg', methods=['POST'])
def remove_bg():
    files, error = validate_uploads(request.files.getlist('files'), ALLOWED_EXTENSIONS, MAX_IMAGE_UPLOAD_BYTES)
    if error:
        return jsonify({'error': error[0]}), error[1]
    
    high_precision = request.form.get('high_precision') == 'true'
    target_format = request.form.get('format', 'PNG').upper()
    
    try:
        from rembg import remove as rembg_remove
    except ImportError:
        return jsonify({'error': 'rembg library not installed. Run: pip install rembg[cpu]'}), 500
    
    converted_files = []
    
    try:
        session = get_bg_session(high_precision)
    except Exception as e:
        return jsonify({'error': f'Background-removal model could not start: {str(e)}'}), 503
    
    for file in files:
        if file and allowed_file(file.filename):
            try:
                input_data = file.read()
                
                if high_precision:
                    # Professional-grade settings for "crisp" removal
                    output_data = rembg_remove(
                        input_data,
                        session=session,
                        alpha_matting=True,
                        alpha_matting_foreground_threshold=270, # More aggressive foreground
                        alpha_matting_background_threshold=20,  # Suppress more background/shadows
                        alpha_matting_erode_size=15,            # Clean up the edges further
                        post_process_mask=True
                    )
                else:
                    output_data = rembg_remove(input_data, session=session)
                
                # Perform format conversion using PIL
                img = Image.open(io.BytesIO(output_data))
                img_io = io.BytesIO()
                
                if target_format in ('JPEG', 'JPG'):
                    if img.mode in ('RGBA', 'LA', 'P'):
                        # Paste transparent PNG over a solid white background
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                        img = background
                    else:
                        img = img.convert('RGB')
                    img.save(img_io, format='JPEG', quality=95)
                elif target_format == 'WEBP':
                    img.save(img_io, format='WEBP', quality=90)
                else:
                    img.save(img_io, format='PNG')
                
                img_io.seek(0)
                original_name = file.filename.rsplit('.', 1)[0]
                ext = 'jpg' if target_format in ('JPEG', 'JPG') else target_format.lower()
                new_filename = f"{original_name}_nobg.{ext}"
                converted_files.append((new_filename, img_io))
            except Exception as e:
                return jsonify({'error': f'Could not remove the background from {file.filename}. Please try another image.'}), 400
    
    if not converted_files:
        return jsonify({'error': 'No valid image files'}), 400
    
    if len(converted_files) == 1:
        new_filename, img_io = converted_files[0]
        mimetype = 'image/png'
        if target_format in ('JPEG', 'JPG'):
            mimetype = 'image/jpeg'
        elif target_format == 'WEBP':
            mimetype = 'image/webp'
        return send_file(img_io, mimetype=mimetype, as_attachment=True, download_name=new_filename)
    
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, img_io in converted_files:
            zipf.writestr(filename, img_io.getvalue())
    zip_io.seek(0)
    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='bg_removed_images.zip')

@app.route('/add-watermark', methods=['POST'])
def add_watermark():
    files, error = validate_uploads(request.files.getlist('files'), ALLOWED_EXTENSIONS, MAX_IMAGE_UPLOAD_BYTES)
    if error:
        return jsonify({'error': error[0]}), error[1]
    
    watermark_text = request.form.get('watermark_text', 'Fileonix')
    opacity = int(request.form.get('opacity', 128))
    font_size = int(request.form.get('font_size', 36))
    position = request.form.get('position', 'center')
    color = request.form.get('color', '#ffffff')
    target_format = request.form.get('format', 'PNG').upper()
    
    # Parse hex color
    hex_color = color.lstrip('#')
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    converted_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            try:
                img = Image.open(file).convert('RGBA')
                
                # Create watermark overlay
                txt_layer = Image.new('RGBA', img.size, (255, 255, 255, 0))
                from PIL import ImageDraw, ImageFont
                draw = ImageDraw.Draw(txt_layer)
                
                # Try to get a nice font, fall back to default
                try:
                    font = ImageFont.truetype("arial.ttf", font_size)
                except:
                    try:
                        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
                    except:
                        font = ImageFont.load_default()
                
                # Get text bounding box
                bbox = draw.textbbox((0, 0), watermark_text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                
                img_w, img_h = img.size
                padding = 20
                
                # Determine position
                positions = {
                    'top-left': (padding, padding),
                    'top-right': (img_w - text_w - padding, padding),
                    'center': ((img_w - text_w) // 2, (img_h - text_h) // 2),
                    'bottom-left': (padding, img_h - text_h - padding),
                    'bottom-right': (img_w - text_w - padding, img_h - text_h - padding),
                    'tile': None
                }
                
                fill_color = (r, g, b, opacity)
                
                if position == 'tile':
                    # Tile watermark across the entire image
                    y = 0
                    while y < img_h:
                        x = 0
                        while x < img_w:
                            draw.text((x, y), watermark_text, font=font, fill=fill_color)
                            x += text_w + 60
                        y += text_h + 60
                else:
                    pos = positions.get(position, positions['center'])
                    draw.text(pos, watermark_text, font=font, fill=fill_color)
                
                # Composite
                watermarked = Image.alpha_composite(img, txt_layer)
                
                # Convert to target format
                img_io = io.BytesIO()
                save_format = target_format
                if save_format == 'JPG':
                    save_format = 'JPEG'
                if save_format in ['JPEG']:
                    watermarked = watermarked.convert('RGB')
                
                if save_format in ['JPEG', 'WEBP']:
                    watermarked.save(img_io, format=save_format, quality=95)
                else:
                    watermarked.save(img_io, format=save_format)
                img_io.seek(0)
                
                original_name = file.filename.rsplit('.', 1)[0]
                ext = target_format.lower()
                if ext == 'jpeg':
                    ext = 'jpg'
                new_filename = f"{original_name}_watermarked.{ext}"
                converted_files.append((new_filename, img_io))
            except Exception as e:
                return jsonify({'error': f'Could not add a watermark to {file.filename}. Please try another image.'}), 400
    
    if not converted_files:
        return jsonify({'error': 'No valid image files'}), 400
    
    if len(converted_files) == 1:
        new_filename, img_io = converted_files[0]
        mimetype = f'image/{target_format.lower()}'
        if target_format == 'JPEG':
            mimetype = 'image/jpeg'
        return send_file(img_io, mimetype=mimetype, as_attachment=True, download_name=new_filename)
    
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, img_io in converted_files:
            zipf.writestr(filename, img_io.getvalue())
    zip_io.seek(0)
    return send_file(zip_io, mimetype='application/zip', as_attachment=True, download_name='watermarked_images.zip')

if __name__ == '__main__':
    app.run(debug=False, port=5000)
