import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import cache from "../lib/cache";

const SBOMDetails = () => {
  const { id } = useParams();
  const [sbom, setSbom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parsed, setParsed] = useState(null);
  const [parsedLoading, setParsedLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [vulnSearch, setVulnSearch] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const allProjects = cache.getProjects();
        let foundSbom = null;

        const allSboms = cache.getAllSboms();
        if (Array.isArray(allSboms) && allSboms.length > 0) {
          foundSbom = allSboms.find(s => s.id === id);
        }

        if (foundSbom) {
          setSbom(foundSbom);
          const project = allProjects?.find(p => p.projectId === foundSbom.projectId);
          if (project) setProjectName(project.name);
        } else {
          const metaRes = await axios.get(`/api/my-sboms/${id}`);
          setSbom(metaRes.data);
          const project = allProjects?.find(p => p.projectId === metaRes.data.projectId);
          if (project) setProjectName(project.name);
        }

        const cachedParsed = cache.getParsed(id);
        if (cachedParsed) {
          setParsed(cachedParsed);
        } else {
          const parsedRes = await axios.get(`/api/${id}/parsed`);
          cache.setParsed(id, parsedRes.data);
          setParsed(parsedRes.data);
        }
      } catch (err) {
        console.error("Error fetching SBOM or parsed content:", err);
      } finally {
        setLoading(false);
        setParsedLoading(false);
      }
    };

    fetchDetails();
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
      <div className="pt-20 px-6 min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-center">Loading SBOM details...</p>
      </div>
    );
  }

  if (!sbom) {
    return (
      <div className="pt-20 px-6 min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 text-center">No SBOM found.</p>
      </div>
    );
  }

  const { name, createdAt, s3Location, vulnReport } = sbom;

  const filteredComponents = parsed?.sbom?.components?.filter((comp) =>
    comp.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVulns = parsed?.vulnReport?.matches?.filter((match) =>
    match.artifact?.name?.toLowerCase().includes(vulnSearch.toLowerCase()) ||
    match.vulnerability?.id?.toLowerCase().includes(vulnSearch.toLowerCase())
  );

  return (
    <>
      <div className="pt-20 px-6 py-12 min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-blue-700 text-center">
            <p>📁 File Name: {sbom.id.split('_')[1]}</p>
          </h1>

          <div className="bg-white shadow-md rounded-lg p-6 space-y-4 border border-gray-200">
            <p><strong>📽️ Project Name:</strong> {projectName}</p>
            <p><strong>📁 File Name:</strong> {sbom.id}</p>
            <p><strong>📦 Package Path:</strong> {name}</p>
            <p><strong>📅 Created At:</strong> {new Date(createdAt).toLocaleString()}</p>
            <p>
              <strong>☁️ S3 Location:</strong>{" "}
              <code className="text-sm text-gray-600 break-all">{s3Location}</code>
            </p>
          </div>

          {/* Parsed SBOM Component List with Search */}
          {!parsedLoading && parsed?.sbom?.components && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4 text-blue-700 text-center">📦 Components</h2>

              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4"
              />

              <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-[500px] overflow-y-auto text-sm">
                {filteredComponents?.length > 0 ? (
                  <ul className="space-y-4">
                    {filteredComponents.map((comp, idx) => {
                      const language = comp.properties?.find(p => p.name === "syft:package:language")?.value || "Unknown";
                      const location = comp.properties?.find(p => p.name === "syft:file:location")?.value || "Unknown";
                      const license = comp.licenses?.[0]?.license?.id || "Unknown";
                      return (
                        <li key={idx} className="border-b pb-3">
                          <p><strong>{comp.name}</strong> {comp.version && `v${comp.version}`}</p>
                          <p className="text-gray-600">
                            📦 Type: {comp.type || "Unknown"} | 🧠 Lang: {language} | 🪪 License: {license}
                            <br />
                            📁 Path: {location}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-500">No components match your search.</p>
                )}
              </div>
            </div>
          )}

          {/* Raw Vuln Summary */}
          {vulnReport && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4 text-red-700 text-center">
                🚨 Vulnerability Report Summary
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
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${severityColors[vulnReport.highestSeverity] || severityColors.unknown
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

          {/* Parsed Grype Report */}
          {!parsedLoading && parsed?.vulnReport?.matches?.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4 text-red-700 text-center">
                📊 Parsed Vulnerabilities (Grype)
              </h2>

              <input
                type="text"
                placeholder="Search by package or vuln ID..."
                value={vulnSearch}
                onChange={(e) => setVulnSearch(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4"
              />

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredVulns?.length > 0 ? (
                  filteredVulns.map((match, idx) => {
                    const vuln = match.vulnerability;
                    const artifact = match.artifact;
                    const related = match.relatedVulnerabilities?.[0];
                    const fix = vuln.fix?.versions?.[0] || "N/A";
                    const baseScore = vuln.cvss?.[0]?.metrics?.baseScore ?? "N/A";
                    const cve = vuln.epss?.[0]?.cve ?? related?.id ?? "N/A";
                    const referenceUrl = related?.urls?.[0] || vuln.dataSource;

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg shadow-md p-4"
                      >
                        <p><strong>📦 Package:</strong> {artifact.name} {artifact.version} ({artifact.type})</p>
                        <p><strong>🛡 Vulnerability:</strong> {vuln.id}</p>
                        <p><strong>⚠️ Severity:</strong> <span className="capitalize">{vuln.severity}</span></p>
                        <p><strong>🧾 CVE:</strong> {cve}</p>
                        <p><strong>📝 Description:</strong> {vuln.description}</p>
                        <p><strong>📊 CVSS Score:</strong> {baseScore}</p>
                        <p><strong>🧯 Fixed In:</strong> {fix}</p>
                        {referenceUrl && (
                          <p className="text-blue-600 mt-1">
                            <a href={referenceUrl} target="_blank" rel="noopener noreferrer">
                              🔗 Reference
                            </a>
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No vulnerabilities match your search.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SBOMDetails;
