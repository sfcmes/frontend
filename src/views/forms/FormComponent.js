// [MES] FormComponent — 4-tab component manager (single / Excel / other / precast).
import { useState } from 'react';
import PageContainer from '../../components/container/PageContainer';
import FVComponent from '../../components/forms/form-validation/FVComponent';
import ExcelUploadForm from '../../components/forms/form-validation/ExcelUploadForm';
import OtherComponentManager from '../../components/forms/form-validation/OtherComponentManager';
import PrecastComponentManager from '../../components/forms/form-validation/PrecastComponentManager';
import { CardHeader } from 'src/components/mes/ui';

const TABS = [
  { id: '1', label: 'เพิ่มชิ้นงานเข้าระบบรายชิ้น' },
  { id: '2', label: 'เพิ่มชิ้นงานเข้าระบบด้วย Excel' },
  { id: '3', label: 'จัดการชิ้นงานอื่นๆ' },
  { id: '4', label: 'จัดการชิ้นงานพรีคาสท์' },
];

const FormComponent = () => {
  const [tab, setTab] = useState('1');

  return (
    <PageContainer title="จัดการชิ้นงานของแต่ละโครงการ" description="Manage components individually or in bulk">
      <div className="mes-card">
        <CardHeader title="จัดการชิ้นงานของแต่ละโครงการ" />
        <div className="flex gap-1 overflow-x-auto border-b border-mes-border px-3 pt-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-touch md:min-h-0 whitespace-nowrap rounded-t-sm px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${
                tab === t.id ? 'border-mes-accent text-mes-accent' : 'border-transparent text-mes-muted hover:text-mes-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-4 md:p-5">
          {tab === '1' && <div className="max-w-2xl"><FVComponent /></div>}
          {tab === '2' && <ExcelUploadForm />}
          {tab === '3' && <OtherComponentManager />}
          {tab === '4' && <PrecastComponentManager />}
        </div>
      </div>
    </PageContainer>
  );
};

export default FormComponent;
