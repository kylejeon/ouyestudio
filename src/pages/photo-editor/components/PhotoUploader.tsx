
import { useRef } from 'react';

interface PhotoUploaderProps {
  onUpload: (files: FileList) => void;
}

export default function PhotoUploader({ onUpload }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
      >
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto flex items-center justify-center bg-gray-100 rounded-full">
            <i className="ri-upload-cloud-2-line text-xl text-gray-500"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">사진 업로드</p>
            <p className="text-xs text-gray-500">클릭하거나 드래그하여 업로드</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-xs text-gray-500">
        <p>• JPG, PNG 파일 지원</p>
        <p>• 여러 파일 동시 업로드 가능</p>
        <p>• 선택한 레이아웃에 맞게 자동 배치</p>
      </div>
    </div>
  );
}
