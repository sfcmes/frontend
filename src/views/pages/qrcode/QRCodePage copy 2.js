import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Modal, Button } from '@mui/material';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import { fetchProjects, fetchComponentsByProjectId, fetchProjectById, fetchSectionById, fetchSectionsByProjectId } from 'src/utils/api'; // Adjust the path as necessary
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/CloudDownload';

const QRCodePage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [components, setComponents] = useState([]);
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeDetails, setQrCodeDetails] = useState('');

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
      console.log("API Response:", response); // Log the entire API response
      setComponents(response || []); // Directly set the response as components
      setSections(sectionResponse.data || []);
    } catch (error) {
      console.error('Error fetching components or sections:', error);
      setComponents([]); // Fallback to an empty array on error
      setSections([]); // Fallback to an empty array on error
    }
  };

  const handleQRCodeClick = async (component) => {
    try {
      const projectResponse = await fetchProjectById(selectedProject);
      const sectionResponse = await fetchSectionById(component.section_id);

      const qrCodeDetails = `โครงการ: ${projectResponse.data.name}\nชั้น: ${sectionResponse.data.name}\nชื่อชิ้นงาน: ${component.name}\n`;
      setQrCodeDetails(qrCodeDetails);
      setQrCodeData(component.id);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching project/section details:', error);
    }
  };

  const handleDownload = (component) => {
    const canvas = document.getElementById(`qrcode-${component.id}`);
    html2canvas(canvas).then((canvas) => {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${component.name}_qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    });
  };

  const handlePrint = () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (!qrCodeElement) {
      console.error('QR code element not found');
      return;
    }

    html2canvas(qrCodeElement).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '', 'height=400,width=600');
      printWindow.document.write('<html><head><title>QR Code</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<img src="${imgData}" />`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    });

    setIsModalOpen(false);
  };

  const handleSave = async () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (!qrCodeElement) {
      console.error('QR code element not found');
      return;
    }

    try {
      const canvas = await html2canvas(qrCodeElement);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'qr-code.png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 'image/png');
    } catch (error) {
      console.error('Error saving QR code image:', error);
    }

    setIsModalOpen(false);
  };

  const filteredComponents = components.filter(component => {
    const section = sections.find(s => s.id === component.section_id);
    return (
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Box p={3}>
      <Typography variant="h4">สร้างและค้นหา QR CODE สำหรับพิมพ์</Typography>
      <Grid container spacing={2} my={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="เลือกโครงการ"
            value={selectedProject}
            onChange={handleProjectChange}
            SelectProps={{
              native: true,
            }}
          >
            <option value=""></option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="ค้นหาด้วยชื่อชิ้นงาน, ชั้น หรือประเภท"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Component Name</TableCell>
              <TableCell>QR Code</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComponents.map((component) => {
              const section = sections.find(s => s.id === component.section_id);
              return (
                <TableRow key={component.id}>
                  <TableCell>{projects.find(p => p.id === selectedProject)?.name}</TableCell>
                  <TableCell>{section?.name}</TableCell>
                  <TableCell>{component.name}</TableCell>
                  <TableCell onClick={() => handleQRCodeClick(component)}>
                    <QRCode id={`qrcode-${component.id}`} value={component.id} size={64} />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDownload(component)}>
                      <DownloadIcon />
                    </IconButton>
                    <IconButton onClick={handlePrint}>
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
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="qr-code-modal" variant="h6" component="h2" align="center">
            QR Code
          </Typography>
          <Paper
            id="qr-code"
            elevation={3}
            sx={{ mt: 2, p: 2, textAlign: 'center', backgroundColor: 'white' }}
          >
            <QRCode value={qrCodeDetails} size={256} />
            <Typography mt={2} variant="body1">
              {qrCodeDetails}
            </Typography>
          </Paper>
          <Grid container spacing={2} justifyContent="center" mt={2}>
            <Grid item>
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
            </Grid>
            <Grid item>
              <Button onClick={handlePrint} variant="contained" color="secondary">
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
