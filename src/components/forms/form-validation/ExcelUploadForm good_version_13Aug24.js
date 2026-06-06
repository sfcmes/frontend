import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { createComponent, fetchProjects, addComponentHistory, fetchSectionsByProjectId } from 'src/utils/api'; // Adjust the path based on your file structure
import DataTable from './DataTable';

const ExcelUploadForm = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [sections, setSections] = useState([]);

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
    console.log('File selected:', file.name);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        console.log('Workbook sheets:', workbook.SheetNames);

        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];

        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        console.log('Parsed data (first row):', jsonData[0]);
        console.log('Parsed data (second row):', jsonData[1]);

        if (jsonData.length > 1) {
          const headers = jsonData[0];
          const formattedData = jsonData.slice(1).map(row => {
            return headers.reduce((obj, header, index) => {
              const trimmedHeader = header.trim();
              obj[trimmedHeader] = row[index];
              return obj;
            }, {});
          });
          console.log('Converted JSON data (first item):', formattedData[0]);
          setData(formattedData);
          setError(null);
        } else {
          setError('No data found in the Excel file.');
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setError(`Error parsing Excel file: ${error.message}`);
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setError('Error reading the file. Please try again.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveToDatabase = async () => {
    if (!data.length) {
      setError('No data available to save.');
      return;
    }

    if (!selectedProject) {
      setError('Please select a project name.');
      return;
    }

    try {
      const savePromises = data.map(async (component) => {
        // Map section name to UUID
        const section = sections.find(sec => sec.name === component['Section Name']);
        const section_id = section ? section.id : null;

        if (!section_id) {
          throw new Error(`Section Name ${component['Section Name']} not found in the selected project.`);
        }

        const componentData = {
          id: uuidv4(),
          section_id: section_id, // Ensure section_id is a UUID
          name: component['Component Name'] || '',
          type: component['Component Type'] || '',
          width: component['Width'] || 0,
          height: component['Height'] || 0,
          thickness: component['Thickness'] || 0,
          extension: component['Extension'] || 0,
          reduction: component['Reduction'] || 0,
          area: component['Area'] || 0,
          volume: component['Volume'] || 0,
          weight: component['Weight'] || 0,
          status: component['Status'] || 'Pending',
        };
        return createComponent(componentData);
      });

      await Promise.all(savePromises);

      setSaveMessage('Data saved successfully');
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveMessage('Error saving data. Please check the console for details.');
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        อัปโหลดไฟล์ Excel สำหรับการอัปเดตข้อมูลจำนวนมาก
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
      <input
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span">
          อัปโหลดไฟล์ Excel
        </Button>
      </label>
      {error && (
        <Typography color="error" style={{ marginTop: '10px' }}>
          {error}
        </Typography>
      )}
      {data.length > 0 && (
        <>
          <Typography style={{ marginTop: '10px' }}>
            Loaded {data.length} rows of data.
          </Typography>
          <DataTable data={data} />
          <Button
            variant="contained"
            color="primary"
            style={{ marginTop: '10px' }}
            onClick={handleSaveToDatabase}
          >
            บันทึกในฐานข้อมูล
          </Button>
          {saveMessage && (
            <Typography style={{ marginTop: '10px', color: 'green' }}>
              {saveMessage}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default ExcelUploadForm;
