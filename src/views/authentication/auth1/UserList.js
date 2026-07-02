// [MES] UserList — user admin: search, edit role, assign projects, delete.
// Data logic identical to previous implementation; UI rebuilt dark, Thai-first.
import { useEffect, useState } from 'react';
import {
  fetchUsers, fetchRoles, updateUserById, deleteUserById,
  assignProjectsToUser, fetchProjects, fetchUserProjects,
} from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { Modal, ConfirmDialog, EmptyState, Spinner, useToast } from 'src/components/mes/ui';

const PAGE_SIZE = 10;

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [userProjects, setUserProjects] = useState({});
  const { showToast, toastNode } = useToast();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userData, roleResponse, projectData] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchProjects(),
      ]);

      const roleMap = roleResponse.data.reduce((map, role) => {
        map[role.id] = role.name;
        return map;
      }, {});

      const userProjectsMap = {};
      for (const user of userData) {
        try {
          const userProjectsResponse = await fetchUserProjects(user.id);
          const projectsList = userProjectsResponse.data || [];
          userProjectsMap[user.id] = projectsList.map((p) => p.project_id?.toString()).filter(Boolean);
        } catch {
          userProjectsMap[user.id] = [];
        }
      }

      setUsers(userData);
      setRoles(roleMap);
      setProjects(projectData.data);
      setUserProjects(userProjectsMap);
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSaveEdit = async () => {
    try {
      await updateUserById(editUser.id, editUser);
      setUsers(users.map((user) => (user.id === editUser.id ? editUser : user)));
      setOpenDialog(false);
      showToast('บันทึกข้อมูลผู้ใช้งานแล้ว');
    } catch {
      showToast('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handleDelete = async () => {
    const userId = deleteId;
    setDeleteId(null);
    if (!userId) return;
    try {
      await deleteUserById(userId);
      setUsers(users.filter((user) => user.id !== userId));
      const updatedUserProjects = { ...userProjects };
      delete updatedUserProjects[userId];
      setUserProjects(updatedUserProjects);
      showToast('ลบผู้ใช้งานแล้ว');
    } catch {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  const handleSaveProjects = async () => {
    try {
      if (roles[editUser.role_id] !== 'Admin') {
        await assignProjectsToUser(editUser.id, selectedProjects);
        const updatedUserProjects = { ...userProjects };
        updatedUserProjects[editUser.id] = selectedProjects;
        setUserProjects(updatedUserProjects);
        await fetchAllData();
        setOpenProjectDialog(false);
        showToast('กำหนดโครงการแล้ว');
      }
    } catch {
      showToast('กำหนดโครงการไม่สำเร็จ', 'error');
    }
  };

  const projectAccess = (user) => {
    if (roles[user.role_id] === 'Admin') {
      return <span className="rounded-full bg-mes-surface-2 px-2 py-0.5 text-xs font-semibold text-mes-accent">ทุกโครงการ</span>;
    }
    if (roles[user.role_id] === 'Site User') {
      const ids = userProjects[user.id] || [];
      if (ids.length === 0) return <span className="text-xs text-mes-muted">ยังไม่ได้กำหนดโครงการ</span>;
      return (
        <span className="flex flex-wrap gap-1">
          {ids.map((projectId) => {
            const project = projects.find((p) => p.id.toString() === projectId.toString());
            return (
              <span key={projectId} className="rounded-full border border-mes-border px-2 py-0.5 text-xs">
                {project?.name || `Project ${projectId}`}
              </span>
            );
          })}
        </span>
      );
    }
    return <span className="text-xs text-mes-muted">ไม่มีสิทธิ์เข้าถึงโครงการ</span>;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pageUsers = filteredUsers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const actions = (user) => (
    <div className="flex flex-wrap gap-1.5">
      <button
        className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 !px-3 md:!py-1.5 text-xs"
        onClick={() => { setEditUser(user); setOpenDialog(true); }}
        aria-label="แก้ไขผู้ใช้งาน"
      >
        <Icon name="edit" size={15} /> แก้ไข
      </button>
      {roles[user.role_id] !== 'Admin' && (
        <button
          className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 !px-3 md:!py-1.5 text-xs"
          onClick={() => {
            setEditUser(user);
            setSelectedProjects(userProjects[user.id] || []);
            setOpenProjectDialog(true);
          }}
        >
          <Icon name="home-plus" size={15} /> กำหนดโครงการ
        </button>
      )}
      <button
        className="mes-btn mes-btn-danger !min-h-touch md:!min-h-0 !px-3 md:!py-1.5 text-xs"
        onClick={() => setDeleteId(user.id)}
        aria-label="ลบผู้ใช้งาน"
      >
        <Icon name="trash" size={15} /> ลบ
      </button>
    </div>
  );

  if (loading) return <Spinner />;
  if (error) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={error}
        action={<button className="mes-btn mes-btn-ghost" onClick={fetchAllData}>ลองอีกครั้ง</button>}
      />
    );
  }

  return (
    <div>
      <div className="p-3 md:px-5">
        <div className="relative sm:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mes-muted"><Icon name="search" size={16} /></span>
          <input
            className="mes-input !pl-9"
            placeholder="ค้นหาผู้ใช้งาน…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState icon="user" title="ไม่พบผู้ใช้งาน" />
      ) : (
        <>
          {/* base: cards */}
          <div className="flex flex-col gap-2 p-3 md:hidden">
            {pageUsers.map((user) => (
              <div key={user.id} className="mes-card p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 grow">
                    <div className="truncate text-sm font-semibold">{user.username}</div>
                    <div className="truncate text-xs text-mes-muted">{user.email}</div>
                  </div>
                  <span className="rounded-full bg-mes-surface-2 px-2 py-0.5 text-xs font-semibold">{roles[user.role_id]}</span>
                </div>
                <div className="mt-2">{projectAccess(user)}</div>
                <div className="mt-2">{actions(user)}</div>
              </div>
            ))}
          </div>
          {/* md+: table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="mes-th">ชื่อผู้ใช้งาน</th>
                  <th className="mes-th">อีเมล</th>
                  <th className="mes-th">บทบาท</th>
                  <th className="mes-th">โครงการที่เข้าถึงได้</th>
                  <th className="mes-th text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-mes-surface-2 align-top">
                    <td className="mes-td font-semibold">{user.username}</td>
                    <td className="mes-td">{user.email}</td>
                    <td className="mes-td">{roles[user.role_id]}</td>
                    <td className="mes-td">{projectAccess(user)}</td>
                    <td className="mes-td"><div className="flex justify-end">{actions(user)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-end gap-2 p-3 text-sm tabular-nums">
              <button
                className="mes-btn mes-btn-ghost !min-h-touch !px-3"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                aria-label="หน้าก่อนหน้า"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <span className="text-mes-muted">{page + 1} / {pageCount}</span>
              <button
                className="mes-btn mes-btn-ghost !min-h-touch !px-3"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                aria-label="หน้าถัดไป"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit user */}
      <Modal
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        title={`แก้ไขผู้ใช้งาน: ${editUser?.username || ''}`}
        footer={
          <>
            <button className="mes-btn mes-btn-ghost" onClick={() => setOpenDialog(false)}>ยกเลิก</button>
            <button className="mes-btn mes-btn-primary" onClick={handleSaveEdit}>บันทึก</button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="mes-label" htmlFor="ul-username">ชื่อผู้ใช้งาน</label>
            <input
              id="ul-username"
              className="mes-input"
              value={editUser?.username || ''}
              onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
            />
          </div>
          <div>
            <label className="mes-label" htmlFor="ul-email">อีเมล</label>
            <input
              id="ul-email"
              className="mes-input"
              value={editUser?.email || ''}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mes-label" htmlFor="ul-role">บทบาท (Role)</label>
            <select
              id="ul-role"
              className="mes-input"
              value={editUser?.role_id || ''}
              onChange={(e) => setEditUser({ ...editUser, role_id: e.target.value })}
            >
              {Object.entries(roles).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Assign projects */}
      <Modal
        open={openProjectDialog}
        onClose={() => setOpenProjectDialog(false)}
        title={
          roles[editUser?.role_id] === 'Admin'
            ? 'Admin เข้าถึงได้ทุกโครงการ'
            : `กำหนดโครงการให้: ${editUser?.username || ''}`
        }
        footer={
          <>
            <button className="mes-btn mes-btn-ghost" onClick={() => setOpenProjectDialog(false)}>ยกเลิก</button>
            {roles[editUser?.role_id] !== 'Admin' && (
              <button className="mes-btn mes-btn-primary" onClick={handleSaveProjects}>บันทึก</button>
            )}
          </>
        }
      >
        {roles[editUser?.role_id] === 'Admin' ? (
          <p className="text-sm text-mes-muted">Admin เข้าถึงได้ทุกโครงการโดยอัตโนมัติ</p>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-md border border-mes-border">
            {projects.map((project) => {
              const idStr = project.id.toString();
              const checked = selectedProjects.some((p) => p.toString() === idStr);
              return (
                <label key={project.id} className="flex min-h-touch cursor-pointer items-center gap-3 border-b border-mes-border px-3 text-sm last:border-0 hover:bg-mes-surface-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--mes-accent)]"
                    checked={checked}
                    onChange={() =>
                      setSelectedProjects((prev) =>
                        checked ? prev.filter((p) => p.toString() !== idStr) : [...prev, project.id],
                      )
                    }
                  />
                  <span className="min-w-0 truncate">{project.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="ลบผู้ใช้งาน"
        message="คุณแน่ใจว่าต้องการลบผู้ใช้งานนี้หรือไม่?"
        confirmLabel="ลบ"
        danger
      />
      {toastNode}
    </div>
  );
};

export default UserList;
