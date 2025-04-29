import { forwardRef } from "react";

const FileUploadInput = forwardRef(({ onFileChange }, ref) => {
    return (
        <div className="flex flex-col space-y-2">
            <label
                htmlFor="artifactUpload"
                className="text-sm font-medium text-gray-700"
            >
                Upload File
            </label>
            <input
                ref={ref}
                id="artifactUpload"
                type="file"
                accept=".zip,.tar"
                onChange={(e) => onFileChange(e.target.files[0])}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition"
            />
            <p className="text-xs text-gray-500">
                Accepted file types: <code>.zip</code>, <code>.tar</code>
            </p>
        </div>
    );
});

export default FileUploadInput;
