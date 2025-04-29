import { useState, useRef } from "react";
import axios from "../api/axios";
import FileUploadInput from "../components/generator/FileUploadInput";

const Generator = () => {
  const [inputType, setInputType] = useState("archive");
  const [imageName, setImageName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const fileInputRef = useRef();

  const resetInputs = (selectedType) => {
    if (!["archive", "oci-archive"].includes(selectedType)) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (!["docker", "registry"].includes(selectedType)) {
      setImageName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDownloadUrl(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (file) formData.append("artifact", file);
      formData.append("inputType", inputType);
      if (imageName) formData.append("image", imageName);

      const res = await axios.post("/api/generator/generateSBOM", formData, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      setDownloadUrl(blobUrl);
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to generate SBOM. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showFileInput = ["archive", "oci-archive"].includes(inputType);
  const showImageInput = ["docker", "registry"].includes(inputType);

  return (
    <>
      <main className="pt-20 px-6 py-12 min-h-screen bg-gray-100">
        <section className="max-w-xl mx-auto bg-white p-8 rounded shadow-md border border-gray-200">
          <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">
            Generate SBOM
          </h1>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-100 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Type Dropdown */}
            <div>
              <label
                htmlFor="inputType"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Input Type
              </label>
              <select
                id="inputType"
                value={inputType}
                onChange={(e) => {
                  const selected = e.target.value;
                  setInputType(selected);
                  resetInputs(selected);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="archive">Archive (.zip)</option>
                <option value="oci-archive">OCI Archive (.tar)</option>
                <option value="docker">Docker Image (local)</option>
                <option value="registry">Registry Image (remote)</option>
              </select>
            </div>

            {/* File Upload */}
            {showFileInput && (
              <FileUploadInput ref={fileInputRef} onFileChange={setFile} />
            )}

            {/* Image Name Input */}
            {showImageInput && (
              <div>
                <label
                  htmlFor="imageName"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Image Name
                </label>
                <input
                  id="imageName"
                  type="text"
                  placeholder="e.g., node:18-alpine"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-2 px-4 rounded-md transition ${loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500"
                }`}
            >
              {loading ? "Generating..." : "Generate SBOM"}
            </button>
          </form>

          {downloadUrl && (
            <div className="mt-6 text-center">
              <a
                href={downloadUrl}
                download="sbom.json"
                className="text-indigo-600 font-medium hover:underline"
              >
                Download SBOM
              </a>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Generator;
