import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PDFUpload } from './components/PDFUpload';
import { QuerySection } from './components/QuerySection';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios'; // Import axios

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null); // Store file path

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      // Step 1: Send file to Flask backend for upload and get file path
      const uploadResponse = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      console.log('Upload Response:', uploadResponse.data); // Log the upload response to see the file path
  
      const uploadedFilePath = uploadResponse.data.file_path;
      if (!uploadedFilePath) {
        toast.error('Failed to get file path from server');
        return;
      }
  
      setUploadedFile(file);
      setFilePath(uploadedFilePath); // Save the file path
      toast.success('PDF uploaded successfully!');
  
      // Step 2: Automatically call /populate to update the database with the file path
      const populateResponse = await axios.post('http://127.0.0.1:5000/populate', {
        file_path: uploadedFilePath, // Send file path
      });
  
      console.log('Populate Response:', populateResponse.data); // Log the populate response
      toast.success('Database updated successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload PDF and update database');
    } finally {
      setIsUploading(false);
    }
  };
  

  const handleQuery = async (query: string) => {
    if (!uploadedFile) {
      toast.error('Please upload a PDF first');
      return;
    }

    setIsQuerying(true);
    try {
      // Send query to Flask backend
      const response = await axios.post('http://127.0.0.1:5000/query', {
        query: query
      });
      setResponse(response.data.response); // Set the response from Flask API
    } catch (error) {
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
