from flask import Flask, request, jsonify
import os
import shutil
from werkzeug.utils import secure_filename
from langchain.document_loaders.pdf import PyPDFDirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter  # Previous import, needs fixing

from langchain.schema.document import Document
from get_embedding_function import get_embedding_function
from langchain.vectorstores.chroma import Chroma

# Directories for file storage and Chroma database
UPLOAD_FOLDER = 'uploads'
CHROMA_PATH = "chroma"
DATA_PATH = "uploads"

app = Flask(__name__)

# Make sure uploads folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Allowed file extensions for PDF uploads
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Endpoint for file upload
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files.get('file')  # Get the uploaded file
        if not file or not allowed_file(file.filename):
            return jsonify({"error": "No file uploaded or invalid file format"}), 400
        
        # Secure the filename and save the file
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Log the file path for debugging
        print(f"File uploaded to: {file_path}")
        
        # Clear the existing Chroma database
        clear_database()
        
        # Process the uploaded file for embeddings and store in Chroma
        process_pdf_to_chroma(file_path)
        
        return jsonify({"message": "File uploaded and processed successfully", "file_path": file_path}), 200

    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        return jsonify({"error": str(e)}), 500



# Function to process PDF and add its content to Chroma database
def process_pdf_to_chroma(file_path):
    try:
        # Load and split documents from the uploaded PDF
        documents = load_documents(file_path)
        chunks = split_documents(documents)
        add_to_chroma(chunks)
    except Exception as e:
        print(f"Error processing PDF to Chroma: {str(e)}")


# Load documents (PDF)
def load_documents(file_path):
    document_loader = PyPDFDirectoryLoader(DATA_PATH)  # Assuming PDF is in 'data' folder
    return document_loader.load()


# Split documents into smaller chunks
def split_documents(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=80,
        length_function=len,
        is_separator_regex=False,
    )
    return text_splitter.split_documents(documents)


# Add chunks to Chroma database
def add_to_chroma(chunks: list[Document]):
    # Initialize Chroma DB
    db = Chroma(
        persist_directory=CHROMA_PATH, embedding_function=get_embedding_function()
    )

    # Calculate Page IDs
    chunks_with_ids = calculate_chunk_ids(chunks)

    # Get existing items and check for new chunks
    existing_items = db.get(include=[])
    existing_ids = set(existing_items["ids"])
    print(f"Existing documents in DB: {len(existing_ids)}")

    new_chunks = [chunk for chunk in chunks_with_ids if chunk.metadata["id"] not in existing_ids]

    if new_chunks:
        print(f"Adding new documents: {len(new_chunks)}")
        new_chunk_ids = [chunk.metadata["id"] for chunk in new_chunks]
        db.add_documents(new_chunks, ids=new_chunk_ids)
        db.persist()
    else:
        print("No new documents to add.")


# Calculate chunk IDs for each document
def calculate_chunk_ids(chunks):
    last_page_id = None
    current_chunk_index = 0

    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        current_page_id = f"{source}:{page}"

        if current_page_id == last_page_id:
            current_chunk_index += 1
        else:
            current_chunk_index = 0

        chunk_id = f"{current_page_id}:{current_chunk_index}"
        last_page_id = current_page_id
        chunk.metadata["id"] = chunk_id

    return chunks


# Clear Chroma database
@app.route('/reset_chroma', methods=['POST'])
def reset_chroma():
    try:
        print("Clearing Chroma Database")
        clear_database()
        return jsonify({"message": "Chroma database cleared successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Clear the Chroma database directory
def clear_database():
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
        print("Chroma database cleared.")


if __name__ == '__main__':
    app.run(port=5000)