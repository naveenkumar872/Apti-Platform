import { useRef, useState } from 'react';
import {
  Upload, FileDown, X, CheckCircle2, AlertTriangle, Loader2,
  ArrowRight, Trash2, FileSpreadsheet
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Three-step modal:
 *   1. Upload    — pick CSV / XLSX
 *   2. Preview   — server-validated rows with per-row errors; admin can drop bad rows
 *   3. Result    — inserted count + per-row failures
 */
export default function BulkImportModal({ onClose, onComplete }) {
  const [step, setStep] = useState('upload'); // upload | preview | result
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState([]);
  const [summary, setSummary] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const downloadTemplate = () => {
    // Anchor download so the Authorization header from `api` is preserved.
    api.get('/admin/questions/import/template', { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'question-import-template.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Could not download template'));
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!/\.(csv|xlsx?|tsv)$/i.test(f.name)) {
      toast.error('Please upload a CSV or XLSX file');
      return;
    }
    setFile(f);
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/admin/questions/import/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(r.data.preview || []);
      setSummary(r.data.summary || null);
      setStep('preview');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  };

  const dropRow = (rowNumber) => {
    setPreview(prev => prev.filter(p => p.row_number !== rowNumber));
  };

  const handleCommit = async () => {
    const validRows = preview.filter(p => p.valid).map(p => ({ ...p.normalised, row_number: p.row_number }));
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    setCommitting(true);
    try {
      const r = await api.post('/admin/questions/import/commit', { rows: validRows });
      setResult(r.data);
      setStep('result');
      if (r.data.inserted > 0) toast.success(`Imported ${r.data.inserted} question${r.data.inserted === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setCommitting(false);
    }
  };

  const validCount   = preview.filter(p => p.valid).length;
  const invalidCount = preview.filter(p => !p.valid).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <FileSpreadsheet size={17} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Bulk question import</h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Upload a CSV or XLSX of questions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step tabs */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 text-[11.5px]">
            <StepDot active={step === 'upload'} done={step !== 'upload'} label="1. Upload" />
            <span className="text-slate-300 dark:text-slate-600">—</span>
            <StepDot active={step === 'preview'} done={step === 'result'} label="2. Preview" />
            <span className="text-slate-300 dark:text-slate-600">—</span>
            <StepDot active={step === 'result'} done={false} label="3. Result" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <UploadStep
              file={file}
              onPick={handleFile}
              onClear={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
              inputRef={inputRef}
              onTemplate={downloadTemplate}
            />
          )}
          {step === 'preview' && (
            <PreviewStep preview={preview} summary={summary} onDrop={dropRow} validCount={validCount} invalidCount={invalidCount} />
          )}
          {step === 'result' && (
            <ResultStep result={result} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
          {step === 'upload' && (
            <>
              <button onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                Cancel
              </button>
              <button onClick={handleParse} disabled={!file || parsing}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50">
                {parsing ? <><Loader2 size={13} className="animate-spin" /> Parsing</> : <>Parse file <ArrowRight size={13} /></>}
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('upload')}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                Back
              </button>
              <button onClick={handleCommit} disabled={validCount === 0 || committing}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50">
                {committing ? <><Loader2 size={13} className="animate-spin" /> Importing</> : <>Import {validCount} question{validCount === 1 ? '' : 's'} <CheckCircle2 size={13} /></>}
              </button>
            </>
          )}
          {step === 'result' && (
            <div className="ml-auto">
              <button onClick={() => { onComplete?.(); onClose(); }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done, label }) {
  const dot = active
    ? 'bg-violet-600 text-white'
    : done
      ? 'bg-emerald-500 text-white'
      : 'bg-slate-200 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${dot}`}>
        {done ? <CheckCircle2 size={12} /> : label.charAt(0)}
      </span>
      <span className={active ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}>
        {label}
      </span>
    </span>
  );
}

/* ───────────────────── Step 1: Upload ───────────────────── */
function UploadStep({ file, onPick, onClear, inputRef, onTemplate }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] p-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0">
            <FileDown size={15} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">
              Need a starting point?
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              Download the template — it has the headers and 2 sample rows so the format is clear.
            </p>
          </div>
          <button onClick={onTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300 text-[12px] font-semibold hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors flex-shrink-0">
            <FileDown size={12} /> Download template
          </button>
        </div>
      </div>

      <label htmlFor="bulk-import-file"
        className="flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-violet-50/40 dark:hover:bg-violet-500/[0.04] cursor-pointer transition-colors">
        <Upload size={24} className="text-slate-400 dark:text-slate-500" />
        <div className="text-center">
          <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">
            {file ? file.name : 'Click to upload a CSV or XLSX'}
          </p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            {file ? `${Math.round(file.size / 1024)} KB` : 'Max 5 MB · up to 1000 rows'}
          </p>
        </div>
        <input ref={inputRef} id="bulk-import-file" type="file" accept=".csv,.xlsx,.xls,.tsv" className="hidden"
          onChange={e => onPick(e.target.files?.[0])} />
      </label>

      {file && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/[0.06] p-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileSpreadsheet size={15} className="text-violet-500 flex-shrink-0" />
            <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
          </div>
          <button onClick={onClear}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex-shrink-0">
            <Trash2 size={13} />
          </button>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-amber-50/60 dark:bg-amber-500/[0.05] border border-amber-200 dark:border-amber-500/20 p-3.5">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">Tips</p>
        <ul className="space-y-1 text-[12px] text-slate-700 dark:text-slate-300">
          <li>• Subjects and topics must already exist on the platform (Quantitative Aptitude, Logical Reasoning, etc.).</li>
          <li>• Use <code className="bg-slate-100 dark:bg-white/[0.06] px-1 rounded">A / B / C / D</code> for correct_answer.</li>
          <li>• Difficulty is an integer from 1 (easy) to 5 (hard).</li>
          <li>• Concept name is optional — it'll be auto-created under the topic if missing.</li>
        </ul>
      </div>
    </div>
  );
}

/* ───────────────────── Step 2: Preview ───────────────────── */
function PreviewStep({ preview, summary, onDrop, validCount, invalidCount }) {
  if (preview.length === 0) {
    return <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-sm">No rows.</p>;
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
          <CheckCircle2 size={12} /> {validCount} valid
        </span>
        {invalidCount > 0 && (
          <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 inline-flex items-center gap-1.5">
            <AlertTriangle size={12} /> {invalidCount} need fixing
          </span>
        )}
        <span className="text-[11.5px] text-slate-500 dark:text-slate-400 ml-auto">
          {summary?.total || preview.length} rows · only valid rows will be imported
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-[12.5px]">
            <thead className="bg-slate-50 dark:bg-white/[0.03] sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] w-12">Row</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Question</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Subject / Topic</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Ans</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Diff</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {preview.map(p => (
                <tr key={p.row_number} className={p.valid ? '' : 'bg-rose-50/40 dark:bg-rose-500/[0.04]'}>
                  <td className="px-3 py-2 text-slate-400 text-[11px] font-mono">{p.row_number}</td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100 max-w-[300px]">
                    <p className="truncate" title={p.normalised?.question_text || p.raw?.question_text}>
                      {p.normalised?.question_text || p.raw?.question_text || '—'}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-[11.5px]">
                    {p.normalised?.subject_name || '—'}
                    <span className="text-slate-400"> · </span>
                    {p.normalised?.topic_name || '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200 font-mono">
                    {p.normalised?.correct_answer || '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                    {p.normalised?.difficulty ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    {p.valid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={11} /> OK
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        {p.errors.map((e, i) => (
                          <p key={i} className="text-[11px] text-rose-600 dark:text-rose-400 leading-snug">{e}</p>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => onDrop(p.row_number)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      title="Drop this row">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Step 3: Result ───────────────────── */
function ResultStep({ result }) {
  if (!result) return null;
  return (
    <div className="max-w-xl mx-auto text-center py-4">
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
        <CheckCircle2 size={24} className="text-emerald-500" />
      </div>
      <p className="text-[16px] font-semibold text-slate-900 dark:text-white">
        Imported {result.inserted} question{result.inserted === 1 ? '' : 's'}
      </p>
      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
        They are now in your question bank and available for tests, practice, and the diagnostic.
      </p>

      {result.failed_count > 0 && (
        <div className="mt-5 text-left">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} className="text-rose-500" />
            <p className="text-[12.5px] font-semibold text-rose-600 dark:text-rose-400">
              {result.failed_count} row{result.failed_count === 1 ? '' : 's'} could not be imported
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] divide-y divide-slate-200 dark:divide-white/[0.04] max-h-48 overflow-y-auto">
            {result.failed.map((f, i) => (
              <div key={i} className="px-3 py-2 text-[11.5px] flex items-center gap-3">
                <span className="font-mono text-slate-400 flex-shrink-0">Row {f.row_number}</span>
                <span className="text-rose-700 dark:text-rose-400 truncate">{f.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
