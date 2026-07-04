from flask import Flask, send_file, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp
import os
import uuid
import tempfile
import threading
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)

DOWNLOADS_DIR = os.path.join(tempfile.gettempdir(), 'viralclip-downloads')
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Keep track of downloaded files
downloaded_files = {}

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)

@app.route('/download', methods=['POST'])
def download_video():
    data = request.get_json()
    url = data.get('url', '').strip()
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        video_id = str(uuid.uuid4())[:8]
        output_path = os.path.join(DOWNLOADS_DIR, f'{video_id}.mp4')
        
        ydl_opts = {
            'format': 'best[height<=720]',
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'cookiefile': None,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'Unknown')
            duration = info.get('duration', 0)
            thumbnail = info.get('thumbnail', '')
        
        downloaded_files[video_id] = {
            'path': output_path,
            'created': time.time(),
            'title': title
        }
        
        return jsonify({
            'success': True,
            'video_id': video_id,
            'title': title,
            'duration': duration,
            'thumbnail': thumbnail,
            'download_url': f'/video/{video_id}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/video/<video_id>')
def serve_video(video_id):
    file_info = downloaded_files.get(video_id)
    if not file_info or not os.path.exists(file_info['path']):
        return jsonify({'error': 'Video not found'}), 404
    
    return send_file(file_info['path'], mimetype='video/mp4')

@app.route('/progress/<video_id>')
def check_progress(video_id):
    file_info = downloaded_files.get(video_id)
    if not file_info:
        return jsonify({'ready': False})
    
    return jsonify({
        'ready': os.path.exists(file_info['path']),
        'title': file_info.get('title', '')
    })

def cleanup_old_files():
    """Remove files older than 1 hour"""
    while True:
        time.sleep(3600)
        current_time = time.time()
        to_remove = []
        for video_id, info in downloaded_files.items():
            if current_time - info['created'] > 3600:
                try:
                    if os.path.exists(info['path']):
                        os.remove(info['path'])
                    to_remove.append(video_id)
                except Exception:
                    pass
        for video_id in to_remove:
            downloaded_files.pop(video_id, None)

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
