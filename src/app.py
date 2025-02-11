from flask import Flask, request, jsonify
import os
from flask_cors import CORS
import shutil
from werkzeug.utils import secure_filename
# from langchain.document_loaders import PyPDFLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema.document import Document
from get_embedding_function import get_embedding_function
# from langchain.vectorstores.chroma import Chroma
from langchain_community.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_community.llms.ollama import Ollama
import chromadb  # Ensure ChromaDB is installed

# Disable parallelism warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Directories for file storage and Chroma database
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
CHROMA_PATH = "chroma_db"  # Renamed for clarity

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure necessary directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CHROMA_PATH, exist_ok=True)

# Allowed file extensions for PDF uploads
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize ChromaDB with Persistent Storage
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection_name = "documents"

# Ensure the collection exists
# if collection_name not in [c.name for c in chroma_client.list_collections()]:
#     collection = chroma_client.create_collection(name=collection_name)
if collection_name not in chroma_client.list_collections():
    collection = chroma_client.create_collection(name=collection_name)
else:
    collection = chroma_client.get_collection(name=collection_name)

@app.route('/')
def home():
    return "Flask App is Running!"


@app.route('/check-uploads', methods=['GET'])
def check_uploads():
    try:
        pdf_files = [f for f in os.listdir(UPLOAD_FOLDER) if f.lower().endswith('.pdf')]
        if not pdf_files:
            return jsonify({"message": "No PDFs found"}), 404
        return jsonify({"files": pdf_files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Function to clear the uploads folder
def clear_uploads_folder():
    try:
        print("⚠️ Clearing uploads folder")
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)  # Remove file/link
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)  # Remove directory
        print("🗑️ Uploads folder cleared.")
    except Exception as e:
        print(f"❌ Error clearing uploads folder: {str(e)}")

# Function to clear Chroma database
def clear_database():
    global collection
    try:
        print("⚠️ Clearing Chroma Database")
        chroma_client.delete_collection(collection_name)
        collection = chroma_client.create_collection(name=collection_name)
        print("🗑️ Chroma database cleared and reinitialized.")
    except Exception as e:
        print(f"❌ Error clearing Chroma database: {str(e)}")

# Updated file upload endpoint
@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files.get('file')
        if not file or not allowed_file(file.filename):
            return jsonify({"error": "No file uploaded or invalid file format"}), 400
        
        filename = secure_filename(file.filename)

        # 1️⃣ Clear previous files
        clear_uploads_folder()

        # 2️⃣ Save the new file
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        print(f"✅ File uploaded: {file_path}")

        # 3️⃣ Clear Chroma database
        clear_database()

        # 4️⃣ Process and store new file in Chroma
        process_pdf_to_chroma(file_path)

        return jsonify({"message": "File uploaded and processed successfully", "file_path": file_path}), 200
    except Exception as e:
        print(f"❌ Error uploading file: {str(e)}")
        return jsonify({"error": str(e)}), 500


def process_pdf_to_chroma(file_path):
    try:
        documents = load_documents(file_path)
        chunks = split_documents(documents)
        add_to_chroma(chunks)
    except Exception as e:
        print(f"❌ Error processing PDF to Chroma: {str(e)}")

def load_documents(file_path):
    loader = PyPDFLoader(file_path)
    return loader.load()

def split_documents(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=80, length_function=len)
    return text_splitter.split_documents(documents)

def add_to_chroma(chunks: list[Document]):
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=get_embedding_function())
    chunks_with_ids = calculate_chunk_ids(chunks)
    existing_items = db.get(include=[])
    existing_ids = set(existing_items["ids"])
    new_chunks = [chunk for chunk in chunks_with_ids if chunk.metadata["id"] not in existing_ids]
    if new_chunks:
        new_chunk_ids = [chunk.metadata["id"] for chunk in new_chunks]
        db.add_documents(new_chunks, ids=new_chunk_ids)
        db.persist()

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
        chunk.metadata["id"] = f"{current_page_id}:{current_chunk_index}"
        last_page_id = current_page_id
    return chunks

@app.route('/reset_chroma', methods=['POST'])
def reset_chroma():
    try:
        chroma_client.delete_collection(collection_name)
        return jsonify({"message": "Chroma database cleared successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

@app.route('/query', methods=['POST'])
def query_chroma():
    try:
        query_text = request.json.get('query_text')
        if not query_text:
            return jsonify({"error": "No query text provided"}), 400
        response_text = query_rag(query_text)
        return jsonify({"response": response_text}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def query_rag(query_text: str):
    embedding_function = get_embedding_function()
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    results = db.similarity_search_with_score(query_text, k=5)
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    model = Ollama(model="mistral")
    response_text = model.invoke(prompt)
    return response_text

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))

    app.run(host="0.0.0.0", port=port, debug=True)

