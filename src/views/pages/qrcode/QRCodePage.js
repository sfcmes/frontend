import React, { useState, useEffect, useRef } from 'react';
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
import html2canvas from 'html2canvas';
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
import { createRoot } from 'react-dom/client';
import logo from 'src/assets/images/logos/logo-main.svg';

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
  const qrCodeRef = useRef(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetchProjects();
        console.log('Fetched projects:', response.data);
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
    console.log('Fetching components for project:', projectId);
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

      const qrCodeDetails = `บริษัทแสงฟ้าก่อสร้าง จำกัด\nโครงการ: ${projectName}\nชั้น: ${sectionName}\nชื่อชิ้นงาน: ${component.name}`;
      setQrCodeDetails(qrCodeDetails);

      // ใช้ URL ที่นำไปสู่ FormComponentCard โดยตรง
      // const qrCodeUrl = `${window.location.origin}/forms/form-component-card/${component.id}`;
      // const qrCodeUrl = `${window.location.origin}/api/components/qr/${component.id}`;
      // const qrCodeUrl = `${window.location.origin}/qr/component/${component.id}`;
      const qrCodeUrl = `${window.location.origin}/forms/form-component-card/${component.id}`;
      console.log(qrCodeUrl);
      setQrCodeData(qrCodeUrl);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching project/section details:', error);
    }
  };

  const handleSave = async (component, sectionName, projectName) => {
    try {
      if (!component.name) {
        console.error('Component name is undefined:', component);
        return;
      }
      const qrCodeElement = await createQRCodeElement(component, sectionName, projectName);
      if (!qrCodeElement) {
        console.error('Failed to create QR code element');
        return;
      }
      document.body.appendChild(qrCodeElement);

      const canvas = await html2canvas(qrCodeElement, {
        useCORS: true,
        backgroundColor: 'white',
      });
      const link = document.createElement('a');
      link.download = `qr-code-${component.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      document.body.removeChild(qrCodeElement);
    } catch (error) {
      console.error('Error generating QR code: ', error);
    }
  };

  const handlePrint = async (component, sectionName, projectName) => {
    try {
      if (!component.name) {
        console.error('Component name is undefined:', component);
        return;
      }
      const qrCodeElement = await createQRCodeElement(component, sectionName, projectName);
      if (!qrCodeElement) {
        console.error('Failed to create QR code element');
        return;
      }
      document.body.appendChild(qrCodeElement);

      const canvas = await html2canvas(qrCodeElement, {
        useCORS: true,
        backgroundColor: 'white',
      });
      const imgData = canvas.toDataURL('image/png');

      const printWindow = window.open('', '', 'width=600,height=600');
      if (!printWindow) {
        console.error('Failed to open print window');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { margin: 0; padding: 0; background-color: white; }
            img { display: block; margin: auto; }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.focus(); window.print();">
        </body>
        </html>
      `);
      printWindow.document.close();

      document.body.removeChild(qrCodeElement);
    } catch (error) {
      console.error('Error generating QR code: ', error);
    }
  };

  const createQRCodeElement = (component, sectionName, projectName) => {
    const qrCodeUrl = `https://sfcpcsystem.ngrok.io/forms/form-component-card/${component.id}`;

    const qrCodeElement = document.createElement('div');
    qrCodeElement.style.backgroundColor = 'white';
    qrCodeElement.style.padding = '20px';
    qrCodeElement.style.display = 'inline-block';
    qrCodeElement.style.textAlign = 'center';
    qrCodeElement.id = 'qrCodeElement';

    const qrCodeContainer = document.createElement('div');
    qrCodeContainer.style.backgroundColor = 'white';
    qrCodeContainer.style.padding = '10px';
    qrCodeContainer.style.display = 'inline-block';
    qrCodeElement.appendChild(qrCodeContainer);

    const qrCodeRoot = createRoot(qrCodeContainer);
    qrCodeRoot.render(
      <QRCodeCanvas
        value={qrCodeUrl}
        size={256}
        bgColor={'#ffffff'}
        fgColor={'#000000'}
        level={'Q'}
        includeMargin={true}
        imageSettings={{
          src: logo,
          x: undefined,
          y: undefined,
          height: 48,
          width: 48,
          excavate: true,
        }}
      />,
    );

    const qrCodeText = document.createElement('p');
    qrCodeText.style.color = 'black';
    qrCodeText.style.textAlign = 'center';
    qrCodeText.style.marginTop = '10px';
    qrCodeText.innerHTML = `
      บริษัทแสงฟ้าก่อสร้าง จำกัด<br />
      โครงการ: ${projectName}<br />
      ชั้น: ${sectionName || 'N/A'}<br />
      ชื่อชิ้นงาน: ${component.name}
    `;

    qrCodeElement.appendChild(qrCodeText);

    return new Promise((resolve) => {
      setTimeout(() => resolve(qrCodeElement), 100);
    });
  };

  const renderQRCode = (qrCodeValue, qrCodeDetails, size = 256) => {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Paper
          elevation={3}
          sx={{
            display: 'inline-block',
            p: 2,
            backgroundColor: 'white',
          }}
          ref={qrCodeRef}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              padding: '10px',
              display: 'inline-block',
            }}
          >
            <QRCodeCanvas
              value={qrCodeValue}
              size={size}
              bgColor={'#ffffff'}
              fgColor={'#000000'}
              level={'L'}
              includeMargin={true}
              imageSettings={{
                src: logo,
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
              }}
            />
          </Box>
          <Typography mt={2} variant="body1" whiteSpace="pre-line" sx={{ color: 'black' }}>
            {qrCodeDetails}
          </Typography>
        </Paper>
      </Box>
    );
  };

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

  console.log('Projects:', projects);

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
                  <MenuItem key={project.id || project._id} value={project.id || project._id}>
                    {project.name || project.projectName}
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
                <TableCell align="center">QR Code</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            {components.length > 0 ? (
              <TableBody>
                {sortedComponents.map((component) => {
                  const section = sections.find((s) => s.id === component.section_id);
                  const sectionName = section?.name || 'N/A';
                  const projectName = projects.find((p) => p.id === selectedProject)?.name;
                  const qrCodeUrl = `https://sfcpcsystem.ngrok.io/forms/form-component-card/${component.id}`;
                  return (
                    <TableRow key={component.id}>
                      <TableCell>{projectName}</TableCell>
                      <TableCell>{sectionName}</TableCell>
                      <TableCell>{component.name}</TableCell>
                      <TableCell>{component.type}</TableCell>
                      <TableCell>{component.width}</TableCell>
                      <TableCell>{component.height}</TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleQRCodeClick(component)}
                        >
                          {renderQRCode(qrCodeUrl, '', 100)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleSave(component, sectionName, projectName)}>
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handlePrint(component, sectionName, projectName)}
                        >
                          <PrintIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            ) : (
              <Typography>Loading components...</Typography>
            )}
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
                <Button
                  onClick={() => {
                    const component = sortedComponents.find(
                      (comp) => comp.id === qrCodeData.split('/').pop(),
                    );
                    if (component) {
                      handleSave(
                        component,
                        qrCodeDetails.split('\n')[2].split(': ')[1],
                        qrCodeDetails.split('\n')[1].split(': ')[1],
                      );
                    }
                  }}
                  variant="contained"
                  color="primary"
                >
                  Save
                </Button>
              </Grid>
              <Grid item>
              <Button
  onClick={() => {
    const component = sortedComponents.find(
      (comp) => comp.id === qrCodeData.split('/').pop()
    );
    if (component) {
      handlePrint(
        component,
        qrCodeDetails.split('\n')[2].split(': ')[1],  // section name
        qrCodeDetails.split('\n')[1].split(': ')[1]   // project name
      );
    }
  }}
  variant="contained"
  color="secondary"
>
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
