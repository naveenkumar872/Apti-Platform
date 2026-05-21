import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Plus, Trash2, Edit3, Loader2, X, Save, Clock,
  Target, Layers, AlertTriangle, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';
const input = 'w-full px-3 py-2 rounded-lg text-[13px] bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-[3px] focus:ring-violet-500/15 transition-all';

/* Empty pattern used when adding a new company */
const blankPattern = (subjects) => ({
  overall_cutoff_percent: 60,
  navigation: 'section_locked',
  negative_marking: 0,
  sections: [
    { name: 'Quantitative Aptitude', subject_id: subjects[0]?.subject_id || '', question_count: 10, duration_minutes: 20, cutoff_percent: 60 },
    { name: 'Logical Reasoning',     subject_id: subjects[1]?.subject_id || '', question_count: 10, duration_minutes: 20, cutoff_percent: 60 },
    { name: 'Verbal Ability',        subject_id: subjects[2]?.subject_id || '', question_count: 10, duration_minutes: 20, cutoff_percent: 60 },
  ],
});

/* ─────────────────────────────────────────────────
   Pattern edit modal
   ───────────────────────────────────────────────── */
function PatternModal({ company, subjects, onClose, onSaved }) {
  const isNew = !company;
  const [name, setName] = useState(company?.name || '');
  const [cutoffInfo, setCutoffInfo] = useState(company?.cutoff_info || '');
  const [tips, setTips] = useState(company?.interview_tips || '');
  const [pattern, setPattern] = useState(company?.pattern || blankPattern(subjects));
  const [topicsText, setTopicsText] = useState(
    Array.isArray(company?.important_topics) ? company.important_topics.join(', ') : ''
  );
  const [saving, setSaving] = useState(false);

  const updateSection = (i, key, val) => {
    setPattern(p => ({
      ...p,
      sections: p.sections.map((s, j) => j === i ? { ...s, [key]: key === 'name' || key === 'subject_id' ? val : Number(val) } : s),
    }));
  };
  const addSection = () => {
    setPattern(p => ({
      ...p,
      sections: [...p.sections, {
        name: 'New section',
        subject_id: subjects[0]?.subject_id || '',
        question_count: 10,
        duration_minutes: 20,
        cutoff_percent: 60,
      }],
    }));
  };
  const removeSection = (i) => {
    setPattern(p => ({ ...p, sections: p.sections.filter((_, j) => j !== i) }));
  };

  const totalQuestions = pattern.sections.reduce((s, sec) => s + (Number(sec.question_count) || 0), 0);
  const totalDuration  = pattern.sections.reduce((s, sec) => s + (Number(sec.duration_minutes) || 0), 0);

  const save = async () => {
    if (!name.trim()) { toast.error('Company name required'); return; }
    if (pattern.sections.length === 0) { toast.error('Add at least one section'); return; }
    setSaving(true);
    try {
      const important_topics = topicsText.split(',').map(s => s.trim()).filter(Boolean);
      const body = { name: name.trim(), cutoff_info: cutoffInfo, interview_tips: tips, important_topics, pattern };
      if (isNew) {
        await api.post('/admin/simulator/patterns', body);
        toast.success('Company added');
      } else {
        await api.put(`/admin/simulator/patterns/${company.company_id}`, body);
        toast.success('Pattern updated');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <Building2 size={17} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">
                {isNew ? 'Add company' : `Edit ${company.name}`}
              </h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Configure section structure + cutoffs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Company name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className={input} placeholder="e.g. Mphasis, Persistent Systems" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Overall cutoff %</label>
              <input type="number" min={0} max={100} value={pattern.overall_cutoff_percent}
                onChange={e => setPattern(p => ({ ...p, overall_cutoff_percent: Number(e.target.value) }))}
                className={input} />
            </div>
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Important topics (comma-separated)</label>
            <input value={topicsText} onChange={e => setTopicsText(e.target.value)} className={input}
              placeholder="Quantitative Aptitude, Logical Reasoning, Verbal Ability" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Cutoff info (shown to students)</label>
              <input value={cutoffInfo} onChange={e => setCutoffInfo(e.target.value)} className={input}
                placeholder="e.g. Sectional cutoffs apply" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Interview / prep tip</label>
              <input value={tips} onChange={e => setTips(e.target.value)} className={input}
                placeholder="A one-line study hint" />
            </div>
          </div>

          {/* Help — how questions are sourced */}
          <div className="rounded-xl bg-indigo-50/60 dark:bg-indigo-500/[0.05] border border-indigo-200 dark:border-indigo-500/20 p-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
              How questions are picked
            </p>
            <p className="text-[12.5px] text-slate-700 dark:text-slate-300 leading-relaxed">
              You configure <span className="font-semibold">subject + question count</span> per section. When a student starts the simulator, the system <span className="font-semibold">randomly pulls that many questions from your Question Bank</span> matching the subject. If the bank doesn't have enough, AI generates the shortfall on the fly. <span className="text-slate-500 dark:text-slate-400">You don't pick specific questions here.</span>
            </p>
          </div>

          {/* Sections */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.06]">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-violet-500" />
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Sections</p>
                <span className="text-[11px] text-slate-500">·</span>
                <span className="text-[11px] text-slate-500">{totalQuestions} questions · {totalDuration} min total</span>
              </div>
              <button onClick={addSection}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[11.5px] font-semibold transition-colors">
                <Plus size={11} /> Add section
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {pattern.sections.map((s, i) => (
                <div key={i} className="p-4 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Name</label>
                    <input value={s.name} onChange={e => updateSection(i, 'name', e.target.value)} className={input} />
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Subject</label>
                    <select value={s.subject_id} onChange={e => updateSection(i, 'subject_id', e.target.value)} className={input}>
                      <option value="">— select —</option>
                      {subjects.map(sub => <option key={sub.subject_id} value={sub.subject_id}>{sub.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4 sm:col-span-1">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Qs</label>
                    <input type="number" min={1} max={100} value={s.question_count}
                      onChange={e => updateSection(i, 'question_count', e.target.value)} className={input} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Minutes</label>
                    <input type="number" min={1} max={240} value={s.duration_minutes}
                      onChange={e => updateSection(i, 'duration_minutes', e.target.value)} className={input} />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Cut %</label>
                    <input type="number" min={0} max={100} value={s.cutoff_percent}
                      onChange={e => updateSection(i, 'cutoff_percent', e.target.value)} className={input} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeSection(i)}
                      disabled={pattern.sections.length === 1}
                      className="p-2 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-30">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> {isNew ? 'Create' : 'Save'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────────── */
export default function SimulatorPatterns() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [companies, setCompanies] = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);   // company object | null
  const [addingNew, setAddingNew] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/simulator/patterns'),
      api.get('/admin/subjects'),
    ]).then(([cr, sr]) => {
      setCompanies(cr.data.companies || []);
      setSubjects(sr.data.subjects || []);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDelete = async (company) => {
    const ok = await confirm({
      title: `Delete "${company.name}"?`,
      message: company.attempt_count > 0
        ? `${company.attempt_count} student attempt(s) exist. The pattern will be cleared but student history is preserved.`
        : 'This will permanently remove the company from the simulator.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/simulator/patterns/${company.company_id}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const active   = companies.filter(c => c.has_simulator);
  const inactive = companies.filter(c => !c.has_simulator);

  const statCards = [
    { label: 'Total companies', value: companies.length,           tint: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', icon: Building2 },
    { label: 'Active patterns', value: active.length,               tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle2 },
    { label: 'Inactive',        value: inactive.length,             tint: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10', icon: AlertTriangle },
    { label: 'Total attempts',  value: companies.reduce((s, c) => s + (c.attempt_count || 0), 0), tint: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Target },
  ];

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Simulator</p>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Company patterns</h1>
            <p className="text-white/80 text-sm mt-1.5">Configure which companies students can mock-test.</p>
          </div>
          <button onClick={() => setAddingNew(true)}
            className="inline-flex items-center gap-1.5 bg-white text-violet-700 hover:bg-violet-50 text-[13px] font-bold px-4 py-2 rounded-lg transition-colors">
            <Plus size={13} /> Add company
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(c => (
            <div key={c.label} className={CARD + ' p-5'}>
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
                <c.icon size={16} className={c.tint} strokeWidth={2.25} />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{c.value}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : companies.length === 0 ? (
          <div className={CARD + ' p-10 text-center'}>
            <Building2 size={26} className="text-slate-400 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">No companies yet</p>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">Click "Add company" to set up your first simulator pattern.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map(c => (
              <CompanyCard key={c.company_id} company={c}
                onEdit={() => setEditing(c)}
                onDelete={() => handleDelete(c)} />
            ))}
          </div>
        )}
      </div>

      {(editing || addingNew) && (
        <PatternModal
          company={editing}
          subjects={subjects}
          onClose={() => { setEditing(null); setAddingNew(false); }}
          onSaved={() => { setEditing(null); setAddingNew(false); load(); }}
        />
      )}
      {confirmDialog}
    </div>
  );
}

function CompanyCard({ company, onEdit, onDelete }) {
  const sections = company.pattern?.sections || [];
  const total = sections.reduce((s, sec) => s + (sec.question_count || 0), 0);
  const dur   = sections.reduce((s, sec) => s + (sec.duration_minutes || 0), 0);
  return (
    <div className={CARD + ' p-5 flex flex-col group'}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">{company.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {company.has_simulator
              ? `${sections.length} sections · ${total} Qs · ${dur} min`
              : 'No simulator pattern set'}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
          company.has_simulator
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
        }`}>
          {company.has_simulator ? 'Active' : 'Inactive'}
        </span>
      </div>

      {company.has_simulator && (
        <div className="space-y-1 mb-3">
          {sections.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] py-0.5">
              <span className="text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
              <span className="text-slate-400 dark:text-slate-500 ml-2 flex-shrink-0">
                {s.question_count}Q · {s.duration_minutes}m · cut {s.cutoff_percent}%
              </span>
            </div>
          ))}
        </div>
      )}

      {company.attempt_count > 0 && (
        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mb-3">
          {company.attempt_count} student attempt{company.attempt_count === 1 ? '' : 's'}
        </p>
      )}

      <div className="mt-auto flex gap-2">
        <button onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-bold transition-colors">
          <Edit3 size={12} /> Edit
        </button>
        <button onClick={onDelete}
          className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
