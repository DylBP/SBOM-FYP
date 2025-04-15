import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await axios.post("/api/uploadSBOM", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response.data);
      setMessage("✅ Upload successful!");
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error(error);
      setMessage("❌ Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col justify-center pt-20 px-6 py-12 bg-gray-100 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Upload SBOM File
          </h1>

          <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
            <div>
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium text-gray-700"
              >
                Select a .spdx, .json, or .xml file:
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".spdx, .json, .xml"
                onChange={handleFileChange}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>

            {message && (
              <div
                className={`text-center font-semibold ${
                  message.includes("failed") ? "text-red-600" : "text-green-600"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Upload;
