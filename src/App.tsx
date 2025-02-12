import React, { useState, useEffect} from 'react';
import { Navbar } from './components/Navbar';
import { PDFUpload } from './components/PDFUpload';
import { QuerySection } from './components/QuerySection';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null); // Store file path


  useEffect(() => {
    const checkExistingFiles = async () => {
      try {
        const response = await axios.get('https://docquest-ai.onrender.com/check-uploads'); // New API
        if (response.data.files.length > 0) {
          setFilePath(response.data.files[0]); // Set first file as default
          toast.success('Existing PDF found!');
        }
      } catch (error) {
        console.error('Error checking uploads:', error);
      }
    };

    checkExistingFiles();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Send file to Flask backend for upload
      const uploadResponse = await axios.post('https://docquest-ai.onrender.com/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload Response:', uploadResponse.data); // Debugging
      const uploadedFilePath = uploadResponse.data.file_path;

      if (!uploadedFilePath) {
        toast.error('Failed to get file path from server');
        return;
      }

      setUploadedFile(file);
      setFilePath(uploadedFilePath); // Save the file path
      toast.success('PDF uploaded successfully!');

      // Step 2: Automatically call /populate to update the database
      const populateResponse = await axios.post('https://docquest-ai.onrender.com/populate', {
        file_path: uploadedFilePath, 
      });

      console.log('Populate Response:', populateResponse.data); // Debugging
      toast.success('Database updated successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      // toast.error('Failed to upload PDF and update database');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async (query: string) => {
    console.log('Checking file path:', filePath);
  
    if (!filePath) {
      toast.error('No PDF found. Please upload a file.');
      return;
    }
  
    setIsQuerying(true);
    try {
      const response = await axios.post('https://docquest-ai.onrender.com/query', {
        query_text: query,
      });
  
      console.log('Query Response:', response.data);
      setResponse(response.data.response);
    } catch (error) {
      console.error('Query error:', error);
      toast.error('Failed to process query');
    } finally {
      setIsQuerying(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster position="top-right" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Upload PDF</h2>
            <PDFUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
            {uploadedFile && (
              <div className="text-sm text-gray-500">
                Uploaded: {uploadedFile.name}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Ask Questions</h2>
            <QuerySection
              onSubmitQuery={handleQuery}
              isLoading={isQuerying}
              response={response}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
