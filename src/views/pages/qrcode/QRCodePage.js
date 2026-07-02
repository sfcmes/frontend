// [MES] QRCodePage — generate, search, print, and save component QR codes.
// QR generation / print / save / local-history logic identical to previous
// implementation. Fixes the components response shape ({precast, other}).
import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import {
  fetchProjects,
  fetchComponentsByProjectId,
  fetchProjectById,
  fetchSectionById,
  fetchSectionsByProjectId,
} from 'src/utils/api';
import PageContainer from '../../../components/container/PageContainer';
import logo from 'src/assets/images/logos/logo-main.svg';
import { Icon } from 'src/components/mes/Icon';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { Modal, EmptyState, CardHeader } from 'src/components/mes/ui';

const QR_HISTORY_KEY = 'qrCodeHistory';
const MAX_HISTORY_ITEMS = 50;

// Canvas APIs can't resolve CSS var() — read the QR print tokens at runtime.
const qrColors = () => {
  const cs = getComputedStyle(document.documentElement);
  return {
    paper: cs.getPropertyValue('--qr-paper').trim() || 'white',
    ink: cs.getPropertyValue('--qr-ink').trim() || 'black',
  };
};

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
  const [noDataMessage, setNoDataMessage] = useState('');

  useEffect(() => {
    fetchProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
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
      } catch {
        const reducedHistory = updatedHistory.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
        try {
          localStorage.setItem(QR_HISTORY_KEY, JSON.stringify(reducedHistory));
          return reducedHistory;
        } catch {
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

  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    setSelectedProject(projectId);
    setNoDataMessage('');
    try {
      const response = await fetchComponentsByProjectId(projectId);
      const sectionResponse = await fetchSectionsByProjectId(projectId);
      const list = Array.isArray(response)
        ? response
        : [...(response?.precast || []), ...(response?.other || [])];
      setComponents(list);
      setSections(sectionResponse.data || []);
      if (list.length === 0) {
        setNoDataMessage('ไม่พบข้อมูลสำหรับโครงการนี้');
      }
    } catch {
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
      setQrCodeDetails(`บริษัทแสงฟ้าก่อสร้าง จำกัด\nโครงการ: ${projectName}\nชั้น: ${sectionName}\nชื่อชิ้นงาน: ${component.name}`);
      setQrCodeData(`${window.location.origin}/forms/form-component-card/${component.id}`);
      setIsModalOpen(true);
    } catch {
      /* detail fetch failed — QR modal not opened */
    }
  };

  const createQRCodeElement = (component, sectionName, projectName) => {
    const qrCodeUrl = `${window.location.origin}/forms/form-component-card/${component.id}`;
    const { paper, ink } = qrColors();

    const qrCodeElement = document.createElement('div');
    qrCodeElement.style.backgroundColor = paper;
    qrCodeElement.style.padding = '20px';
    qrCodeElement.style.display = 'inline-block';
    qrCodeElement.style.textAlign = 'center';
    qrCodeElement.id = 'qrCodeElement';

    const qrCodeContainer = document.createElement('div');
    qrCodeContainer.style.backgroundColor = paper;
    qrCodeContainer.style.padding = '10px';
    qrCodeContainer.style.display = 'inline-block';
    qrCodeElement.appendChild(qrCodeContainer);

    const qrCodeRoot = createRoot(qrCodeContainer);
    qrCodeRoot.render(
      <QRCodeCanvas
        value={qrCodeUrl}
        size={256}
        bgColor={paper}
        fgColor={ink}
        level={'Q'}
        includeMargin
        imageSettings={{ src: logo, height: 48, width: 48, excavate: true }}
      />,
    );

    const qrCodeText = document.createElement('p');
    qrCodeText.style.color = ink;
    qrCodeText.style.textAlign = 'center';
    qrCodeText.style.marginTop = '10px';
    qrCodeText.style.fontSize = '16px';
    qrCodeText.style.fontWeight = '700';
    qrCodeText.style.fontFamily = 'Arial, sans-serif';
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

  const handleSave = async (component, sectionName, projectName) => {
    try {
      if (!component.name) return;
      const qrCodeElement = await createQRCodeElement(component, sectionName, projectName);
      if (!qrCodeElement) return;
      document.body.appendChild(qrCodeElement);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(qrCodeElement, {
        useCORS: true,
        backgroundColor: qrColors().paper,
        scale: 4,
      });
      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `qr-code-${component.name}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          document.body.removeChild(qrCodeElement);
        },
        'image/png',
        1.0,
      );
      addToHistory('บันทึกแล้ว', component);
    } catch {
      /* save failed silently, matching previous behavior */
    }
  };

  const handlePrint = async (component, sectionName, projectName) => {
    try {
      if (!component.name) return;
      const qrCodeElement = await createQRCodeElement(component, sectionName, projectName);
      if (!qrCodeElement) return;
      document.body.appendChild(qrCodeElement);

      const canvas = await html2canvas(qrCodeElement, {
        useCORS: true,
        backgroundColor: qrColors().paper,
      });
      const imgData = canvas.toDataURL('image/png');

      const printWindow = window.open('', '', 'width=600,height=600');
      if (!printWindow) return;
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
                background-color: ${qrColors().paper};
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
    } catch {
      /* print failed silently, matching previous behavior */
    }
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
      ((component.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (section?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (component.type || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const sortedComponents = [...filteredComponents].sort((a, b) => {
    const sectionA = sections.find((s) => s.id === a.section_id)?.name || '';
    const sectionB = sections.find((s) => s.id === b.section_id)?.name || '';
    let valueA;
    let valueB;
    switch (sortColumn) {
      case 'section':
        valueA = sectionA.toLowerCase();
        valueB = sectionB.toLowerCase();
        break;
      case 'name':
        valueA = (a.name || '').toLowerCase();
        valueB = (b.name || '').toLowerCase();
        break;
      default:
        return 0;
    }
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const projectName = projects.find((p) => p.id === selectedProject)?.name;
  const { paper, ink } = qrColors();

  const sortHead = (col, label) => (
    <button
      className="inline-flex items-center gap-1 font-semibold text-mes-muted hover:text-mes-text"
      onClick={() => handleSort(col)}
    >
      {label}
      {sortColumn === col && <Icon name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} size={13} />}
    </button>
  );

  const rowActions = (component, sectionName) => (
    <div className="flex gap-1">
      <button
        className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 !px-3 md:!py-1.5"
        onClick={() => handleSave(component, sectionName, projectName)}
        aria-label="ดาวน์โหลด QR"
        title="ดาวน์โหลด QR"
      >
        <Icon name="download" size={16} />
      </button>
      <button
        className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 !px-3 md:!py-1.5"
        onClick={() => handlePrint(component, sectionName, projectName)}
        aria-label="พิมพ์ QR"
        title="พิมพ์ QR"
      >
        <Icon name="printer" size={16} />
      </button>
    </div>
  );

  return (
    <PageContainer title="QRCODE" description="สร้าง QR CODE">
      <div className="mes-card">
        <CardHeader
          title="สร้างและค้นหา QR CODE สำหรับพิมพ์"
          right={
            <button className="mes-btn mes-btn-ghost" onClick={() => setIsHistoryOpen(true)}>
              <Icon name="clock" size={16} /> ประวัติการทำงาน
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 md:p-5">
          <div>
            <label className="mes-label" htmlFor="qr-project">เลือกโครงการ</label>
            <select id="qr-project" className="mes-input" value={selectedProject} onChange={handleProjectChange}>
              <option value="">เลือกโครงการ</option>
              {projects.map((project) => (
                <option key={project.id || project._id} value={project.id || project._id}>
                  {project.name || project.projectName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mes-label" htmlFor="qr-search">ค้นหาด้วยชื่อชิ้นงาน, ชั้น หรือประเภท</label>
            <input
              id="qr-search"
              className="mes-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="mes-label" htmlFor="qr-filter-section">ตัวกรองชั้น</label>
            <select id="qr-filter-section" className="mes-input" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {sections.map((section) => (
                <option key={section.id} value={section.name}>{section.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mes-label" htmlFor="qr-filter-type">ตัวกรองประเภท</label>
            <select id="qr-filter-type" className="mes-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {components
                .map((component) => component.type)
                .filter((value, index, self) => value && self.indexOf(value) === index)
                .map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
            </select>
          </div>
        </div>

        {noDataMessage || components.length === 0 ? (
          <EmptyState
            icon="qrcode"
            title={noDataMessage || 'ไม่พบข้อมูลสำหรับโครงการนี้'}
            hint="กรุณาเลือกโครงการอื่น หรือติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูล"
          />
        ) : (
          <>
            {/* base: cards */}
            <div className="flex flex-col gap-2 p-3 md:hidden">
              {sortedComponents.map((component) => {
                const section = sections.find((s) => s.id === component.section_id);
                const sectionName = section?.name || 'N/A';
                return (
                  <div key={component.id} className="mes-card p-3">
                    <div className="flex items-center gap-3">
                      <button
                        className="shrink-0 rounded-sm p-1"
                        style={{ background: paper }}
                        onClick={() => handleQRCodeClick(component)}
                        aria-label="ดู QR Code"
                      >
                        <QRCodeCanvas
                          value={`${window.location.origin}/forms/form-component-card/${component.id}`}
                          size={44} bgColor={paper} fgColor={ink} level={'Q'}
                        />
                      </button>
                      <div className="min-w-0 grow">
                        <div className="truncate text-sm font-semibold">{component.name}</div>
                        <div className="text-xs text-mes-muted">{sectionName} · {component.type || '—'}</div>
                        <div className="mt-1"><StatusBadge status={component.status} size="sm" /></div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-mes-muted tabular-nums">
                      <span>ก {component.width} มม.</span>
                      <span>ส {component.height} มม.</span>
                      <span>{component.weight ? `${component.weight} ตัน` : '—'}</span>
                      <span className="ml-auto">{rowActions(component, sectionName)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* md+: table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="mes-th">โครงการ</th>
                    <th className="mes-th">{sortHead('section', 'ชั้น')}</th>
                    <th className="mes-th">{sortHead('name', 'ชื่อชิ้นงาน')}</th>
                    <th className="mes-th">ประเภทชิ้นงาน</th>
                    <th className="mes-th text-right">ความกว้าง (mm.)</th>
                    <th className="mes-th text-right">ความสูง (mm.)</th>
                    <th className="mes-th text-right">น้ำหนัก (ton.)</th>
                    <th className="mes-th">สถานะ</th>
                    <th className="mes-th text-center">QR Code</th>
                    <th className="mes-th" />
                  </tr>
                </thead>
                <tbody>
                  {sortedComponents.map((component) => {
                    const section = sections.find((s) => s.id === component.section_id);
                    const sectionName = section?.name || 'N/A';
                    return (
                      <tr key={component.id} className="hover:bg-mes-surface-2">
                        <td className="mes-td"><span className="block max-w-[160px] truncate">{projectName}</span></td>
                        <td className="mes-td">{sectionName}</td>
                        <td className="mes-td font-semibold">{component.name}</td>
                        <td className="mes-td">{component.type || '—'}</td>
                        <td className="mes-td text-right">{component.width}</td>
                        <td className="mes-td text-right">{component.height}</td>
                        <td className="mes-td text-right">{component.weight || 'N/A'}</td>
                        <td className="mes-td"><StatusBadge status={component.status} size="sm" /></td>
                        <td className="mes-td text-center">
                          <button
                            className="inline-flex rounded-sm p-1 transition-transform hover:scale-110"
                            style={{ background: paper }}
                            onClick={() => handleQRCodeClick(component)}
                            aria-label="ดู QR Code"
                          >
                            <QRCodeCanvas
                              value={`${window.location.origin}/forms/form-component-card/${component.id}`}
                              size={40} bgColor={paper} fgColor={ink} level={'Q'}
                            />
                          </button>
                        </td>
                        <td className="mes-td">{rowActions(component, sectionName)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* QR detail modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="บริษัทแสงฟ้าก่อสร้าง จำกัด"
        footer={
          <>
            <button
              className="mes-btn mes-btn-ghost"
              onClick={() => {
                const component = sortedComponents.find((comp) => comp.id === qrCodeData.split('/').pop());
                if (component) {
                  handleSave(
                    component,
                    qrCodeDetails.split('\n')[2].split(': ')[1],
                    qrCodeDetails.split('\n')[1].split(': ')[1],
                  );
                }
              }}
            >
              <Icon name="download" size={15} /> บันทึก
            </button>
            <button
              className="mes-btn mes-btn-primary"
              onClick={() => {
                const component = sortedComponents.find((comp) => comp.id === qrCodeData.split('/').pop());
                if (component) {
                  handlePrint(
                    component,
                    qrCodeDetails.split('\n')[2].split(': ')[1],
                    qrCodeDetails.split('\n')[1].split(': ')[1],
                  );
                }
              }}
            >
              <Icon name="printer" size={15} /> พิมพ์
            </button>
          </>
        }
      >
        <div className="flex justify-center">
          <div className="inline-block rounded-md p-4 text-center" style={{ background: paper }} ref={qrCodeRef}>
            <QRCodeCanvas
              value={qrCodeData}
              size={220}
              bgColor={paper}
              fgColor={ink}
              level={'Q'}
              includeMargin
              imageSettings={{ src: logo, height: 42, width: 42, excavate: true }}
            />
            <p className="mt-2 whitespace-pre-line text-sm font-semibold" style={{ color: ink }}>
              {qrCodeDetails}
            </p>
          </div>
        </div>
      </Modal>

      {/* History sheet */}
      <Modal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="ประวัติการทำงาน"
        footer={
          <button className="mes-btn mes-btn-danger" onClick={clearAllHistory}>
            <Icon name="trash" size={15} /> ล้างประวัติทั้งหมด
          </button>
        }
      >
        <div className="mb-3 rounded-sm border border-mes-border bg-mes-surface-2 px-3 py-2 text-xs text-mes-muted">
          ประวัติจะถูกบันทึกเฉพาะในอุปกรณ์และเบราวเซอร์นี้เท่านั้น
        </div>
        {history.length === 0 ? (
          <EmptyState icon="clock" title="ยังไม่มีประวัติ" />
        ) : (
          <div className="flex flex-col gap-1.5">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-sm border border-mes-border px-3 py-2">
                <div className="min-w-0 grow">
                  <div className="truncate text-sm">{entry.action} {entry.componentName}</div>
                  <div className="text-xs text-mes-muted">{entry.timestamp}</div>
                </div>
                <button
                  className="mes-btn mes-btn-ghost !min-h-touch !px-3"
                  onClick={() => deleteHistoryItem(entry.id)}
                  aria-label="ลบรายการประวัติ"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default QRCodePage;
