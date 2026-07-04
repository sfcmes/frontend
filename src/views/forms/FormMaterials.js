// [MES] FormMaterials — material master (ทะเบียนวัสดุ) + recipe governance (สูตรวัสดุ) admin page.
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from 'src/contexts/AuthContext';
import {
  fetchMaterials, createMaterial, updateMaterial,
  fetchMaterialRecipes, createMaterialRecipe, activateMaterialRecipe,
} from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { ConfirmDialog, EmptyState, Spinner, useToast, CardHeader } from 'src/components/mes/ui';
import FVMaterial from './material-dialogs/FVMaterial';
import FVMaterialRecipe from './material-dialogs/FVMaterialRecipe';
import { GuidedTour } from 'src/components/mes/tour/GuidedTour';
import { useTour } from 'src/components/mes/tour/useTour';

const SOURCE_ATTR_TH = {
  volume: 'ปริมาตร (m³)',
  area: 'พื้นที่ (m²)',
  weight: 'น้ำหนัก (kg)',
  per_piece: 'ต่อชิ้น',
};

// Recipe lifecycle labels — plain muted text / gold, NOT StatusBadge (these are
// recipe governance states, not component workflow statuses).
const RECIPE_STATUS_TH = {
  draft: { th: 'ร่าง', cls: 'text-mes-muted' },
  active: { th: 'ใช้งาน', cls: 'text-mes-accent font-semibold' },
  retired: { th: 'เลิกใช้', cls: 'text-mes-muted' },
};

const TABS = [
  { key: 'materials', label: 'ทะเบียนวัสดุ' },
  { key: 'recipes', label: 'สูตรวัสดุ' },
];

// Guided tour — GuidedTour walks these top-to-bottom. `when` gates a step by
// page state (false → silently skipped), `waitFor` holds the step until the
// user really performs the action. Targets = data-tour attributes below.
const TOUR_STORAGE_KEY = 'mes-tour-materials-v1';
const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'ยินดีต้อนรับสู่หน้าวัสดุและสูตร',
    body: 'หน้านี้จัดการทะเบียนวัสดุที่สั่งซื้อได้ และสูตรสำหรับคำนวณความต้องการวัสดุจากชิ้นงาน มาดูทีละส่วนกัน',
    nextLabel: 'เริ่มทัวร์',
  },
  {
    id: 'tabs',
    target: 'tab-bar',
    title: 'สองแท็บหลัก',
    body: '"ทะเบียนวัสดุ" คือรายการวัสดุทั้งหมดที่สั่งซื้อได้ ส่วน "สูตรวัสดุ" คือกติกาแปลงชิ้นงานเป็นยอดวัสดุที่ต้องใช้',
  },
  // Do NOT gate these two on s.tab: when a replay starts from the recipes tab their
  // data-tour targets are simply absent from the DOM, and GuidedTour's element-not-found
  // grace skip handles them. Gating on tab would instead shrink the eligible list BEHIND
  // the live index mid-tour (during 'switch-recipes'), skipping later steps like 'create-recipe'.
  {
    id: 'materials-table',
    target: 'materials-table',
    when: (s) => s.hasMaterials,
    title: 'ทะเบียนวัสดุ',
    body: 'แต่ละแถวคือวัสดุ 1 รายการ: รหัส หน่วย ขนาดแพ็ค สั่งขั้นต่ำ ผู้ขายหลัก และสถานะใช้งาน',
  },
  {
    id: 'add-material',
    target: 'add-material',
    when: (s) => s.isBuyer,
    title: 'เพิ่มวัสดุ',
    body: 'กดปุ่มนี้เพื่อเพิ่มวัสดุใหม่ — แก้ไขหรือปิดใช้งานวัสดุเดิมได้จากปุ่มท้ายแถว',
  },
  {
    id: 'switch-recipes',
    target: 'recipes-tab',
    waitFor: (s) => s.tab === 'recipes',
    title: 'ไปดูสูตรวัสดุ',
    body: 'ลองกดแท็บ "สูตรวัสดุ" เพื่อดูส่วนสูตรการคำนวณ',
  },
  {
    id: 'create-recipe',
    target: 'create-recipe',
    when: (s) => s.tab === 'recipes',
    title: 'สร้างสูตร (ร่าง)',
    body: 'กำหนดว่าชิ้นงานประเภทไหนใช้วัสดุอะไร: แหล่งค่า (ปริมาตร/พื้นที่/น้ำหนัก/ต่อชิ้น) × ตัวคูณ × เผื่อเสีย% — ทุกคนสร้างร่างได้',
  },
  {
    id: 'governance',
    target: 'recipes-list',
    when: (s) => s.tab === 'recipes',
    title: 'ร่าง → เปิดใช้งาน',
    body: 'สูตรเริ่มที่สถานะ "ร่าง" ผู้ดูแลระบบเป็นผู้กดเปิดใช้งาน (รุ่นเดิมของคู่เดียวกันถูกปลดอัตโนมัติ) — การคำนวณวัสดุใช้เฉพาะสูตรที่ "ใช้งาน"',
  },
  {
    id: 'finish',
    target: 'help-button',
    title: 'จบทัวร์แล้ว',
    body: 'อยากดูทัวร์นี้อีกครั้ง กดปุ่มนี้ได้ตลอดเวลา',
  },
];

const FormMaterials = () => {
  const { user } = useAuth();
  // Material master = procurement data → same buyer/Admin gate as FormPO's confirm actions.
  const isBuyer = user && (user.role === 'buyer' || user.role === 'Admin');
  // Recipe activation retires the current active revision → Admin-only governance action.
  const isAdmin = user && user.role === 'Admin';

  const [tab, setTab] = useState('materials');
  const { showToast, toastNode } = useToast();

  // ---- materials tab state ----
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggleBusy, setToggleBusy] = useState(false);

  const loadMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      const res = await fetchMaterials(true);
      setMaterials(res.data || []);
    } catch {
      showToast('โหลดข้อมูลวัสดุไม่สำเร็จ', 'error');
    } finally {
      setMaterialsLoading(false);
    }
  }, [showToast]);

  // ---- recipes tab state ----
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipeFormOpen, setRecipeFormOpen] = useState(false);
  const [activateTarget, setActivateTarget] = useState(null);
  const [activateBusy, setActivateBusy] = useState(false);

  const loadRecipes = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const res = await fetchMaterialRecipes();
      setRecipes(res.data || []);
    } catch {
      showToast('โหลดข้อมูลสูตรไม่สำเร็จ', 'error');
    } finally {
      setRecipesLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);
  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const recipesByType = useMemo(() => {
    const map = new Map();
    recipes.forEach((r) => {
      if (!map.has(r.component_type)) map.set(r.component_type, []);
      map.get(r.component_type).push(r);
    });
    return Array.from(map.entries());
  }, [recipes]);

  const activeMaterials = useMemo(() => materials.filter((m) => m.active), [materials]);

  // ---- guided tour ----
  const tourState = useMemo(
    () => ({
      tab,
      hasMaterials: !materialsLoading && materials.length > 0,
      isBuyer,
      isAdmin,
    }),
    [tab, materialsLoading, materials.length, isBuyer, isAdmin],
  );
  const tour = useTour({ storageKey: TOUR_STORAGE_KEY, steps: TOUR_STEPS, state: tourState });

  // ---- material actions ----
  const openCreateMaterial = () => { setEditMaterial(null); setMaterialFormOpen(true); };
  const openEditMaterial = (m) => { setEditMaterial(m); setMaterialFormOpen(true); };

  const onSaveMaterial = async (values) => {
    try {
      if (editMaterial) {
        await updateMaterial(editMaterial.id, values);
      } else {
        await createMaterial(values);
      }
      setMaterialFormOpen(false);
      showToast(editMaterial ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มวัสดุแล้ว');
      loadMaterials();
    } catch (err) {
      showToast(err?.response?.data?.error || 'บันทึกไม่สำเร็จ', 'error');
    }
  };

  const onToggleActive = async () => {
    const m = toggleTarget;
    if (!m) return;
    setToggleBusy(true);
    try {
      await updateMaterial(m.id, { active: !m.active });
      setToggleTarget(null);
      showToast(m.active ? 'ปิดใช้งานวัสดุแล้ว' : 'เปิดใช้งานวัสดุแล้ว');
      loadMaterials();
    } catch {
      showToast('ดำเนินการไม่สำเร็จ', 'error');
    } finally {
      setToggleBusy(false);
    }
  };

  // ---- recipe actions ----
  const onCreateRecipe = async (values) => {
    try {
      await createMaterialRecipe(values);
      setRecipeFormOpen(false);
      showToast('สร้างสูตร (ร่าง) แล้ว');
      loadRecipes();
    } catch (err) {
      showToast(err?.response?.data?.error || 'สร้างสูตรไม่สำเร็จ', 'error');
    }
  };

  const onActivateRecipe = async () => {
    const r = activateTarget;
    if (!r) return;
    setActivateBusy(true);
    try {
      await activateMaterialRecipe(r.id);
      setActivateTarget(null);
      showToast('เปิดใช้งานสูตรแล้ว');
      loadRecipes();
    } catch (err) {
      setActivateTarget(null);
      if (err?.response?.status === 409) {
        showToast('สูตรนี้ไม่อยู่ในสถานะร่าง หรือถูกเปิดใช้งานพร้อมกัน', 'error');
      } else {
        showToast('เปิดใช้งานไม่สำเร็จ', 'error');
      }
    } finally {
      setActivateBusy(false);
    }
  };

  return (
    <div className="mes-card">
      <CardHeader
        title="วัสดุและสูตรการคำนวณ"
        right={
          <button
            type="button"
            data-tour="help-button"
            className="mes-btn mes-btn-ghost !px-3"
            onClick={tour.start}
            aria-label="วิธีใช้งาน"
            title="วิธีใช้งาน"
          >
            <Icon name="help-circle" size={18} />
          </button>
        }
      />

      <div data-tour="tab-bar" className="flex gap-1 overflow-x-auto border-b border-mes-border px-3 pt-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            data-tour={t.key === 'recipes' ? 'recipes-tab' : undefined}
            onClick={() => setTab(t.key)}
            className={`min-h-touch md:min-h-0 whitespace-nowrap rounded-t-sm px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.key ? 'border-mes-accent text-mes-accent' : 'border-transparent text-mes-muted hover:text-mes-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'materials' ? (
        <div>
          {isBuyer && (
            <div className="flex justify-end px-3 pt-3 md:px-5">
              <button data-tour="add-material" className="mes-btn mes-btn-primary" onClick={openCreateMaterial}>
                <Icon name="plus" size={15} /> เพิ่มวัสดุ
              </button>
            </div>
          )}

          {materialsLoading ? (
            <Spinner />
          ) : materials.length === 0 ? (
            <EmptyState icon="cube" title="ยังไม่มีวัสดุในระบบ" />
          ) : (
            <>
              {/* base: cards */}
              <div data-tour="materials-table" className="flex flex-col gap-2 p-3 md:hidden">
                {materials.map((m) => (
                  <div key={m.id} className="mes-card p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{m.code}</span>
                      <span className="ml-auto text-xs text-mes-muted">{m.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
                    </div>
                    <div className="mt-1 text-sm">{m.name_th}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-mes-muted tabular-nums">
                      <span>หน่วย {m.unit}</span>
                      {m.pack_size != null && <span>แพ็ค {m.pack_size}</span>}
                      {m.min_order_qty != null && <span>ขั้นต่ำ {m.min_order_qty}</span>}
                      {m.default_supplier && <span>ผู้ขาย {m.default_supplier}</span>}
                    </div>
                    {isBuyer && (
                      <div className="mt-2 flex gap-1.5">
                        <button className="mes-btn mes-btn-ghost !min-h-touch text-xs" onClick={() => openEditMaterial(m)}>แก้ไข</button>
                        <button className="mes-btn mes-btn-ghost !min-h-touch text-xs" onClick={() => setToggleTarget(m)}>
                          {m.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* md+: table */}
              <div data-tour="materials-table" className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="mes-th">รหัส</th>
                      <th className="mes-th">ชื่อวัสดุ</th>
                      <th className="mes-th">หน่วย</th>
                      <th className="mes-th text-right">ขนาดแพ็ค</th>
                      <th className="mes-th text-right">สั่งขั้นต่ำ</th>
                      <th className="mes-th">ผู้ขายหลัก</th>
                      <th className="mes-th">สถานะ</th>
                      {isBuyer && <th className="mes-th text-right">การจัดการ</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id}>
                        <td className="mes-td font-mono">{m.code}</td>
                        <td className="mes-td">{m.name_th}</td>
                        <td className="mes-td">{m.unit}</td>
                        <td className="mes-td text-right">{m.pack_size ?? '-'}</td>
                        <td className="mes-td text-right">{m.min_order_qty ?? '-'}</td>
                        <td className="mes-td">{m.default_supplier || '-'}</td>
                        <td className="mes-td text-mes-muted">{m.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</td>
                        {isBuyer && (
                          <td className="mes-td">
                            <div className="flex justify-end gap-1.5">
                              <button className="mes-btn mes-btn-ghost !py-1.5 text-xs" onClick={() => openEditMaterial(m)}>แก้ไข</button>
                              <button className="mes-btn mes-btn-ghost !py-1.5 text-xs" onClick={() => setToggleTarget(m)}>
                                {m.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3 md:px-5">
            <p className="text-xs text-mes-muted">วิศวกรรมสร้างสูตร (ร่าง) — ผู้ดูแลระบบเป็นผู้เปิดใช้งาน</p>
            <button data-tour="create-recipe" className="mes-btn mes-btn-primary" onClick={() => setRecipeFormOpen(true)}>
              <Icon name="plus" size={15} /> สร้างสูตร (ร่าง)
            </button>
          </div>

          <div data-tour="recipes-list">
            {recipesLoading ? (
              <Spinner />
            ) : recipesByType.length === 0 ? (
              <EmptyState icon="clipboard-list" title="ยังไม่มีสูตรในระบบ" />
            ) : (
              <div className="flex flex-col gap-5 p-3 md:p-5">
                {recipesByType.map(([type, rows]) => (
                <div key={type}>
                  <h3 className="mb-2 text-sm font-semibold text-mes-text">{type}</h3>
                  {/* base: cards */}
                  <div className="flex flex-col gap-2 md:hidden">
                    {rows.map((r) => {
                      const st = RECIPE_STATUS_TH[r.status] || { th: r.status, cls: 'text-mes-muted' };
                      return (
                        <div key={r.id} className="mes-card p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{r.material_name_th}</span>
                            <span className={`ml-auto text-xs ${st.cls}`}>{st.th}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-mes-muted tabular-nums">
                            <span>{SOURCE_ATTR_TH[r.source_attr] || r.source_attr}</span>
                            <span>ตัวคูณ {r.factor}</span>
                            <span>เผื่อเสีย {r.waste_pct ?? 0}%</span>
                            <span>รุ่น {r.revision}</span>
                          </div>
                          {r.status === 'draft' && isAdmin && (
                            <div className="mt-2">
                              <button
                                className="mes-btn mes-btn-primary !min-h-touch text-xs"
                                onClick={() => setActivateTarget(r)}
                              >
                                เปิดใช้งาน
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* md+: table */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="mes-th">วัสดุ</th>
                          <th className="mes-th">แหล่งค่า</th>
                          <th className="mes-th text-right">ตัวคูณ</th>
                          <th className="mes-th text-right">เผื่อเสีย %</th>
                          <th className="mes-th text-right">รุ่น</th>
                          <th className="mes-th">สถานะ</th>
                          <th className="mes-th text-right">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const st = RECIPE_STATUS_TH[r.status] || { th: r.status, cls: 'text-mes-muted' };
                          return (
                            <tr key={r.id}>
                              <td className="mes-td">
                                {r.material_name_th}{' '}
                                <span className="font-mono text-xs text-mes-muted">({r.material_code})</span>
                              </td>
                              <td className="mes-td">{SOURCE_ATTR_TH[r.source_attr] || r.source_attr}</td>
                              <td className="mes-td text-right">{r.factor}</td>
                              <td className="mes-td text-right">{r.waste_pct ?? 0}</td>
                              <td className="mes-td text-right">{r.revision}</td>
                              <td className={`mes-td ${st.cls}`}>{st.th}</td>
                              <td className="mes-td">
                                <div className="flex justify-end">
                                  {r.status === 'draft' && isAdmin && (
                                    <button
                                      className="mes-btn mes-btn-primary !py-1.5 text-xs"
                                      onClick={() => setActivateTarget(r)}
                                    >
                                      เปิดใช้งาน
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      <FVMaterial
        open={materialFormOpen}
        onClose={() => setMaterialFormOpen(false)}
        initialValues={editMaterial}
        onSave={onSaveMaterial}
      />
      <FVMaterialRecipe
        open={recipeFormOpen}
        onClose={() => setRecipeFormOpen(false)}
        materials={activeMaterials}
        onSave={onCreateRecipe}
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={onToggleActive}
        title={toggleTarget?.active ? 'ปิดใช้งานวัสดุ' : 'เปิดใช้งานวัสดุ'}
        message={
          toggleTarget?.active
            ? `ปิดใช้งาน "${toggleTarget?.name_th}"? วัสดุที่ปิดใช้งานจะถูกซ่อนจากสูตรใหม่และ PO ใหม่ แต่ประวัติเดิมยังคงอยู่`
            : `เปิดใช้งาน "${toggleTarget?.name_th}" อีกครั้ง?`
        }
        confirmLabel={toggleTarget?.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
        danger={Boolean(toggleTarget?.active)}
        busy={toggleBusy}
      />

      <ConfirmDialog
        open={Boolean(activateTarget)}
        onClose={() => setActivateTarget(null)}
        onConfirm={onActivateRecipe}
        title="เปิดใช้งานสูตร"
        message={`การเปิดใช้งานสูตรนี้จะยกเลิกสูตรที่ใช้งานอยู่เดิมของ "${activateTarget?.material_name_th || ''}" สำหรับประเภทชิ้นงาน "${activateTarget?.component_type || ''}" ต้องการดำเนินการต่อหรือไม่?`}
        confirmLabel="เปิดใช้งาน"
        busy={activateBusy}
      />

      <GuidedTour
        open={tour.open}
        step={tour.step}
        stepIndex={tour.stepIndex}
        total={tour.total}
        isLast={tour.isLast}
        state={tourState}
        onNext={tour.next}
        onBack={tour.back}
        onClose={tour.close}
      />

      {toastNode}
    </div>
  );
};

export default FormMaterials;
