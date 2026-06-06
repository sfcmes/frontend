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
import Breadcrumb from '../../layouts/full/shared/breadcrumb/Breadcrumb';
import ParentCard from 'src/components/shared/ParentCard';
import EditSectionModal from './EditSectionModal'; // Import the EditSectionModal component
import FVSection from '../../components/forms/form-validation/FVSection'; // Import FVSection
import api, { createSection, updateSection, deleteSection } from '../../utils/api';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'สร้างข้อมูลชั้นแต่ละโครงการ' }];

const SectionTable = ({ sections, onEdit, onDelete }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 440 }}>
    <Table stickyHeader aria-label="section table">
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              ชื่อโครงการ
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              ชั้น
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="h6" fontWeight="500">
              Status
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
        {sections.map((section) => (
          <TableRow hover key={section.id}>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="600">
                {section.project_name}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="600">
                {section.name}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip
                sx={{
                  bgcolor:
                    section.status === 'in_progress'
                      ? (theme) => theme.palette.warning.light
                      : section.status === 'completed'
                      ? (theme) => theme.palette.success.light
                      : section.status === 'on_hold'
                      ? (theme) => theme.palette.error.light
                      : (theme) => theme.palette.secondary.light,
                  color:
                    section.status === 'in_progress'
                      ? (theme) => theme.palette.warning.main
                      : section.status === 'completed'
                      ? (theme) => theme.palette.success.main
                      : section.status === 'on_hold'
                      ? (theme) => theme.palette.error.main
                      : (theme) => theme.palette.secondary.main,
                  borderRadius: '8px',
                }}
                size="small"
                label={section.status.charAt(0).toUpperCase() + section.status.slice(1).replace('_', ' ')}
              />
            </TableCell>
            <TableCell>
              <Typography color="textSecondary" variant="subtitle2">
                {section.components || 'N/A'}
              </Typography>
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={1}>
                <Button onClick={() => onEdit(section)} variant="contained" color="secondary" size="small">
                  Edit
                </Button>
                <Button onClick={() => onDelete(section.id)} variant="contained" color="error" size="small">
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

const FormSection = () => {
  const [sections, setSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchSections = async () => {
    try {
      const response = await api.get('/sections');
      const data = response.data;

      // Sort sections by project name first, then by section name
      const sortedSections = data.sort((a, b) => {
        if (a.project_name < b.project_name) return -1;
        if (a.project_name > b.project_name) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

      setSections(sortedSections);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleAddSection = async (newSection) => {
    try {
      await createSection(newSection);
      fetchSections(); // Refresh the sections list after adding a new section
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const handleEditSection = async (updatedSection) => {
    try {
      await updateSection(updatedSection.id, updatedSection);
      fetchSections(); // Refresh the sections list after editing
      setIsEditModalOpen(false); // Close the modal after editing
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      await deleteSection(sectionId);
      fetchSections(); // Refresh the sections list after deletion
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const handleOpenEditModal = (section) => {
    setEditingSection(section);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <PageContainer title="สร้างชั้นของแต่ละโครงการ" description="this is Form create new project page">
      <Breadcrumb title="สร้างชั้นของแต่ละโครงการ" items={BCrumb} />
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <ParentCard title="ภาพรวมแต่ละชั้นของแต่ละโครงการ">
            <SectionTable 
              sections={sections} 
              onEdit={handleOpenEditModal} 
              onDelete={handleDeleteSection} 
            />
          </ParentCard>
        </Grid>
        <Grid item xs={12} lg={6}>
          <ParentCard title="สร้างชั้นของแต่ละโครงการ">
            <FVSection onAddSection={handleAddSection} />
          </ParentCard>
        </Grid>
      </Grid>
      <EditSectionModal 
        open={isEditModalOpen} 
        onClose={handleCloseEditModal} 
        section={editingSection} 
        onSave={handleEditSection} 
        isEditing={true} // Ensure this modal is always used for editing
      />
    </PageContainer>
  );
};

export default FormSection;
