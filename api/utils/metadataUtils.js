function extractMetadata(sbomData) {
    return {
      spdxId: sbomData.SPDXID || 'Unknown',
      name: sbomData.name || 'Unnamed SBOM',
      creationInfo: sbomData.creationInfo?.created || new Date().toISOString(),
    };
  }

function extractVulnMetadata(vulnReport, s3Location) {
  const severityCounts = vulnReport.matches.reduce((acc, match) => {
    const severity = match.vulnerability.severity || 'UNKNOWN';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  return {
    s3Location,
    totalVulnerabilities: vulnReport.matches.length,
    severityCounts,
  };
}
  
  module.exports = { extractMetadata, extractVulnMetadata };
  