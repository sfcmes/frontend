import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Modal, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import { fetchProjects, fetchComponentsByProjectId, fetchProjectById, fetchSectionById, fetchSectionsByProjectId } from 'src/utils/api';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';


const QRCodePage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [components, setComponents] = useState([]);
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeDetails, setQrCodeDetails] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterType, setFilterType] = useState('');
  const qrCodeRef = useRef(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetchProjects();
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    loadProjects();
  }, []);

  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    setSelectedProject(projectId);
    try {
      const response = await fetchComponentsByProjectId(projectId);
      const sectionResponse = await fetchSectionsByProjectId(projectId);
      setComponents(response || []);
      setSections(sectionResponse.data || []);
    } catch (error) {
      console.error('Error fetching components or sections:', error);
      setComponents([]);
      setSections([]);
    }
  };

  const handleQRCodeClick = async (component) => {
    try {
      const projectResponse = await fetchProjectById(selectedProject);
      const sectionResponse = await fetchSectionById(component.section_id);
      const sectionName = sectionResponse.data ? sectionResponse.data.name : 'N/A';

      const qrCodeDetails = `โครงการ: ${projectResponse.data.name}\nชั้น: ${sectionName}\nชื่อชิ้นงาน: ${component.name}`;
      setQrCodeDetails(qrCodeDetails);
      const qrCodeData = {
        project: projectResponse.data.name,
        section: sectionName,
        name: component.name,
        type: component.type,
        width: component.width,
        height: component.height,
        thickness: component.thickness,
        extension: component.extension,
        reduction: component.reduction,
        area: component.area,
        volume: component.volume,
        weight: component.weight,
        status: component.status
      };
      setQrCodeData(JSON.stringify(qrCodeData));
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching project/section details:', error);
    }
  };

  const handleSave = async (component, sectionName, projectName) => {
    try {
      const qrCodeElement = await createQRCodeElement(component, sectionName, projectName);
      if (!qrCodeElement) {
        console.error('Failed to create QR code element');
        return;
      }
      document.body.appendChild(qrCodeElement); // Append to the body to ensure it can be captured
  
      const canvas = await html2canvas(qrCodeElement, { useCORS: true });
      const link = document.createElement('a');
      link.download = `qr-code-${component.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
  
      document.body.removeChild(qrCodeElement); // Remove the element after capturing
    } catch (error) {
      console.error('Error generating QR code: ', error);
    }
  };
  
  const handlePrint = async (component, sectionName, projectName) => {
    try {
      const qrCodeElement = await createQRCodeElement(component, sectionName, projectName);
      if (!qrCodeElement) {
        console.error('Failed to create QR code element');
        return;
      }
      document.body.appendChild(qrCodeElement); // Append to the body to ensure it can be captured
  
      const canvas = await html2canvas(qrCodeElement, { useCORS: true });
      const imgData = canvas.toDataURL('image/png');
  
      const windowContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Print QR Code</title></head>
        <body>
          <img src="${imgData}">
        </body>
        </html>
      `;
      const printWin = window.open('', '', 'width=600,height=600');
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
      printWin.focus();
      printWin.print();
      printWin.close();
  
      document.body.removeChild(qrCodeElement); // Remove the element after capturing
    } catch (error) {
      console.error('Error generating QR code: ', error);
    }
  };
  
  
  

  const createQRCodeElement = (component, sectionName, projectName) => {
    const qrCodeData = {
      project: projectName,
      section: sectionName,
      name: component.name,
      type: component.type,
      width: component.width,
      height: component.height,
      thickness: component.thickness,
      extension: component.extension,
      reduction: component.reduction,
      area: component.area,
      volume: component.volume,
      weight: component.weight,
      status: component.status
    };
  
    let qrCodeValue;
    try {
      qrCodeValue = JSON.stringify(qrCodeData);
    } catch (error) {
      console.error('Error stringifying QR code data: ', error);
      return null;
    }
  
    const qrCodeElement = document.createElement('div');
    qrCodeElement.style.backgroundColor = 'white';
    qrCodeElement.style.padding = '20px';
    qrCodeElement.style.display = 'inline-block';
    qrCodeElement.style.textAlign = 'center';
    qrCodeElement.id = 'qrCodeElement';
  
    const qrCodeContainer = document.createElement('div');
    qrCodeElement.appendChild(qrCodeContainer);
  
    // Use createRoot to render the QRCode component into the qrCodeContainer
    const qrCodeRoot = createRoot(qrCodeContainer);
    qrCodeRoot.render(<QRCode value={qrCodeValue} size={256} />);
  
    const qrCodeText = document.createElement('p');
    qrCodeText.style.textAlign = 'center';
    qrCodeText.style.marginTop = '10px';
    qrCodeText.innerHTML = `
      โครงการ: ${projectName}<br />
      ชั้น: ${sectionName || 'N/A'}<br />
      ชื่อชิ้นงาน: ${component.name}
    `;
  
    qrCodeElement.appendChild(qrCodeText);
  
    // Ensure QRCode component is rendered before returning the element
    return new Promise((resolve) => {
      setTimeout(() => resolve(qrCodeElement), 100);
    });
  };
  
  
  
  

  const renderQRCode = (qrCodeValue, qrCodeDetails, size = 256) => {
    let parsedQRCodeValue = {};
    try {
      parsedQRCodeValue = typeof qrCodeValue === 'string' ? JSON.parse(qrCodeValue) : qrCodeValue;
    } catch (error) {
      console.error('Error parsing QR code value:', error);
    }

    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Paper elevation={3} sx={{ display: 'inline-block', p: 2 }} ref={qrCodeRef}>
          <QRCode value={JSON.stringify(parsedQRCodeValue)} size={size} />
          <Typography mt={2} variant="body1" whiteSpace="pre-line">
            {qrCodeDetails}
          </Typography>
        </Paper>
      </Box>
    );
  };

  const filteredComponents = components.filter(component => {
    const section = sections.find(s => s.id === component.section_id);
    return (
      (filterSection === '' || section?.name === filterSection) &&
      (filterType === '' || component.type === filterType) &&
      (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>สร้างและค้นหา QR CODE สำหรับพิมพ์</Typography>
      <Grid container spacing={3} my={2}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>เลือกโครงการ</InputLabel>
            <Select
              value={selectedProject}
              onChange={handleProjectChange}
              label="เลือกโครงการ"
            >
              <MenuItem value="">
                <em>เลือกโครงการ</em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="ค้นหาด้วยชื่อชิ้นงาน, ชั้น หรือประเภท"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Filter by Section</InputLabel>
            <Select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              label="Filter by Section"
            >
              <MenuItem value="">All</MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.name}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Filter by Type"
            >
              <MenuItem value="">All</MenuItem>
              {components
                .map((component) => component.type)
                .filter((value, index, self) => self.indexOf(value) === index)
                .map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Component Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Width</TableCell>
              <TableCell>Height</TableCell>
              <TableCell align="center">QR Code</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComponents.map((component) => {
              const section = sections.find(s => s.id === component.section_id);
              const qrCodeValue = {
                project: projects.find(p => p.id === selectedProject)?.name,
                section: section?.name || 'N/A',
                name: component.name,
                type: component.type,
                width: component.width,
                height: component.height,
                thickness: component.thickness,
                extension: component.extension,
                reduction: component.reduction,
                area: component.area,
                volume: component.volume,
                weight: component.weight,
                status: component.status
              };
              return (
                <TableRow key={component.id}>
                  <TableCell>{qrCodeValue.project}</TableCell>
                  <TableCell>{qrCodeValue.section}</TableCell>
                  <TableCell>{qrCodeValue.name}</TableCell>
                  <TableCell>{qrCodeValue.type}</TableCell>
                  <TableCell>{qrCodeValue.width}</TableCell>
                  <TableCell>{qrCodeValue.height}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ cursor: 'pointer' }} onClick={() => handleQRCodeClick(component)}>
                      {renderQRCode(qrCodeValue, '', 100)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleSave(component)}>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton onClick={() => handlePrint(component)}>
                      <PrintIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="qr-code-modal"
        aria-describedby="qr-code-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography id="qr-code-modal" variant="h6" component="h2" align="center" gutterBottom>
            QR Code
          </Typography>
          <div>
            {renderQRCode(qrCodeData, qrCodeDetails)}
          </div>
          <Grid container spacing={2} justifyContent="center" mt={2}>
            <Grid item>
              <Button onClick={() => handleSave(JSON.parse(qrCodeData))} variant="contained" color="primary">
                Save
              </Button>
            </Grid>
            <Grid item>
              <Button onClick={() => handlePrint(JSON.parse(qrCodeData))} variant="contained" color="secondary">
                Print
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </Box>
  );
};

export default QRCodePage;
