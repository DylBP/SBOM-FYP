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
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post('/api/uploadSBOM', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data);
      setMessage('Upload successful!');
        setTimeout(() => navigate('/'), 2000); 
    } catch (error) {
      console.error(error);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Upload SBOM File</h1>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <input
            type="file"
            accept=".spdx, .json, .xml"
            onChange={handleFileChange}
            className="border p-2"
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {message && (
            <div className="mt-4 text-center text-green-600 font-semibold">
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Upload;
