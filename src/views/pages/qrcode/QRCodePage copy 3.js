import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Modal,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import {
  fetchProjects,
  fetchComponentsByProjectId,
  fetchProjectById,
  fetchSectionById,
  fetchSectionsByProjectId,
} from 'src/utils/api';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/CloudDownload';
import Breadcrumb from '../../../layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from '../../../components/container/PageContainer';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'สร้าง QR CODE',
  },
];

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
  const [sortColumn, setSortColumn] = useState('project');
  const [sortDirection, setSortDirection] = useState('asc');

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
      const projectName = projectResponse.data.name;

      const qrCodeUrl = `https://sfcpcsystem.ngrok.io/forms/form-component-card/${component.id}`;
      setQrCodeData(qrCodeUrl);

      const qrCodeDetails = `บริษัทแสงฟ้าก่อสร้าง จำกัด\nโครงการ: ${projectName}\nชั้น: ${sectionName}\nชื่อชิ้นงาน: ${component.name}`;
      setQrCodeDetails(qrCodeDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching project/section details:', error);
    }
  };

  const handleSave = (qrCodeUrl) => {
    const canvas = document.getElementById('qr-code-canvas');
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write('<html><head><title>Print QR Code</title></head><body>');
    printWindow.document.write(document.getElementById('qr-code-modal').innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const renderQRCode = (qrCodeValue, qrCodeDetails, size = 256) => (
    <Box sx={{ textAlign: 'center', p: 2 }} id="qr-code-modal">
      <QRCodeCanvas
        id="qr-code-canvas"
        value={qrCodeValue}
        size={size}
        level="H"
      />
      <Typography mt={2} variant="body1" whiteSpace="pre-line">
        {qrCodeDetails}
      </Typography>
    </Box>
  );

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredComponents = components.filter((component) => {
    const section = sections.find((s) => s.id === component.section_id);
    return (
      (filterSection === '' || section?.name === filterSection) &&
      (filterType === '' || component.type === filterType) &&
      (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const sortedComponents = filteredComponents.sort((a, b) => {
    const sectionA = sections.find((s) => s.id === a.section_id)?.name || '';
    const sectionB = sections.find((s) => s.id === b.section_id)?.name || '';
    const projectNameA = projects.find((p) => p.id === selectedProject)?.name || '';
    const projectNameB = projects.find((p) => p.id === selectedProject)?.name || '';
    
    let valueA, valueB;
    
    switch (sortColumn) {
      case 'project':
        valueA = projectNameA.toLowerCase();
        valueB = projectNameB.toLowerCase();
        break;
      case 'section':
        valueA = sectionA.toLowerCase();
        valueB = sectionB.toLowerCase();
        break;
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      default:
        return 0;
    }
  
    if (valueA < valueB) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <PageContainer title="QRCODE" description="สร้าง QR CODE">
      <Breadcrumb title="สร้าง QR CODE" items={BCrumb} />
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          สร้างและค้นหา QR CODE สำหรับพิมพ์
        </Typography>
        <Grid container spacing={3} my={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>เลือกโครงการ</InputLabel>
              <Select value={selectedProject} onChange={handleProjectChange} label="เลือกโครงการ">
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
              <InputLabel>ตัวกรองชั้น</InputLabel>
              <Select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                label="Filter by Section"
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
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
              <InputLabel>ตัวกรองประเภท</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filter by Type"
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
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
                <TableCell onClick={() => handleSort('project')}>โครงการ</TableCell>
                <TableCell onClick={() => handleSort('section')}>ชั้น</TableCell>
                <TableCell onClick={() => handleSort('name')}>ชื่อชิ้นงาน</TableCell>
                <TableCell>ประเภทชิ้นงาน</TableCell>
                <TableCell>ความกว้าง (mm.)</TableCell>
                <TableCell>ความสูง (mm.)</TableCell>
                <TableCell>น้ำหนัก (g-hk)</TableCell>
                <TableCell>น้ำหนัก (k.o)</TableCell>
                <TableCell align="center">QR Code</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedComponents.map((component) => {
                const section = sections.find((s) => s.id === component.section_id);
                const sectionName = section?.name || 'N/A';
                const projectName = projects.find((p) => p.id === selectedProject)?.name;
                return (
                  <TableRow key={component.id}>
                    <TableCell>{projectName}</TableCell>
                    <TableCell>{sectionName}</TableCell>
                    <TableCell>{component.name}</TableCell>
                    <TableCell>{component.type}</TableCell>
                    <TableCell>{component.width}</TableCell>
                    <TableCell>{component.height}</TableCell>
                    <TableCell>{component.weight_ghk}</TableCell>
                    <TableCell>{component.weight_ko}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ cursor: 'pointer' }} onClick={() => handleQRCodeClick(component)}>
                        {renderQRCode(`https://sfcpcsystem.ngrok.io/forms/form-component-card/${component.id}`, '', 100)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleSave(`https://sfcpcsystem.ngrok.io/forms/form-component-card/${component.id}`)}>
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
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography id="qr-code-modal" variant="h6" component="h2" align="center" gutterBottom>
              บริษัทแสงฟ้าก่อสร้าง จำกัด
            </Typography>
            <div>{renderQRCode(qrCodeData, qrCodeDetails)}</div>
            <Grid container spacing={2} justifyContent="center" mt={2}>
              <Grid item>
                <Button onClick={() => handleSave(qrCodeData)} variant="contained" color="primary">
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
    </PageContainer>
  );
};

export default QRCodePage;