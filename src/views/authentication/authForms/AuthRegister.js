// [MES] AuthRegister — registration form with role + project assignment.
// Registration/data logic identical to previous implementation.
import { useState, useEffect } from 'react';
import { registerUser, fetchRoles, fetchProjects } from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';

const AuthRegister = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '', projects: [] });
  const [roles, setRoles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoles()
      .then((response) => setRoles(response.data))
      .catch(() => setRoles([]));
    fetchProjects()
      .then((response) => {
        setProjects(response.data);
        setFilteredProjects(response.data);
      })
      .catch(() => {
        setProjects([]);
        setFilteredProjects([]);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (e) => {
    const selectedRole = roles.find((role) => String(role.id) === String(e.target.value));
    setForm({ ...form, roleId: e.target.value });
    setIsAdmin(selectedRole?.name === 'Admin');
  };

  const handleProjectChange = (projectId) => {
    setForm((prev) => {
      const newProjects = prev.projects.includes(projectId)
        ? prev.projects.filter((id) => id !== projectId)
        : [...prev.projects, projectId];
      return { ...prev, projects: newProjects };
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setForm((prev) => ({ ...prev, projects: filteredProjects.map((p) => p.id) }));
    } else {
      setForm((prev) => ({ ...prev, projects: [] }));
    }
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredProjects(projects.filter((project) => project.name.toLowerCase().includes(term)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser({
        ...form,
        username: form.name,
        status: 'active',
        projects: isAdmin ? projects.map((p) => p.id) : form.projects,
      });
      window.location.href = '/auth/login';
    } catch {
      setError('ลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้ง');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h1 className="text-center text-lg font-bold">ลงทะเบียนผู้ใช้งาน</h1>

      <div>
        <label className="mes-label" htmlFor="name">ชื่อผู้ใช้งาน</label>
        <input id="name" className="mes-input" value={form.name} onChange={handleChange} />
      </div>
      <div>
        <label className="mes-label" htmlFor="email">อีเมล</label>
        <input id="email" className="mes-input" type="email" value={form.email} onChange={handleChange} />
      </div>
      <div>
        <label className="mes-label" htmlFor="password">รหัสผ่าน</label>
        <input id="password" className="mes-input" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} />
      </div>
      <div>
        <label className="mes-label" htmlFor="roleId">บทบาท (Role)</label>
        <select id="roleId" className="mes-input" value={form.roleId} onChange={handleRoleChange}>
          <option value="">—</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>

      {!isAdmin && (
        <div>
          <div className="mes-label">โครงการที่เข้าถึงได้</div>
          <div className="max-h-72 overflow-y-auto rounded-md border border-mes-border">
            <div className="sticky top-0 border-b border-mes-border bg-mes-surface p-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mes-muted"><Icon name="search" size={15} /></span>
                <input
                  className="mes-input !min-h-0 !py-2 !pl-9"
                  placeholder="ค้นหาโครงการ…"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <label className="flex min-h-touch cursor-pointer items-center gap-3 border-b border-mes-border px-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--mes-accent)]"
                checked={filteredProjects.length > 0 && form.projects.length === filteredProjects.length}
                onChange={handleSelectAll}
              />
              เลือกทั้งหมด
            </label>
            {filteredProjects.map((project) => (
              <label key={project.id} className="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-sm hover:bg-mes-surface-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--mes-accent)]"
                  checked={form.projects.includes(project.id)}
                  onChange={() => handleProjectChange(project.id)}
                />
                <span className="min-w-0 truncate">{project.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button className="mes-btn mes-btn-primary w-full" type="submit">ลงทะเบียน</button>
      {error && <div className="text-center text-xs text-sem-danger">{error}</div>}
    </form>
  );
};

export default AuthRegister;
