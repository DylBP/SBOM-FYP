import { useState, useRef } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const Generator = () => {
  const [inputType, setInputType] = useState("archive");
  const [imageName, setImageName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const fileInputRef = useRef();

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

      const url = window.URL.createObjectURL(new Blob([res.data]));
      setDownloadUrl(url);
    } catch (err) {
      console.error(err);
      setError("Failed to generate SBOM.");
    } finally {
      setLoading(false);
    }
  };

  const showFileInput = ["archive", "oci-archive"].includes(inputType);
  const showImageInput = ["docker", "registry"].includes(inputType);

  return (
    <>
      <Navbar />
      <div className="pt-20 px-6 py-12 min-h-screen bg-gray-100">
        <div className="max-w-xl mx-auto bg-white p-8 rounded shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-center text-indigo-700">
            🛠️ Generate SBOM
          </h1>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Type Dropdown */}
            <div>
              <label className="block mb-2 font-medium text-sm text-gray-700">
                Input Type
              </label>
              <select
                value={inputType}
                onChange={(e) => {
                  const selected = e.target.value;
                  setInputType(selected);

                  if (!["archive", "oci-archive"].includes(selected)) {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }
                  if (!["docker", "registry"].includes(selected)) {
                    setImageName("");
                  }
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
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Upload File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.tar"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700"
                />
              </div>
            )}

            {/* Image Input */}
            {showImageInput && (
              <div>
                <label className="block mb-2 font-medium text-sm text-gray-700">
                  Image Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., node:18-alpine"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition"
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
                📥 Download SBOM
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Generator;
