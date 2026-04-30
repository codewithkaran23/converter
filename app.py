import os
import zipfile
from flask import Flask, render_template, request, send_file, jsonify
from PIL import Image
import io

app = Flask(__name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

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
                if save_format == 'JPG':
                    save_format = 'JPEG'
                    
                # Apply quality for formats that support it
                if save_format in ['JPEG', 'WEBP']:
                    img.save(img_io, format=save_format, quality=quality)
                else:
                    img.save(img_io, format=save_format)
                    
                img_io.seek(0)
                
                original_name = file.filename.rsplit('.', 1)[0]
                new_filename = f"{original_name}.{target_format.lower()}"
                
                converted_files.append((new_filename, img_io))
                
            except Exception as e:
                print(f"Error converting {file.filename}: {e}")
                return jsonify({'error': f"Failed to convert {file.filename}: {str(e)}"}), 500

    if not converted_files:
        return jsonify({'error': 'No valid files to convert'}), 400

    # If only one file, return it directly
    if len(converted_files) == 1:
        new_filename, img_io = converted_files[0]
        return send_file(
            img_io,
            mimetype=f'image/{target_format.lower()}',
            as_attachment=True,
            download_name=new_filename
        )
        
    # If multiple files, create a zip
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for filename, img_io in converted_files:
            zipf.writestr(filename, img_io.getvalue())
            
    zip_io.seek(0)
    return send_file(
        zip_io,
        mimetype='application/zip',
        as_attachment=True,
        download_name='converted_images.zip'
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)
