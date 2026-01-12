import React, { useRef } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import { validateFileType, validateFileSize } from '@/utils/validators';
import { formatFileSize } from '@/utils/formatters';

interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploadProps {
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  multiple?: boolean;
  label?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  accept = 'image/jpeg,image/png,image/jpg',
  maxFiles = 10,
  maxSizeMB = 5,
  multiple = true,
  label,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []) as FileWithPreview[];

    // Validate files
    const validFiles = newFiles.filter((file) => {
      if (!validateFileType(file, accept.split(','))) {
        alert(`${file.name} is not a valid file type`);
        return false;
      }
      if (!validateFileSize(file, maxSizeMB)) {
        alert(`${file.name} is too large (max ${maxSizeMB}MB)`);
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Add preview URLs
    validFiles.forEach((file) => {
      file.preview = URL.createObjectURL(file);
    });

    onFilesChange([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      {/* Upload area */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
      >
        <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept.split(',').join(', ')} (max {maxSizeMB}MB each)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Preview */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={file.preview}
                alt={file.name}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiX className="h-4 w-4" />
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-sm text-gray-500">
        {files.length} / {maxFiles} files
      </p>
    </div>
  );
};