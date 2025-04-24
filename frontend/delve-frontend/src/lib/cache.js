const STORAGE_KEYS = {
    PROJECTS: "sbom_projects",
    SBOMS: "sbom_sbomsByProject",
  };
  
  const cache = {
    getProjects() {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },
  
    setProjects(data) {
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data));
      } catch(err) {
        console.warn("Failed to access localStorage:", err);
      }
    },
  
    clearProjects() {
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    },
  
    getSboms(projectId) {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.SBOMS);
        if (!data) return null;
        const allSboms = JSON.parse(data);
        return allSboms[projectId] || null;
      } catch {
        return null;
      }
    },
  
    setSboms(projectId, sbomData) {
      try {
        const allSboms = JSON.parse(localStorage.getItem(STORAGE_KEYS.SBOMS)) || {};
        allSboms[projectId] = sbomData;
        localStorage.setItem(STORAGE_KEYS.SBOMS, JSON.stringify(allSboms));
      } catch(err) {
        console.warn("Failed to access localStorage:", err);
      }
    },
  
    clearSboms(projectId) {
      try {
        const allSboms = JSON.parse(localStorage.getItem(STORAGE_KEYS.SBOMS)) || {};
        delete allSboms[projectId];
        localStorage.setItem(STORAGE_KEYS.SBOMS, JSON.stringify(allSboms));
      } catch(err) {
        console.warn("Failed to access localStorage:", err);
        }
    },
  
    clearAll() {
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.SBOMS);
    },
  };
  
  export default cache;
  