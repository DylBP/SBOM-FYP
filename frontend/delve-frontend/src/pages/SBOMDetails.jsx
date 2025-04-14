import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const SBOMDetails = () => {
  const { id } = useParams();
  const [sbom, setSbom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSBOMDetails = async () => {
      try {
        const res = await axios.get(`/sbom/${id}`);  // <-- API call to fetch SBOM details
        setSbom(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSBOMDetails();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="p-6">
          <p>Loading SBOM details...</p>
        </div>
      </>
    );
  }

  if (!sbom) {
    return (
      <>
        <Navbar />
        <div className="p-6">
          <p>No SBOM found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">SBOM Details</h1>

        <div className="space-y-2">
          <p><strong>File Name:</strong> {sbom.fileName || 'Unknown'}</p>
          <p><strong>Uploaded At:</strong> {sbom.uploadDate || 'Unknown'}</p>

          {/* Example if your API sends vulnerabilities or metadata */}
          {sbom.vulnerabilities && sbom.vulnerabilities.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Vulnerabilities</h2>
              <ul className="list-disc pl-6">
                {sbom.vulnerabilities.map((vuln, index) => (
                  <li key={index}>
                    {vuln.name} - {vuln.severity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SBOMDetails;
