import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import PageContainer from '../../components/container/PageContainer';
import FVProject from '../../components/forms/form-validation/FVProject';
import ProjectModal from './ProjectModal';
import api, { fetchProjects, createProject, updateProject, deleteProject } from 'src/utils/api';

const ProjectTable = ({ projects, onView, onEdit, onDelete }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 440 }}>
    <Table stickyHeader aria-label="project table">
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              ชื่อโครงการ
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              รหัสโครงการ
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              Status
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              ชั้น
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              ชิ้นงาน
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              Actions
            </Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {projects.map((project) => (
          <TableRow hover key={project.id}>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="600">
                {project.name}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="600">
                {project.project_code}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                sx={{
                  bgcolor:
                    project.status === 'In Progress'
                      ? (theme) => theme.palette.warning.light
                      : project.status === 'Completed'
                      ? (theme) => theme.palette.success.light
                      : project.status === 'Delayed'
                      ? (theme) => theme.palette.error.light
                      : (theme) => theme.palette.secondary.light,
                  color:
                    project.status === 'In Progress'
                      ? (theme) => theme.palette.warning.main
                      : project.status === 'Completed'
                      ? (theme) => theme.palette.success.main
                      : project.status === 'Delayed'
                      ? (theme) => theme.palette.error.main
                      : (theme) => theme.palette.secondary.main,
                  borderRadius: '8px',
                }}
                size="small"
                label={project.status}
              />
            </TableCell>
            <TableCell>
              <Typography color="textSecondary" variant="subtitle2">
                {project.sections}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography color="textSecondary" variant="subtitle2">
                {project.components}
              </Typography>
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={1}>
                <Button onClick={() => onView(project)} variant="contained" color="primary" size="small">
                  View
                </Button>
                <Button onClick={() => onEdit(project)} variant="contained" color="secondary" size="small">
                  Edit
                </Button>
                <Button onClick={() => onDelete(project.id)} variant="contained" color="error" size="small">
                  Delete
                </Button>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);


const FormProject = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProjectsData = async () => {
    try {
      const token = localStorage.getItem('token');
      api.setToken(token);
      const response = await fetchProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, []);

  const handleAddProject = async (newProject) => {
    try {
      const token = localStorage.getItem('token');
      api.setToken(token);
      await createProject(newProject);
      fetchProjectsData();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project: ' + error.message);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleUpdateProject = async (updatedProject) => {
    try {
      const token = localStorage.getItem('token');
      api.setToken(token);
      await updateProject(updatedProject.id, updatedProject);
      fetchProjectsData();
      setModalOpen(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project: ' + error.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      if (window.confirm('Are you sure you want to delete this project and ALL associated data? This action cannot be undone.')) {
        const token = localStorage.getItem('token');
        api.setToken(token);
        await deleteProject(projectId);
        fetchProjectsData(); // Refresh the project list
        alert('Project and all associated data deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project and its associated data: ' + (error.response?.data?.details || error.message));
    }
  };
  return (
    <PageContainer title="สร้างโครงการใหม่" description="This is the form to create a new project.">
      <Grid container spacing={2}>
        <Grid item xs={12} lg={6}>
          <div className="mes-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: '17px', color: 'var(--ink)' }}>
              ภาพรวมโครงการ
            </div>
            <div style={{ padding: '20px' }}>
              <ProjectTable projects={projects} onView={handleViewProject} onEdit={handleEditProject} onDelete={handleDeleteProject} />
            </div>
          </div>
        </Grid>
        <Grid item xs={12} lg={6}>
          <div className="mes-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: '17px', color: 'var(--ink)' }}>
              สร้างโครงการใหม่
            </div>
            <div style={{ padding: '20px' }}>
              <FVProject onAddProject={handleAddProject} />
            </div>
          </div>
        </Grid>
      </Grid>
      <ProjectModal
        open={isModalOpen}
        project={selectedProject}
        onClose={() => setModalOpen(false)}
        onSave={handleUpdateProject}
        isEditing={isEditing}
      />
    </PageContainer>
  );
};

export default FormProject;
