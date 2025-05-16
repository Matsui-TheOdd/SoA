/* eslint-disable import/no-unresolved */
import React, { useState } from "react";

interface FileUploadProps {
  accept: string;
  onDataChange: (data: FileList) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ accept, onDataChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Hàm xử lý khi file được chọn hoặc kéo thả
  const handleIFCFileUpload = (
    event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>
  ) => {
    let files: FileList | null = null;

    // Kiểm tra nguồn file (kéo thả hoặc chọn file)
    if ("dataTransfer" in event) {
      files = event.dataTransfer.files;
    } else {
      files = event.target.files;
    }

    if (files) {
      onDataChange(files);
    }
  };

  // Ngăn chặn hành động mặc định khi kéo file
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleIFCFileUpload(event);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        isDragging ? "border-red-600" : "border-gray-300"
      } border-dashed rounded-lg p-4`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={handleDragLeave}
    >
      <label>
        <input
          className="hidden"
          type="file"
          accept={accept}
          multiple
          onChange={handleIFCFileUpload}
        />
        <div className="text bg-red-600 text-white border border-gray-300 rounded font-semibold cursor-pointer p-1 px-3 hover:bg-red-500">
          Choose files
        </div>
      </label>
    </div>
  );
};

export default FileUpload;
