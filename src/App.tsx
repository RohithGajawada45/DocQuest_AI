import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { PDFUpload } from './components/PDFUpload';
import { QuerySection } from './components/QuerySection';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadedFile(file);
      toast.success('PDF uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload PDF');
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
      // Simulate query processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResponse('This is a simulated response to your query. In a real application, this would be the actual response from processing your question against the uploaded PDF content.');
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