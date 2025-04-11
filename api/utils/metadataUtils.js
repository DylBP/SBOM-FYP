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
  
    const affectedPackages = vulnReport.matches.map(match => ({
      packageName: match.artifact.name,
      packageVersion: match.artifact.version,
      packageType: match.artifact.type,
      severity: match.vulnerability.severity,
      cve: match.vulnerability.id, // CVE ID
    }));
  
    const topCVEs = vulnReport.matches
      .filter(match => match.vulnerability.severity === 'Critical' || match.vulnerability.severity === 'High')
      .map(match => ({
        cve: match.vulnerability.id,
        severity: match.vulnerability.severity,
        packageName: match.artifact.name,
      }))
      .slice(0, 5); // Limit to top 5 critical/high CVEs
  
    const packageTypeDistribution = vulnReport.matches.reduce((acc, match) => {
      const type = match.artifact.type || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  
    return {
      s3Location,
      totalVulnerabilities: vulnReport.matches.length,
      severityCounts,
      affectedPackages,
      topCVEs,
      packageTypeDistribution,
      grypeVersion: vulnReport.descriptor?.version || 'Unknown', // Grype version if available
    };
  }

  function normalizeSeverityCounts(severityCounts) {
    const normalized = {};
    for (const key in severityCounts) {
      if (severityCounts.hasOwnProperty(key)) {
        normalized[key.toLowerCase()] = severityCounts[key];
      }
    }
    return normalized;
  }
  
  
  module.exports = { extractMetadata, extractVulnMetadata, normalizeSeverityCounts };
  