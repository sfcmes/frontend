// [MES] FVComponent — single-component entry: precast / other sub-tabs.
import { useState, useEffect } from 'react';
import PrecastComponentForm from './PrecastComponentForm';
import OtherComponentForm from './OtherComponentForm';
import { fetchProjects, fetchSectionsByProjectId } from 'src/utils/api';

const FVComponent = () => {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchProjects()
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
  }, []);

  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    try {
      const sectionResponse = await fetchSectionsByProjectId(projectId);
      setSections(sectionResponse.data);
    } catch {
      setSections([]);
    }
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-mes-border">
        {['ชิ้นงานพรีคาสท์', 'ชิ้นงานอื่นๆ'].map((label, i) => (
          <button
            key={label}
            onClick={() => setTabValue(i)}
            className={`min-h-touch md:min-h-0 px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tabValue === i ? 'border-mes-accent text-mes-accent' : 'border-transparent text-mes-muted hover:text-mes-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabValue === 0 && (
          <PrecastComponentForm
            projects={projects}
            sections={sections}
            onProjectChange={handleProjectChange}
          />
        )}
        {tabValue === 1 && (
          <OtherComponentForm
            projects={projects}
            sections={sections}
            onProjectChange={handleProjectChange}
            onComponentAdded={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default FVComponent;
