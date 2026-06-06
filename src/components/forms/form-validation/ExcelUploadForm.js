import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, FormControl, InputLabel, Select, MenuItem, LinearProgress, Modal, Backdrop, Fade } from '@mui/material';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import {
  createComponent,
  fetchProjects,
  addComponentHistory,
  fetchSectionsByProjectId,
  fetchSectionByName,
  createSection, // Ensure this is imported
} from 'src/utils/api';
import DataTable from './DataTable';

const columnMapping = {
  'ชื่อชั้น': 'section_name',
  'ชื่อชิ้นงาน': 'name',
  'ประเภทชิ้นงาน': 'type',
  'ความกว้าง (มม.)': 'width',
  'ความสูง (มม.)': 'height',
  'ความหนา (มม.)': 'thickness',
  'ส่วนเพิ่ม (ตร.ม.)': 'extension',
  'ส่วนลด (ตร.ม.)': 'reduction',
  'พื้นที่ (ตร.ม.)': 'area',
  'ปริมาตร (ลบ.ม.)': 'volume',
  'น้ำหนัก (ตัน)': 'weight',
  'สถานะ': 'status',
};

const excelHeaders = Object.keys(columnMapping);

const ExcelUploadForm = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false); // State for controlling modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectResponse = await fetchProjects();
        setProjects(projectResponse.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Error fetching projects. Please check the console for details.');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (selectedProject) {
        try {
          const sectionResponse = await fetchSectionsByProjectId(selectedProject);
          setSections(sectionResponse.data);
        } catch (error) {
          console.error('Error fetching sections:', error);
          setError('Error fetching sections. Please check the console for details.');
        }
      }
    };
    fetchSections();
  }, [selectedProject]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (jsonData.length > 1) {
          const headers = jsonData[0];
          const formattedData = jsonData.slice(1).map((row) => {
            const obj = {};
            headers.forEach((header, index) => {
              const trimmedHeader = header.trim();
              const mappedKey = columnMapping[trimmedHeader] || trimmedHeader;
              obj[mappedKey] = row[index] || null;
            });
            return obj;
          });

          console.log('Converted JSON data (first item):', formattedData[0]);
          setData(formattedData);
          setError(null);
        } else {
          setError('No data in Excel file.');
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setError(`Error parsing Excel file: ${error.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateExcelData = (data) => {
    const errors = [];
    const warnings = [];

    const parseNumber = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const cleanedValue = String(value).replace(/[^\d.,]/g, '');
      const normalizedValue = cleanedValue.replace(',', '.');
      return parseFloat(normalizedValue);
    };

    const requiredFields = ['section_name', 'component_name', 'width', 'area'];
    const optionalNumericFields = [
      'height',
      'thickness',
      'extension',
      'reduction',
      'volume',
      'weight',
    ];

    data.forEach((component, index) => {
      requiredFields.forEach((field) => {
        if (!component[field]) {
          const thaiFieldName = Object.keys(columnMapping).find(
            (key) => columnMapping[key] === field,
          );
          errors.push(`Row ${index + 2}: Missing required field ${thaiFieldName}`);
        } else if (['width', 'area'].includes(field)) {
          const value = parseNumber(component[field]);
          if (value === null || isNaN(value)) {
            const thaiFieldName = Object.keys(columnMapping).find(
              (key) => columnMapping[key] === field,
            );
            errors.push(`Row ${index + 2}: Invalid ${thaiFieldName} (must be a number)`);
          } else {
            component[field] = value;
          }
        }
      });

      optionalNumericFields.forEach((field) => {
        const value = parseNumber(component[field]);
        if (value !== null) {
          if (isNaN(value)) {
            const thaiFieldName = Object.keys(columnMapping).find(
              (key) => columnMapping[key] === field,
            );
            warnings.push(
              `Row ${index + 2}: Invalid ${thaiFieldName} (must be a number if provided)`,
            );
          } else {
            component[field] = value;
          }
        }
      });
    });

    return { errors, warnings };
  };

  const handleSaveToDatabase = async () => {
    setError(null);
    setSaveMessage('');
    setProgress(0);
    setModalOpen(true);
  
    if (!data.length) {
      setError('No data to save.');
      setModalOpen(false);
      return;
    }
  
    if (!selectedProject) {
      setError('Please select a project.');
      setModalOpen(false);
      return;
    }
  
    try {
      const sectionsResponse = await fetchSectionsByProjectId(selectedProject);
      let sections = Array.isArray(sectionsResponse) ? sectionsResponse : sectionsResponse.data;
  
      if (!Array.isArray(sections)) {
        throw new Error('Invalid sections data received from the server');
      }
  
      const errors = [];
      const successfulSaves = [];
      const totalComponents = data.length;
  
      for (let i = 0; i < totalComponents; i++) {
        const component = data[i];
        try {
          if (!component.name) {
            throw new Error('Component name is missing');
          }
  
          let matchingSection = sections.find(section => section.name === component.section_name);
          
          if (!matchingSection) {
            console.log(`Section "${component.section_name}" not found, creating it.`);
            try {
              matchingSection = await createSection({
                name: component.section_name,
                project_id: selectedProject,
                status: 'planning'
              });
              sections.push(matchingSection); // Add the new section to our local array
            } catch (createSectionError) {
              if (createSectionError.response && createSectionError.response.status === 409) {
                // If the section already exists (409 Conflict), fetch it instead
                matchingSection = await fetchSectionByName(selectedProject, component.section_name);
              } else {
                throw new Error(`Failed to create section "${component.section_name}": ${createSectionError.message}`);
              }
            }
          }
  
          const componentData = {
            id: uuidv4(),
            section_id: matchingSection.id,
            name: component.name,
            type: component.type || null,
            width: component.width ? parseFloat(component.width) : null,
            height: component.height ? parseFloat(component.height) : null,
            thickness: component.thickness ? parseFloat(component.thickness) : null,
            extension: component.extension ? parseFloat(component.extension) : null,
            reduction: component.reduction ? parseFloat(component.reduction) : null,
            area: component.area ? parseFloat(component.area) : null,
            volume: component.volume ? parseFloat(component.volume) : null,
            weight: component.weight ? parseFloat(component.weight) : null,
            status: component.status || 'planning'
          };
  
          const createdComponent = await createComponent(componentData);
          console.log('Component created:', createdComponent);
  
          successfulSaves.push(component.name);
          setProgress(Math.floor(((i + 1) / totalComponents) * 100));
        } catch (error) {
          console.error('Error processing component:', error);
          errors.push(`Error saving component "${component.name}": ${error.message}`);
        }
      }
  
      if (errors.length > 0) {
        setError(`Encountered ${errors.length} error(s) while saving:\n${errors.join('\n')}`);
      }
  
      if (successfulSaves.length > 0) {
        setSaveMessage(`Successfully saved ${successfulSaves.length} component(s).`);
      } else {
        setSaveMessage('No components were saved successfully.');
      }
  
    } catch (error) {
      setError('Error processing data: ' + error.message);
    } finally {
      setModalOpen(false);
    }
  };
  

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([excelHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'component_upload_template.xlsx');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        อัพโหลดไฟล์ Excel สำหรับการอัพเดตข้อมูลจำนวนมาก
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel id="project-select-label">เลือกโครงการ</InputLabel>
        <Select
          labelId="project-select-label"
          id="project-select"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
        <Button variant="contained" color="secondary" onClick={handleDownloadTemplate}>
          ดาวน์โหลดแม่แบบ Excel
        </Button>
        <input
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="raised-button-file">
          <Button variant="contained" component="span">
            อัพโหลดไฟล์ Excel
          </Button>
        </label>
      </Box>

      {error && (
        <Typography color="error" style={{ marginTop: '10px', whiteSpace: 'pre-line' }}>
          {error}
        </Typography>
      )}

      {data.length > 0 && (
        <>
          <Typography style={{ marginTop: '10px' }}>Loaded {data.length} rows of data.</Typography>
          <DataTable
            data={data}
            columns={excelHeaders.map((header) => ({
              field: columnMapping[header],
              headerName: header,
              flex: 1,
            }))}
          />

          <Button
            variant="contained"
            color="primary"
            style={{ marginTop: '10px' }}
            onClick={handleSaveToDatabase}
          >
            บันทึกในฐานข้อมูล
          </Button>

          {saveMessage && (
            <Typography style={{ marginTop: '10px', color: 'green' }}>{saveMessage}</Typography>
          )}
        </>
      )}

      {/* Modal for progress bar */}
      <Modal
        open={modalOpen}
        onClose={() => {}}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={modalOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            outline: 'none',
          }}>
            <Typography variant="h6" component="h2">
              Processing...
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {`Progress: ${progress}%`}
            </Typography>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ExcelUploadForm;
