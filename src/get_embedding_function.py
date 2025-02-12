from langchain.embeddings.huggingface import HuggingFaceEmbeddings

# Load the model only once at startup
_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def get_embedding_function():
    return _embeddings
