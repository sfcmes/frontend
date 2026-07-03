// [MES] FormMaterialRequirements — buyer-facing material demand screen: select projects,
// review the calculated requirement with per-component drilldown, and generate consolidated
// draft purchase orders grouped by supplier.
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { fetchProjects, fetchMaterialRequirements, generateMaterialPO } from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { Modal, EmptyState, Spinner, useToast, CardHeader } from 'src/components/mes/ui';

const SOURCE_ATTR_TH = {
  volume: 'ปริมาตร (m³)',
  area: 'พื้นที่ (m²)',
  weight: 'น้ำหนัก (kg)',
  per_piece: 'ต่อชิ้น',
};

const nf = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 3 });
const fmt = (n) => (n === null || n === undefined || n === '' ? '-' : nf.format(Number(n)));

// Explainability drilldown — shared between the mobile card and the md+ table row.
function ComponentBreakdown({ components, projectNameById }) {
  if (!components || components.length === 0) {
    return <p className="text-xs text-mes-muted">ไม่มีข้อมูลชิ้นงานประกอบ</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="mes-th !py-1.5">ชิ้นงาน</th>
            <th className="mes-th !py-1.5">ประเภท</th>
            <th className="mes-th !py-1.5 text-right">ค่าที่ใช้</th>
            <th className="mes-th !py-1.5 text-right">ตัวคูณ</th>
            <th className="mes-th !py-1.5 text-right">เผื่อเสีย %</th>
            <th className="mes-th !py-1.5 text-right">จำนวน</th>
            <th className="mes-th !py-1.5 text-right">สูตร rev</th>
          </tr>
        </thead>
        <tbody>
          {components.map((c) => (
            <tr key={c.id}>
              <td className="mes-td !py-1.5">
                <div className="min-w-[9rem]">{c.name}</div>
                <div className="text-mes-muted">{projectNameById.get(String(c.project_id)) || '-'}</div>
              </td>
              <td className="mes-td !py-1.5">{c.type}</td>
              <td className="mes-td !py-1.5 text-right tabular-nums whitespace-nowrap">
                {fmt(c.source_value)}{' '}
                <span className="text-mes-muted">({SOURCE_ATTR_TH[c.source_attr] || c.source_attr})</span>
              </td>
              <td className="mes-td !py-1.5 text-right tabular-nums">{fmt(c.factor)}</td>
              <td className="mes-td !py-1.5 text-right tabular-nums">{fmt(c.waste_pct)}</td>
              <td className="mes-td !py-1.5 text-right tabular-nums">{fmt(c.qty)}</td>
              <td className="mes-td !py-1.5 text-right tabular-nums">{c.recipe_revision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FormMaterialRequirements = () => {
  const { user } = useAuth();
  // Requirement generation is procurement action → same buyer/Admin gate as FormPO/FormMaterials.
  const isBuyer = user && (user.role === 'buyer' || user.role === 'Admin');
  const { showToast, toastNode } = useToast();

  // ---- project picker ----
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(true);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  useEffect(() => {
    (async () => {
      setProjectsLoading(true);
      try {
        const res = await fetchProjects();
        setProjects(res.data || []);
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, []);

  const projectNameById = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => map.set(String(p.id), p.name));
    return map;
  }, [projects]);

  const toggleProject = (id) => {
    setSelectedProjectIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  // ---- calculation ----
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [selectedMaterialIds, setSelectedMaterialIds] = useState(() => new Set());
  const [generatedPOs, setGeneratedPOs] = useState(null);

  const onCalculate = async () => {
    if (selectedProjectIds.length === 0) return;
    setCalculating(true);
    setGeneratedPOs(null);
    try {
      const res = await fetchMaterialRequirements(selectedProjectIds);
      const data = res.data || {};
      setResult(data);
      setExpanded(new Set());
      setSelectedMaterialIds(
        new Set((data.materials || []).filter((m) => m.net > 0).map((m) => m.material.id)),
      );
      setPickerOpen(false);
    } catch (err) {
      showToast(err?.response?.data?.error || 'คำนวณความต้องการวัสดุไม่สำเร็จ', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleMaterial = (id, net) => {
    if (net === 0) return;
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const materials = useMemo(() => result?.materials || [], [result]);
  const warnings = result?.warnings || { missingAttr: [], noRecipe: [], recipeConflict: [] };
  const hasWarnings = (warnings.missingAttr?.length || 0) > 0
    || (warnings.noRecipe?.length || 0) > 0
    || (warnings.recipeConflict?.length || 0) > 0;

  const missingAttrGroups = useMemo(() => {
    const map = new Map();
    (warnings.missingAttr || []).forEach((w) => {
      if (!map.has(w.missing)) map.set(w.missing, []);
      map.get(w.missing).push(w);
    });
    return Array.from(map.entries());
  }, [warnings.missingAttr]);

  const [expandedWarningGroups, setExpandedWarningGroups] = useState(() => new Set());
  const toggleWarningGroup = (key) => {
    setExpandedWarningGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ---- generate draft PO ----
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const supplierGroups = useMemo(() => {
    const map = new Map();
    materials.forEach((m) => {
      if (!selectedMaterialIds.has(m.material.id)) return;
      const key = m.material.default_supplier || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return Array.from(map.entries()).map(([supplier, mats]) => ({ supplier, materials: mats }));
  }, [materials, selectedMaterialIds]);

  const openGenerate = () => {
    setNotes('');
    setDeliveryDate('');
    setGenerateOpen(true);
  };

  const onGenerate = async () => {
    setGenerateBusy(true);
    try {
      const lines = materials
        .filter((m) => selectedMaterialIds.has(m.material.id))
        .map((m) => ({ material_id: m.material.id, quantity: m.net, project_id: null }));
      const payload = { lines };
      if (notes.trim()) payload.notes = notes.trim();
      if (deliveryDate) payload.requested_delivery_date = deliveryDate;
      const res = await generateMaterialPO(payload);
      const pos = res.data?.pos || [];
      setGenerateOpen(false);
      setGeneratedPOs(pos);
      showToast(`สร้างใบสั่งซื้อ (ร่าง) แล้ว ${pos.length} ฉบับ`);
    } catch (err) {
      showToast(err?.response?.data?.error || 'สร้างใบสั่งซื้อไม่สำเร็จ', 'error');
    } finally {
      setGenerateBusy(false);
    }
  };

  const selectedCount = selectedMaterialIds.size;

  return (
    <div className="mes-card">
      <CardHeader title="คำนวณความต้องการวัสดุ" sub="เลือกโครงการเพื่อคำนวณยอดวัสดุที่ต้องสั่งซื้อเพิ่ม" />

      {/* Project picker */}
      <div className="border-b border-mes-border p-3 md:p-5">
        <button
          type="button"
          className="flex w-full items-center gap-2 text-left text-sm font-semibold text-mes-text"
          onClick={() => setPickerOpen((v) => !v)}
        >
          <Icon name={pickerOpen ? 'chevron-down' : 'chevron-right'} size={16} className="shrink-0 text-mes-muted" />
          เลือกโครงการ {selectedProjectIds.length > 0 && `(${selectedProjectIds.length})`}
        </button>

        {pickerOpen && (
          <div className="mt-3">
            {projectsLoading ? (
              <Spinner />
            ) : projects.length === 0 ? (
              <EmptyState icon="home-plus" title="ยังไม่มีโครงการในระบบ" />
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-md border border-mes-border">
                {projects.map((p) => {
                  const checked = selectedProjectIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex min-h-touch cursor-pointer items-center gap-3 border-b border-mes-border px-3 text-sm last:border-0 hover:bg-mes-surface-2"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--mes-accent)]"
                        checked={checked}
                        onChange={() => toggleProject(p.id)}
                      />
                      <span className="min-w-0 truncate">{p.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="mes-btn mes-btn-primary"
                onClick={onCalculate}
                disabled={selectedProjectIds.length === 0 || calculating}
              >
                {calculating ? 'กำลังคำนวณ…' : 'คำนวณความต้องการ'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!result ? (
        <EmptyState
          icon="cube"
          title="เลือกโครงการเพื่อเริ่มคำนวณ"
          hint="เลือกโครงการอย่างน้อย 1 รายการด้านบน แล้วกด “คำนวณความต้องการ”"
        />
      ) : (
        <div className="p-3 md:p-5">
          {/* Warnings banner — never hidden, never silently zeroed */}
          {hasWarnings && (
            <div className="mb-4 rounded-md border border-mes-accent/40 bg-mes-surface-2 p-3 md:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-mes-accent">
                <Icon name="alert-triangle" size={16} /> คำเตือนในการคำนวณ
              </div>
              <div className="mt-2 flex flex-col gap-2 text-xs text-mes-muted">
                {missingAttrGroups.map(([attr, items]) => {
                  const key = `missing-${attr}`;
                  const open = expandedWarningGroups.has(key);
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-left hover:text-mes-text"
                        onClick={() => toggleWarningGroup(key)}
                      >
                        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={13} className="shrink-0" />
                        คำนวณไม่ได้ {items.length} ชิ้น — ไม่มีข้อมูล {SOURCE_ATTR_TH[attr] || attr}
                      </button>
                      {open && (
                        <ul className="ml-5 mt-1 list-disc">
                          {items.map((it) => (
                            <li key={it.component_id}>{it.name} ({it.type})</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
                {(warnings.noRecipe || []).map((w) => (
                  <div key={`norecipe-${w.type}`}>
                    ยังไม่มีสูตรสำหรับประเภท: {w.type} ({w.count} ชิ้น)
                  </div>
                ))}
                {(warnings.recipeConflict || []).map((w) => (
                  <div key={`conflict-${w.type}-${w.materialCode}`}>
                    สูตรซ้ำซ้อน (ตัวพิมพ์เล็ก-ใหญ่): {w.type}/{w.materialCode}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demand table */}
          {materials.length === 0 ? (
            <EmptyState
              icon="clipboard-list"
              title="ยังไม่มีความต้องการวัสดุที่คำนวณได้"
              hint="วิศวกรต้องสร้างและเปิดใช้งานสูตรวัสดุก่อน ระบบจึงจะคำนวณยอดที่ต้องสั่งซื้อเพิ่มได้"
              action={
                <Link to="/forms/form-materials" className="mes-btn mes-btn-ghost">
                  ไปที่หน้าวัสดุและสูตร
                </Link>
              }
            />
          ) : (
            <>
              {/* base: cards */}
              <div className="flex flex-col gap-2 md:hidden">
                {materials.map((m) => {
                  const id = m.material.id;
                  const open = expanded.has(id);
                  const checked = selectedMaterialIds.has(id);
                  return (
                    <div key={id} className="mes-card p-3">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--mes-accent)]"
                          checked={checked}
                          disabled={m.net === 0}
                          onChange={() => toggleMaterial(id, m.net)}
                        />
                        <button type="button" className="min-w-0 grow text-left" onClick={() => toggleExpand(id)}>
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold">{m.material.name_th}</span>
                            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} className="shrink-0 text-mes-muted" />
                          </div>
                          <div className="font-mono text-xs text-mes-muted">{m.material.code}</div>
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs tabular-nums">
                        <div>
                          <div className="text-mes-muted">ต้องใช้</div>
                          <div>{fmt(m.withWaste)} {m.material.unit}</div>
                          <div className="text-[11px] text-mes-muted">ฐาน {fmt(m.base)}</div>
                        </div>
                        <div>
                          <div className="text-mes-muted">ปัดขึ้น</div>
                          <div>{fmt(m.rounded)} {m.material.unit}</div>
                        </div>
                        <div>
                          <div className="text-mes-muted">สั่งแล้ว/ค้างรับ</div>
                          <div>{fmt(m.open)} {m.material.unit}</div>
                          {m.draftQty > 0 && <div className="text-[11px] text-mes-muted">ร่าง +{fmt(m.draftQty)}</div>}
                        </div>
                        <div>
                          <div className="text-mes-muted">ต้องสั่งเพิ่ม</div>
                          <div className={`font-semibold ${m.net > 0 ? 'text-mes-accent' : ''}`}>
                            {fmt(m.net)} {m.material.unit}
                          </div>
                        </div>
                      </div>
                      {open && (
                        <div className="mt-3 border-t border-mes-border pt-2">
                          <ComponentBreakdown components={m.components} projectNameById={projectNameById} />
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
                      <th className="mes-th" />
                      <th className="mes-th">วัสดุ</th>
                      <th className="mes-th">หน่วย</th>
                      <th className="mes-th text-right">ต้องใช้</th>
                      <th className="mes-th text-right">ปัดขึ้น</th>
                      <th className="mes-th text-right">สั่งแล้ว/ค้างรับ</th>
                      <th className="mes-th text-right">ต้องสั่งเพิ่ม</th>
                      <th className="mes-th" />
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => {
                      const id = m.material.id;
                      const open = expanded.has(id);
                      const checked = selectedMaterialIds.has(id);
                      return (
                        <Fragment key={id}>
                          <tr>
                            <td className="mes-td">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-[var(--mes-accent)]"
                                checked={checked}
                                disabled={m.net === 0}
                                onChange={() => toggleMaterial(id, m.net)}
                              />
                            </td>
                            <td className="mes-td">
                              <div>{m.material.name_th}</div>
                              <div className="font-mono text-xs text-mes-muted">{m.material.code}</div>
                            </td>
                            <td className="mes-td">{m.material.unit}</td>
                            <td className="mes-td text-right tabular-nums">
                              <div>{fmt(m.withWaste)}</div>
                              <div className="text-xs text-mes-muted">ฐาน {fmt(m.base)}</div>
                            </td>
                            <td className="mes-td text-right tabular-nums">{fmt(m.rounded)}</td>
                            <td className="mes-td text-right tabular-nums">
                              <div>{fmt(m.open)}</div>
                              {m.draftQty > 0 && <div className="text-xs text-mes-muted">ร่าง +{fmt(m.draftQty)}</div>}
                            </td>
                            <td className={`mes-td text-right tabular-nums font-semibold ${m.net > 0 ? 'text-mes-accent' : ''}`}>
                              {fmt(m.net)}
                            </td>
                            <td className="mes-td text-right">
                              <button
                                type="button"
                                className="mes-btn mes-btn-ghost !py-1.5"
                                onClick={() => toggleExpand(id)}
                                aria-label="แสดงรายละเอียด"
                              >
                                <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} />
                              </button>
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-mes-surface-2">
                              <td className="mes-td" colSpan={8}>
                                <ComponentBreakdown components={m.components} projectNameById={projectNameById} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Generate bar — buyer/Admin only action gate */}
          {isBuyer && materials.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-mes-border bg-mes-surface p-3">
              <span className="text-sm text-mes-muted">เลือก {selectedCount} วัสดุ</span>
              <button
                type="button"
                className="mes-btn mes-btn-primary"
                onClick={openGenerate}
                disabled={selectedCount === 0}
              >
                สร้างใบสั่งซื้อ (ร่าง)
              </button>
            </div>
          )}

          {/* Result panel */}
          {generatedPOs && generatedPOs.length > 0 && (
            <div className="mt-4 rounded-md border border-mes-border p-3 md:p-4">
              <div className="text-sm font-semibold text-mes-text">
                สร้างใบสั่งซื้อ (ร่าง) แล้ว {generatedPOs.length} ฉบับ
              </div>
              <ul className="mt-2 flex flex-col gap-1.5">
                {generatedPOs.map((po) => (
                  <li key={po.id}>
                    <Link
                      to={`/forms/form-po?highlight=${po.id}`}
                      className="flex items-center justify-between gap-2 rounded-sm border border-mes-border px-3 py-2 text-sm hover:bg-mes-surface-2"
                    >
                      <span className="font-mono font-semibold text-mes-accent">{po.po_number}</span>
                      <span className="min-w-0 truncate text-mes-muted">{po.supplier || 'ไม่ระบุผู้ขาย'}</span>
                      <span className="shrink-0 text-xs text-mes-muted tabular-nums">{po.itemCount} รายการ</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Modal
        open={generateOpen}
        onClose={() => !generateBusy && setGenerateOpen(false)}
        title="สร้างใบสั่งซื้อ (ร่าง)"
        footer={
          <>
            <button type="button" className="mes-btn mes-btn-ghost" onClick={() => setGenerateOpen(false)} disabled={generateBusy}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="mes-btn mes-btn-primary"
              onClick={onGenerate}
              disabled={generateBusy || supplierGroups.length === 0}
            >
              {generateBusy ? 'กำลังสร้าง…' : 'ยืนยันสร้างใบสั่งซื้อ'}
            </button>
          </>
        }
      >
        <p className="text-sm text-mes-text">
          ระบบจะสร้างใบสั่งซื้อสถานะ &ldquo;ร่าง&rdquo; แยกตามผู้ขาย จำนวน {supplierGroups.length} ฉบับ
          เพื่อให้ผู้จัดซื้อตรวจสอบก่อนส่งจริง
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {supplierGroups.map(({ supplier, materials: mats }) => (
            <li key={supplier || 'none'} className="flex items-center justify-between rounded-sm border border-mes-border px-3 py-2">
              <span>{supplier || 'ไม่ระบุผู้ขาย'}</span>
              <span className="text-xs text-mes-muted tabular-nums">{mats.length} รายการ</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <label className="mes-label" htmlFor="mr-delivery">กำหนดส่งที่ต้องการ (ไม่บังคับ)</label>
          <input
            id="mr-delivery"
            type="date"
            className="mes-input"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <label className="mes-label" htmlFor="mr-notes">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            id="mr-notes"
            className="mes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Modal>

      {toastNode}
    </div>
  );
};

export default FormMaterialRequirements;
