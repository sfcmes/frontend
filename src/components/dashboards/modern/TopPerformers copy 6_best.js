import React, { useState, memo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  Tab,
  Tabs,
  InputBase,
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import GetAppIcon from '@mui/icons-material/GetApp';
import SearchIcon from '@mui/icons-material/Search';

const generateMockProjects = (numProjects, numSections, numComponents) => {
  return Array.from({ length: numProjects }, (_, projectIndex) => {
    const projectCode = `PRJ-${String.fromCharCode(65 + projectIndex)}`;

    if (projectCode === 'PRJ-A' || projectCode === 'PRJ-B') {
      const realFiles = Array.from({ length: 8 }, (_, componentIndex) => ({
        id: componentIndex + 1,
        name: `COMP-${String.fromCharCode(65 + projectIndex)}1-${componentIndex + 1}`,
        width: (Math.random() * 2 + 1).toFixed(2),
        height: (Math.random() * 3 + 2).toFixed(2),
        thickness: (Math.random() * 0.2 + 0.1).toFixed(2),
        weight: Math.floor(Math.random() * 500 + 300),
        coating: (Math.random() * 0.5 + 0.1).toFixed(2),
        addition: (Math.random() * 0.1).toFixed(2),
        squareMeters: (Math.random() * 10 + 2).toFixed(2),
        status: [
          'ผลิตแล้ว',
          'อยู่ระหว่างขนส่ง',
          'ขนส่งสำเร็จ',
          'ติดตั้งแล้ว',
          'Rejected',
        ][Math.floor(Math.random() * 5)],
        fileName: `${String.fromCharCode(65 + projectIndex)}0${componentIndex + 1}.pdf`,
        fileUrl: `https://sfcmes.github.io/downloadfile/${String.fromCharCode(65 + projectIndex)}0${componentIndex + 1}.pdf`
      }));

      return {
        id: `${projectIndex + 1}`,
        code: projectCode,
        name: `Project ${String.fromCharCode(65 + projectIndex)}`,
        sections: [
          {
            id: 1,
            components: realFiles
          },
        ],
      };
    }

    return {
      id: `${projectIndex + 1}`,
      code: projectCode,
      name: `Project ${String.fromCharCode(65 + projectIndex)}`,
      sections: Array.from({ length: numSections }, (_, sectionIndex) => ({
        id: sectionIndex + 1,
        components: Array.from({ length: numComponents }, (_, componentIndex) => ({
          id: sectionIndex * numComponents + componentIndex + 1,
          name: `COMP-${String.fromCharCode(65 + projectIndex)}${sectionIndex + 1}-${componentIndex + 1}`,
          width: (Math.random() * 2 + 1).toFixed(2),
          height: (Math.random() * 3 + 2).toFixed(2),
          thickness: (Math.random() * 0.2 + 0.1).toFixed(2),
          weight: Math.floor(Math.random() * 500 + 300),
          coating: (Math.random() * 0.5 + 0.1).toFixed(2),
          addition: (Math.random() * 0.1).toFixed(2),
          squareMeters: (Math.random() * 10 + 2).toFixed(2),
          status: [
            'ผลิตแล้ว',
            'อยู่ระหว่างขนส่ง',
            'ขนส่งสำเร็จ',
            'ติดตั้งแล้ว',
            'Rejected',
          ][Math.floor(Math.random() * 5)],
        })),
      })),
    };
  });
};

const projects = generateMockProjects(5, 10, 50);

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
}));

const getStatusColor = (status) => {
  switch (status) {
    case 'ผลิตแล้ว':
      return '#FFC107';
    case 'อยู่ระหว่างขนส่ง':
      return '#2196F3';
    case 'ขนส่งสำเร็จ':
      return '#C2AFF0';
    case 'ติดตั้งแล้ว':
      return '#18F2B2';
    case 'Rejected':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

const handleFileDownload = (file) => {
  console.log(`Downloading file: ${file.fileName}`);
  window.open(file.url, '_blank');
};

const FileHistoryTable = memo(({ files }) => {
  const theme = useTheme();
  return (
    <TableContainer component={Paper} style={{ marginTop: '20px' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell style={{ color: theme.palette.text.primary }}>ชื่อไฟล์</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>เวอร์ชั่น</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>อัพโหลดโดย</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>วันที่อัพโหลด</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>ดาวน์โหลด</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.fileName}</TableCell>
              <TableCell>{file.revision}</TableCell>
              <TableCell>{file.uploadedBy}</TableCell>
              <TableCell>{file.uploadDate}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => handleFileDownload(file)}>
                  <GetAppIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

const displayLabels = {
  id: 'รหัสชิ้นงาน',
  name: 'ชื่อชิ้นงาน',
  width: 'ความกว้าง',
  height: 'ความสูง',
  thickness: 'ความหนา',
  weight: 'น้ำหนัก',
  coating: 'คอนกรีต',
  addition: 'ตร.ม เพิ่ม/ลด',
  squareMeters: 'ตารางเมตร',
  status: 'สถานะ',
};

const generateMockFileRevisions = (componentName, projectCode) => {
  let fileName;
  if (projectCode === 'PRJ-A' || projectCode === 'PRJ-B') {
    const match = componentName.match(/COMP-(A|B)(\d+)-(\d+)/);
    if (match) {
      const [, project, section, component] = match;
      if (section === '1' && component >= '1' && component <= '8') {
        fileName = `${project}${component.padStart(2, '0')}.pdf`;
      }
    }
  }

  if (fileName) {
    return [
      { id: 1, fileName, revision: 'Rev 1', uploadedBy: 'System', uploadDate: '2024-07-04', url: `https://sfcmes.github.io/downloadfile/${fileName}` },
    ];
  }

  return [
    { id: 1, fileName: `COMP-${componentName}_Rev1.pdf`, revision: 'Rev 1', uploadedBy: 'John Doe', uploadDate: '2023-01-15', url: `https://sfcmes.github.io/downloadfile/COMP-${componentName}_Rev1.pdf` },
    { id: 2, fileName: `COMP-${componentName}_Rev2.pdf`, revision: 'Rev 2', uploadedBy: 'Jane Smith', uploadDate: '2023-03-22', url: `https://sfcmes.github.io/downloadfile/COMP-${componentName}_Rev2.pdf` },
    { id: 3, fileName: `COMP-${componentName}_Rev3.pdf`, revision: 'Rev 3', uploadedBy: 'Mike Johnson', uploadDate: '2023-06-10', url: `https://sfcmes.github.io/downloadfile/COMP-${componentName}_Rev3.pdf` },
  ];
};

const ComponentDialog = memo(({ open, onClose, component, projectCode }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const mockFileRevisions = generateMockFileRevisions(component.name, projectCode);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>รายละเอียด: {component.name}</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="รายละเอียดชิ้นงาน" />
          <Tab label="ไฟล์และประวัติ" />
        </Tabs>
        {tabValue === 0 && (
          <Table size="small">
            <TableBody>
              {Object.entries(component).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell component="th" scope="row">{displayLabels[key]}</TableCell>
                  <TableCell align="right">{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {tabValue === 1 && (
          <FileHistoryTable files={mockFileRevisions} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
});

const StatusChip = ({ status, count }) => {
  const StyledChip = styled(Chip)(({ theme }) => ({
    backgroundColor: getStatusColor(status),
    color: status === 'Rejected' ? theme.palette.common.white : theme.palette.common.black,
    fontWeight: 'bold',
    margin: '2px',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    height: '32px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.7rem',
      height: '24px',
    },
    [theme.breakpoints.between('sm', 'md')]: {
      fontSize: '0.8rem',
      height: '28px',
    },
    [theme.breakpoints.up('md')]: {
      fontSize: '0.9rem',
      height: '32px',
    },
  }));

  return <StyledChip label={`${status}: ${count}`} />;
};

const SectionRow = memo(({ section, projectCode }) => {
  const [open, setOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const statusCounts = section.components.reduce((acc, component) => {
    if (!acc[component.status]) {
      acc[component.status] = 0;
    }
    acc[component.status]++;
    return acc;
  }, {});

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell colSpan={2}>ชั้น {section.id}</TableCell>
        <TableCell align="right">{section.components.length} ชิ้นงาน</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชิ้นงาน
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={2}>
                {[
                  'ผลิตแล้ว',
                  'อยู่ระหว่างขนส่ง',
                  'ขนส่งสำเร็จ',
                  'ติดตั้งแล้ว',
                  'Rejected',
                ].map((status) => (
                  <StatusChip key={status} status={status} count={statusCounts[status] || 0} />
                ))}
              </Box>
              <Box style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Grid container spacing={1}>
                  {section.components.map((component) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={component.id}>
                      <Card
                        style={{
                          backgroundColor: getStatusColor(component.status),
                          color: component.status === 'Rejected' ? 'white' : 'black',
                          height: '85px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '6px',
                          margin: '4px',
                        }}
                      >
                        <CardContent style={{ textAlign: 'center', padding: '3px' }}>
                          <Typography
                            variant="subtitle2"
                            style={{ color: 'inherit', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            {component.name}
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => setSelectedComponent(component)}
                            style={{
                              marginTop: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              color: 'inherit',
                              fontSize: '10px',
                              padding: '2px 6px',
                            }}
                          >
                            ดูข้อมูล
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      {selectedComponent && (
        <ComponentDialog
          open={Boolean(selectedComponent)}
          onClose={() => setSelectedComponent(null)}
          component={selectedComponent}
          projectCode={projectCode}
        />
      )}
    </>
  );
});

const ProjectRow = memo(({ project, onRowClick }) => {
  const [open, setOpen] = useState(false);

  const totalComponents = project.sections.reduce((acc, section) => acc + section.components.length, 0);

  const handleRowClick = () => {
    onRowClick(project);
  };

  const handleIconClick = (event) => {
    event.stopPropagation(); 
    setOpen(!open);
  };

  return (
    <>
      <TableRow onClick={handleRowClick} style={{ cursor: 'pointer' }}>
        <TableCell>
          <IconButton size="small" onClick={handleIconClick}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{project.code}</TableCell>
        <TableCell>{project.name}</TableCell>
        <TableCell align="right">{project.sections.length}</TableCell>
        <TableCell align="right">{totalComponents}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชั้น
              </Typography>
              <Table size="small">
                <TableBody>
                  {project.sections.map((section) => (
                    <SectionRow key={section.id} section={section} projectCode={project.code} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const TopPerformers = ({ onRowClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>ข้อมูลโครงการ</Typography>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Search>
      </Box>
      <TableContainer>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <StyledTableCell />
              <TableCell style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }}>รหัสโครงการ</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }}>ชื่อโครงการ</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }} align="right">จำนวนชั้น</TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }} align="right">จำนวนชิ้นงาน</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects
              .filter((project) =>
                project.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((project) => (
                <ProjectRow key={project.id} project={project} onRowClick={onRowClick} />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TopPerformers;
