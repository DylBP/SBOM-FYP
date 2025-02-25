function extractMetadata(sbomData) {
    return {
      spdxId: sbomData.SPDXID || 'Unknown',
      name: sbomData.name || 'Unnamed SBOM',
      creationInfo: sbomData.creationInfo?.created || new Date().toISOString(),
    };
  }
  
  module.exports = { extractMetadata };
  