import { get, set, del } from 'idb-keyval';

const STORAGE_KEYS = {
    PROJECTS: "sbom_projects",
    SBOMS: "sbom_sbomsByProject",
    PARSED_SBOMS: "sbom_parsed", 
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
        } catch (err) {
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
        } catch (err) {
            console.warn("Failed to access localStorage:", err);
        }
    },

    clearSboms(projectId) {
        try {
            const allSboms = JSON.parse(localStorage.getItem(STORAGE_KEYS.SBOMS)) || {};
            delete allSboms[projectId];
            localStorage.setItem(STORAGE_KEYS.SBOMS, JSON.stringify(allSboms));
        } catch (err) {
            console.warn("Failed to clear SBOM:", err);
        }
    },

    getAllSboms() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SBOMS);
            if (!data) return [];
            const allSbomsByProject = JSON.parse(data);
            return Object.values(allSbomsByProject).flat();
        } catch {
            return [];
        }
    },

    clearAll() {
        localStorage.removeItem(STORAGE_KEYS.PROJECTS);
        localStorage.removeItem(STORAGE_KEYS.SBOMS);
    },

    async getParsed(sbomId) {
        try {
            const parsed = await get(`${STORAGE_KEYS.PARSED_SBOMS}_${sbomId}`);
            return parsed || null;
        } catch (err) {
            console.warn("Failed to get parsed SBOM from IndexedDB:", err);
            return null;
        }
    },

    async setParsed(sbomId, parsedData) {
        try {
            await set(`${STORAGE_KEYS.PARSED_SBOMS}_${sbomId}`, parsedData);
        } catch (err) {
            console.warn("Failed to set parsed SBOM in IndexedDB:", err);
        }
    },

    async clearParsed(sbomId) {
        try {
            await del(`${STORAGE_KEYS.PARSED_SBOMS}_${sbomId}`);
        } catch (err) {
            console.warn("Failed to clear parsed SBOM in IndexedDB:", err);
        }
    }
};

export default cache;
