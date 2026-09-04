import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FileDropProps {
  accept?: string;
  multiple?: boolean;
  hint?: ReactNode;
  label?: string;
  onFiles: (files: File[]) => void;
  className?: string;
}

export function FileDrop({
  accept,
  multiple,
  hint,
  label = 'Перетащите файл сюда или нажмите для выбора',
  onFiles,
  className,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
        dragging ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-ink-50 hover:border-brand-400',
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
        <Upload className="size-5" />
      </span>
      <span className="text-sm font-medium text-ink-800">{label}</span>
      {hint && <span className="text-xs text-ink-500">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
