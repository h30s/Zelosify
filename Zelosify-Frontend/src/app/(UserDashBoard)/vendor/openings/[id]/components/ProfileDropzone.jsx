import { useDropzone } from "react-dropzone";
import { useCallback } from "react";
import { UploadCloud, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfileDropzone({
  filesToUpload,
  setFilesToUpload,
  onSubmit,
  isUploading,
}) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const valid = acceptedFiles.filter((f) => {
        const isPdf = f.name.endsWith(".pdf") || f.type === "application/pdf";
        const isPptx =
          f.name.endsWith(".pptx") ||
          f.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        return isPdf || isPptx;
      });

      if (valid.length < acceptedFiles.length) {
        toast.warning("Some files were skipped. Only PDF and PPTX files are allowed.");
      }
      setFilesToUpload((prev) => [...prev, ...valid]);
    },
    [setFilesToUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxSize: 25 * 1024 * 1024,
  });

  const removeFile = (idx) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-blue-600" />
          Upload Candidate Profiles
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Submit candidate resumes in PDF or PPTX formats.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {isDragActive
            ? "Drop candidate profiles here..."
            : "Drag & drop candidate profiles, or click to browse"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Supports multiple files • PDF and PPTX formats up to 25MB each
        </p>
      </div>

      {filesToUpload.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Selected Files ({filesToUpload.length})
          </div>
          <div className="space-y-2">
            {filesToUpload.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="text-gray-400 hover:text-red-500 transition p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onSubmit}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Profiles...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Submit {filesToUpload.length} Profile(s)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
