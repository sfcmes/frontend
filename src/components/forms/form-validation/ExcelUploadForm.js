// [MES] ExcelUploadForm — bulk component import from Excel.
// Parsing, validation, and save-to-database logic identical to previous implementation.
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import {
  createComponent,
  fetchProjects,
  fetchSectionsByProjectId,
  fetchSectionByName,
  createSection,
} from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { Modal } from 'src/components/mes/ui';

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
  const [progress, setProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setError('Error fetching projects. Please check the console for details.'));
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const raw = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(raw, { type: 'array' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (jsonData.length > 1) {
          const headers = jsonData[0];
          const formattedData = jsonData.slice(1).map((row) => {
            const obj = {};
            headers.forEach((header, index) => {
              const trimmedHeader = String(header).trim();
              const mappedKey = columnMapping[trimmedHeader] || trimmedHeader;
              obj[mappedKey] = row[index] || null;
            });
            return obj;
          });
          setData(formattedData);
          setError(null);
        } else {
          setError('No data in Excel file.');
        }
      } catch (err) {
        setError(`Error parsing Excel file: ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
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
      const sections = Array.isArray(sectionsResponse) ? sectionsResponse : sectionsResponse.data;
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

          let matchingSection = sections.find((section) => section.name === component.section_name);

          if (!matchingSection) {
            try {
              matchingSection = await createSection({
                name: component.section_name,
                project_id: selectedProject,
                status: 'planning',
              });
              sections.push(matchingSection);
            } catch (createSectionError) {
              if (createSectionError.response && createSectionError.response.status === 409) {
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
            status: component.status || 'planning',
          };

          await createComponent(componentData);
          successfulSaves.push(component.name);
          setProgress(Math.floor(((i + 1) / totalComponents) * 100));
        } catch (err) {
          errors.push(`Error saving component "${component.name}": ${err.message}`);
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
    } catch (err) {
      setError('Error processing data: ' + err.message);
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
    <div>
      <div className="text-sm font-semibold">อัพโหลดไฟล์ Excel สำหรับการอัพเดตข้อมูลจำนวนมาก</div>

      <div className="mt-3">
        <label className="mes-label" htmlFor="excel-project">เลือกโครงการ</label>
        <select
          id="excel-project"
          className="mes-input sm:max-w-md"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">—</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button className="mes-btn mes-btn-ghost" onClick={handleDownloadTemplate}>
          <Icon name="download" size={15} /> ดาวน์โหลดแม่แบบ Excel
        </button>
        <label className="mes-btn mes-btn-primary cursor-pointer">
          <Icon name="upload" size={15} /> อัพโหลดไฟล์ Excel
          <input accept=".xlsx, .xls" className="hidden" type="file" onChange={handleFileUpload} />
        </label>
      </div>

      {error && (
        <div className="mt-3 whitespace-pre-line rounded-sm border border-sem-danger px-3 py-2 text-sm text-sem-danger">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <>
          <div className="mt-3 text-sm text-mes-muted">Loaded {data.length} rows of data.</div>
          <div className="mt-2 max-h-[380px] overflow-auto rounded-md border border-mes-border">
            <table className="w-full min-w-max">
              <thead className="sticky top-0 bg-mes-surface">
                <tr>
                  {excelHeaders.map((header) => (
                    <th key={header} className="mes-th">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {excelHeaders.map((header) => (
                      <td key={header} className="mes-td whitespace-nowrap">
                        {row[columnMapping[header]] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="mes-btn mes-btn-primary mt-3" onClick={handleSaveToDatabase}>
            บันทึกในฐานข้อมูล
          </button>

          {saveMessage && (
            <div className="mt-3 rounded-sm border border-sem-success px-3 py-2 text-sm text-sem-success">
              {saveMessage}
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => {}} title="Processing…">
        <div className="h-2 w-full overflow-hidden rounded-full bg-mes-surface-2">
          <div className="h-full rounded-full bg-mes-accent transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-sm text-mes-muted tabular-nums">Progress: {progress}%</div>
      </Modal>
    </div>
  );
};

export default ExcelUploadForm;
