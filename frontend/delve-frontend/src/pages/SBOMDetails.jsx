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
        const res = await axios.get(`/api/my-sboms/${id}`);
        setSbom(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSBOMDetails();
  }, [id]);

  const severityColors = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-400 text-black",
    low: "bg-green-400 text-black",
    unknown: "bg-gray-400 text-black",
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-20 px-6 min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600 text-center">Loading SBOM details...</p>
        </div>
      </>
    );
  }

  if (!sbom) {
    return (
      <>
        <Navbar />
        <div className="pt-20 px-6 min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-red-500 text-center">No SBOM found.</p>
        </div>
      </>
    );
  }

  const { name, spdxId, createdAt, s3Location, vulnReport } = sbom;

  return (
    <>
      <Navbar />
      <div className="pt-20 px-6 py-12 min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-blue-700 text-center">📄 SBOM Metadata</h1>

          <div className="bg-white shadow-md rounded-lg p-6 space-y-4 border border-gray-200">
            <p><strong>📁 File Name:</strong> {sbom.id}</p>
            <p><strong>📌 SPDX ID:</strong> {spdxId}</p>
            <p><strong>📦 Package Path:</strong> {name}</p>
            <p><strong>📅 Created At:</strong> {new Date(createdAt).toLocaleString()}</p>
            <p>
              <strong>☁️ S3 Location:</strong>{" "}
              <code className="text-sm text-gray-600 break-all">{s3Location}</code>
            </p>
          </div>

          {vulnReport && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4 text-red-700 text-center">
                🚨 Vulnerability Report
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(vulnReport.severityCounts).map(([severity, count]) => (
                  <div
                    key={severity}
                    className={`p-4 rounded-lg shadow text-center font-medium ${severityColors[severity] || severityColors.unknown}`}
                  >
                    <div className="text-base capitalize">{severity}</div>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-lg space-y-2">
                <p>
                  <strong>🔍 Total Vulnerabilities:</strong>{" "}
                  <span className="font-semibold">{vulnReport.totalVulnerabilities}</span>
                </p>
                <p>
                  <strong>🔥 Highest Severity:</strong>{" "}
                  <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      severityColors[vulnReport.highestSeverity] || severityColors.unknown
                    }`}
                  >
                    {vulnReport.highestSeverity.toUpperCase()}
                  </span>
                </p>
                <p className="text-sm text-gray-500 break-all">
                  🧾 Raw report stored at:{" "}
                  <code>{vulnReport.s3Location}</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SBOMDetails;
