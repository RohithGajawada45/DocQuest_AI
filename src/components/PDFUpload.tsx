import React from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

interface Props {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

export function PDFUpload({ onFileUpload, isUploading }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        onFileUpload(acceptedFiles[0]);
      }
    },
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'w-full border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors',
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center justify-center text-center">
          <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-1">
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
          </p>
          <p className="text-sm text-gray-500">or click to browse</p>
          {isUploading && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}