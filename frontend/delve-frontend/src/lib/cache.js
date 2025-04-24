const cache = {
    projects: null,
    sbomsByProject: {},
  
    getProjects() {
      return this.projects;
    },
    setProjects(data) {
      this.projects = data;
    },
    clearProjects() {
      this.projects = null;
    },
  
    getSboms(projectId) {
      return this.sbomsByProject[projectId];
    },
    setSboms(projectId, data) {
      this.sbomsByProject[projectId] = data;
    },
    clearSboms(projectId) {
      delete this.sbomsByProject[projectId];
    },
  
    clearAll() {
      this.projects = null;
      this.sbomsByProject = {};
    }
  };
  
  export default cache;
  