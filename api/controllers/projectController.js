// controllers/projectController.js
const {
  putProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  getProjectSBOMs
} = require('../services/dynamoService');

/**
 * POST /api/projects
 * Create a new project
 */
async function createProject(req, res) {
  const { projectId, name, description, tags } = req.body;
  if (!projectId || !name) {
    return res.status(400).json({ error: 'projectId and name are required' });
  }

  try {
    await putProject(req.user.sub, projectId, { name, description, tags });
    res.status(201).json({ message: 'Project created' });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(409).json({ error: 'Project already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
}

/**
 * GET /api/projects
 * List all projects for the authenticated user
 */
async function getMyProjects(req, res) {
  try {
    const projects = await listProjects(req.user.sub);
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list projects' });
  }
}

/**
 * GET /api/projects/:projectId
 * Fetch a single project
 */
async function getProjectById(req, res) {
  try {
    const project = await getProject(req.user.sub, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
}

/**
 * PUT /api/projects/:projectId
 * Update a project (partial updates allowed)
 */
async function updateProjectById(req, res) {
  const { name, description, tags } = req.body;          // any/all optional
  if (!name && !description && !tags) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const updated = await updateProject(
      req.user.sub,
      req.params.projectId,
      { ...(name && { name }), ...(description && { description }), ...(tags && { tags }) }
    );
    res.json(updated);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update project' });
  }
}

/**
 * DELETE /api/projects/:projectId
 */
async function deleteProjectById(req, res) {
  try {
    await deleteProject(req.user.sub, req.params.projectId);
    res.status(204).end();
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
}

/**
 * GET /:projectId/sboms
 */
async function listSBOMsForProject(req, res) {
  try {
    const project = await getProject(req.user.sub, req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const sboms = await getProjectSBOMs(req.params.projectId);
    res.json(sboms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list SBOMs' });
  }
}

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
  listSBOMsForProject
};
