import * as React from "react";
import { cn } from "@/lib/utils";
import { FileUp, X, File, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  onValueChange?: (file: File | null) => void;
  currentFileName?: string;
  description?: string;
  allowedTypes?: string;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      icon,
      onValueChange,
      currentFileName,
      description = "PDF, JPG, PNG até 10MB",
      allowedTypes = ".pdf,.jpg,.jpeg,.png",
      ...props
    },
    ref
  ) => {
    const [file, setFile] = React.useState<File | null>(null);
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
        if (onValueChange) {
          onValueChange(e.target.files[0]);
        }
      }
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setFile(e.dataTransfer.files[0]);
        if (onValueChange) {
          onValueChange(e.dataTransfer.files[0]);
        }
      }
    };

    const handleClear = () => {
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      if (onValueChange) {
        onValueChange(null);
      }
    };

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full",
          className
        )}
      >
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-md transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-neutral-300 hover:border-primary/50",
            file || currentFileName ? "bg-neutral-50" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleChange}
            accept={allowedTypes}
            ref={(e) => {
              // Handle both refs
              if (ref) {
                if (typeof ref === "function") {
                  ref(e);
                } else {
                  ref.current = e;
                }
              }
              inputRef.current = e;
            }}
            {...props}
          />

          {file || currentFileName ? (
            <div className="flex flex-col items-center">
              <File className="w-10 h-10 text-primary mb-2" />
              <p className="text-sm font-medium text-neutral-700 mb-1">
                {file ? file.name : currentFileName}
              </p>
              <p className="text-xs text-neutral-500 mb-3">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
              </p>
              {currentFileName && !file && (
                <div className="flex items-center text-xs text-success mb-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>Arquivo atual</span>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                <span>{file ? "Remover arquivo" : "Alterar arquivo"}</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {icon || <FileUp className="w-10 h-10 text-neutral-400 mb-2" />}
              <p className="mb-2 text-sm text-neutral-600">
                <span className="font-semibold text-primary hover:underline">
                  Clique para selecionar
                </span>{" "}
                ou arraste e solte
              </p>
              <p className="text-xs text-neutral-500">{description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

FileInput.displayName = "FileInput";
