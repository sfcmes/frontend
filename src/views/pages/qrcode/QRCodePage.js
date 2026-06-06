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
  TableSortLabel,
  Drawer,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
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
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
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

const QR_HISTORY_KEY = 'qrCodeHistory';
const MAX_HISTORY_ITEMS = 50;

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
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  useEffect(() => {
    const savedHistory = localStorage.getItem(QR_HISTORY_KEY);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const addToHistory = (action, component) => {
    const newEntry = {
      id: Date.now(),
      action,
      componentName: component.name,
      timestamp: new Date().toLocaleString(),
    };

    setHistory((prevHistory) => {
      const updatedHistory = [newEntry, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(QR_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('localStorage is full:', error);
        const reducedHistory = updatedHistory.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
        try {
          localStorage.setItem(QR_HISTORY_KEY, JSON.stringify(reducedHistory));
          return reducedHistory;
        } catch (retryError) {
          console.error('Failed to save even after reducing items:', retryError);
          return updatedHistory;
        }
      }
      return updatedHistory;
    });
  };

  const deleteHistoryItem = (id) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(QR_HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem(QR_HISTORY_KEY);
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const [noDataMessage, setNoDataMessage] = useState('');

  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    setSelectedProject(projectId);
    setNoDataMessage('');
    console.log('Fetching components for project:', projectId);
    try {
      const response = await fetchComponentsByProjectId(projectId);
      const sectionResponse = await fetchSectionsByProjectId(projectId);
      setComponents(Array.isArray(response) ? response : []);
      setSections(sectionResponse.data || []);
      if (!Array.isArray(response) || response.length === 0) {
        setNoDataMessage('ไม่พบข้อมูลสำหรับโครงการนี้');
      }
    } catch (error) {
      console.error('Error fetching components or sections:', error);
      setComponents([]);
      setSections([]);
      setNoDataMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
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
      // ตรวจสอบว่า component มีชื่อหรือไม่
      if (!component.name) {
        console.error('Component name is undefined:', component);
        return;
      }

      // สร้าง QR code element
      const qrCodeElement = await createQRCodeElement(component, sectionName, projectName);
      if (!qrCodeElement) {
        console.error('Failed to create QR code element');
        return;
      }

      // เพิ่ม QR code element เข้าไปใน DOM
      document.body.appendChild(qrCodeElement);

      // รอให้ element ถูก render จนเสร็จสมบูรณ์
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ใช้ html2canvas เพื่อสร้างภาพจาก element
      const canvas = await html2canvas(qrCodeElement, {
        useCORS: true,
        backgroundColor: 'white',
        scale: 4, // เพิ่มความละเอียดเป็น 4 เท่า
      });

      // สร้าง Blob จาก canvas
      canvas.toBlob(
        (blob) => {
          // สร้าง URL สำหรับ Blob
          const url = URL.createObjectURL(blob);

          // สร้าง link element สำหรับดาวน์โหลด
          const link = document.createElement('a');
          link.download = `qr-code-${component.name}.png`;
          link.href = url;

          // คลิกลิงก์เพื่อเริ่มการดาวน์โหลด
          link.click();

          // ทำความสะอาด
          URL.revokeObjectURL(url);
          document.body.removeChild(qrCodeElement);
        },
        'image/png',
        1.0,
      ); // ใช้คุณภาพสูงสุดสำหรับ PNG
      addToHistory('บันทึกแล้ว', component);
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
            @media print {
              body { 
                margin: 0; 
                padding: 0; 
                background-color: white;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              img { 
                display: block; 
                margin: auto;
                max-width: 100%;
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.focus(); window.print();">
        </body>
        </html>
      `);
      printWindow.document.close();

      document.body.removeChild(qrCodeElement);
      addToHistory('พิมพ์แล้ว', component);
    } catch (error) {
      console.error('Error generating QR code: ', error);
    }
  };

  const createQRCodeElement = (component, sectionName, projectName) => {
    const qrCodeUrl = `${window.location.origin}/forms/form-component-card/${component.id}`;

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
    // เพิ่มการกำหนดขนาดฟอนต์, ความเข้ม, และ font-family
    qrCodeText.style.fontSize = '16px'; // เพิ่มขนาดฟอนต์เล็กน้อย
    qrCodeText.style.fontWeight = '700'; // ใช้ความหนามากขึ้น (700 คือ bold)
    qrCodeText.style.fontFamily = 'Arial, sans-serif'; // ใช้ฟอนต์ที่อ่านง่ายเมื่อพิมพ์
    // ใช้ template literals เพื่อกำหนดสไตล์แยกแต่ละบรรทัด
    qrCodeText.innerHTML = `
    <span style="font-size: 18px; font-weight: 800;">บริษัทแสงฟ้าก่อสร้าง จำกัด</span><br />
    <span style="font-size: 16px; font-weight: 700;">โครงการ: ${projectName}</span><br />
    <span style="font-size: 16px; font-weight: 700;">ชั้น: ${sectionName || 'N/A'}</span><br />
    <span style="font-size: 16px; font-weight: 800;">ชื่อชิ้นงาน: ${component.name}</span>`;
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

  const filteredComponents = Array.isArray(components)
    ? components.filter((component) => {
        const section = sections.find((s) => s.id === component.section_id);
        return (
          (filterSection === '' || section?.name === filterSection) &&
          (filterType === '' || component.type === filterType) &&
          (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            component.type.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
    : [];

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
                {Array.isArray(components)
                  ? components
                      .map((component) => component.type)
                      .filter((value, index, self) => self.indexOf(value) === index)
                      .map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))
                  : null}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          {noDataMessage ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">{noDataMessage}</Typography>
              <Typography variant="body1">
                กรุณาเลือกโครงการอื่น หรือติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูล
              </Typography>
            </Box>
          ) : !Array.isArray(components) || components.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">ไม่พบข้อมูลสำหรับโครงการนี้</Typography>
              <Typography variant="body1">
                กรุณาเลือกโครงการอื่น หรือติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูล
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'project'}
                      direction={sortColumn === 'project' ? sortDirection : 'asc'}
                      onClick={() => handleSort('project')}
                      IconComponent={SortIcon}
                    >
                      โครงการ
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'section'}
                      direction={sortColumn === 'section' ? sortDirection : 'asc'}
                      onClick={() => handleSort('section')}
                      IconComponent={SortIcon}
                    >
                      ชั้น
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortColumn === 'name'}
                      direction={sortColumn === 'name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('name')}
                      IconComponent={SortIcon}
                    >
                      ชื่อชิ้นงาน
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>ประเภทชิ้นงาน</TableCell>
                  <TableCell>ความกว้าง (mm.)</TableCell>
                  <TableCell>ความสูง (mm.)</TableCell>
                  <TableCell>น้ำหนัก (ton.)</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell align="center" sx={{ width: '100px' }}>
                    QR Code
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedComponents.map((component) => {
                  const section = sections.find((s) => s.id === component.section_id);
                  const sectionName = section?.name || 'N/A';
                  const projectName = projects.find((p) => p.id === selectedProject)?.name;
                  const qrCodeUrl = `${window.location.origin}/forms/form-component-card/${component.id}`;
                  return (
                    <TableRow key={component.id}>
                      <TableCell>{projectName}</TableCell>
                      <TableCell>{sectionName}</TableCell>
                      <TableCell>{component.name}</TableCell>
                      <TableCell>{component.type}</TableCell>
                      <TableCell>{component.width}</TableCell>
                      <TableCell>{component.height}</TableCell>
                      <TableCell>{component.weight || 'N/A'}</TableCell>
                      <TableCell>{component.status || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            cursor: 'pointer',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 'auto',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            },
                          }}
                          onClick={() => handleQRCodeClick(component)}
                        >
                          <QRCodeCanvas
                            value={qrCodeUrl}
                            size={40}
                            bgColor={'#ffffff'}
                            fgColor={'#000000'}
                            level={'Q'}
                            includeMargin={false}
                            imageSettings={{
                              src: logo,
                              x: undefined,
                              y: undefined,
                              height: 12,
                              width: 12,
                              excavate: true,
                            }}
                          />
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
            </Table>
          )}
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
                      (comp) => comp.id === qrCodeData.split('/').pop(),
                    );
                    if (component) {
                      handlePrint(
                        component,
                        qrCodeDetails.split('\n')[2].split(': ')[1],
                        qrCodeDetails.split('\n')[1].split(': ')[1],
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

      {/* ส่วนที่เพิ่มเติมสำหรับฟีเจอร์ประวัติ */}
      <IconButton onClick={toggleHistory} style={{ position: 'fixed', bottom: 20, right: 20 }}>
        <HistoryIcon />
      </IconButton>

      <Drawer anchor="right" open={isHistoryOpen} onClose={toggleHistory}>
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ประวัติการทำงาน
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            ประวัติจะถูกบันทึกเฉพาะในอุปกรณ์และเบราวเซอร์นี้เท่านั้น
          </Alert>
          <List>
            {history.map((entry) => (
              <ListItem key={entry.id}>
                <ListItemText
                  primary={`${entry.action} ${entry.componentName}`}
                  secondary={entry.timestamp}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="print"
                    onClick={() => handlePrint(/* pass necessary args */)}
                  >
                    <PrintIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="download"
                    onClick={() => handleSave(/* pass necessary args */)}
                  >
                    <DownloadIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => deleteHistoryItem(entry.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={clearAllHistory}
            fullWidth
            sx={{ mt: 2 }}
          >
            ล้างประวัติทั้งหมด
          </Button>
        </Box>
      </Drawer>
    </PageContainer>
  );
};

export default QRCodePage;
