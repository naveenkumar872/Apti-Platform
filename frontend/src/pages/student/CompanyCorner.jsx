import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Building2, Search, Download, Loader2, ChevronDown, ChevronUp, FileText, Zap, Star, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";

const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2014 }, (_, i) => CURRENT_YEAR - 1 - i);

function TopicSection({ label, icon: Icon, iconColor, bgColor, borderColor, badgeColor, items, activeTopic, onTopicClick }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon size={15} className={iconColor} />
        <span className={`text-xs font-bold uppercase tracking-wider ${iconColor}`}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(t => (
          <button
            key={t}
            onClick={() => onTopicClick(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              activeTopic === t
                ? `${bgColor} ${borderColor} ${badgeColor} shadow-sm`
                : `bg-white ${borderColor} text-gray-700 hover:${bgColor}`
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badgeColor.replace('text-', 'bg-')}`} />
            {t}
            <ChevronRight size={12} className="opacity-40" />
          </button>
        ))}
      </div>
    </div>
  );
}

function parseTopics(raw) {
  if (!raw) return { mostImportant: [], important: [], needToSee: [] };
  let data = raw;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return { mostImportant: [], important: [], needToSee: [] }; } }
  // Structured object from API
  if (data && typeof data === 'object' && !Array.isArray(data) && data.mostImportant) {
    return {
      mostImportant: data.mostImportant || [],
      important: data.important || [],
      needToSee: data.needToSee || [],
    };
  }
  // Fallback: flat array -- split by position
  if (Array.isArray(data)) {
    const total = data.length;
    const a = Math.min(5, Math.max(3, Math.ceil(total * 0.2)));
    const b = Math.min(8, Math.max(5, Math.ceil(total * 0.4)));
    return { mostImportant: data.slice(0, a), important: data.slice(a, a + b), needToSee: data.slice(a + b, a + b + 8) };
  }
  return { mostImportant: [], important: [], needToSee: [] };
}

export default function CompanyCorner() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [fromYear, setFromYear] = useState(CURRENT_YEAR - 3);
  const [toYear, setToYear] = useState(CURRENT_YEAR - 1);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [expandedYears, setExpandedYears] = useState({});

  const [activeTopic, setActiveTopic] = useState(null);
  const [topicQs, setTopicQs] = useState([]);
  const [topicLoading, setTopicLoading] = useState(false);

  useEffect(() => {
    api.get('/student/companies')
      .then(r => setCompanies(r.data.companies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const loadCompany = async (id) => {
    setGeneratedData(null);
    setExpandedYears({});
    setActiveTopic(null);
    setTopicQs([]);
    try {
      const res = await api.get(`/student/companies/${id}`);
      setSelected({ ...res.data.company, past_papers: res.data.past_papers || [] });
    } catch { /* noop */ }
  };

  const handleTopicClick = async (topic) => {
    if (activeTopic === topic) { setActiveTopic(null); setTopicQs([]); return; }
    setActiveTopic(topic);
    setTopicQs([]);
    setTopicLoading(true);
    try {
      const res = await api.post(`/student/companies/${selected.company_id}/topic-questions`, { topic });
      setTopicQs(res.data.questions || []);
    } catch { setTopicQs([]); }
    setTopicLoading(false);
  };

  const handleGenerate = async () => {
    if (!selected || fromYear > toYear) return;
    const years = [];
    for (let y = fromYear; y <= toYear; y++) years.push(y);
    setGenerating(true);
    setGeneratedData(null);
    const result = {};
    for (const year of years) {
      setGenProgress(`Generating ${year}... (${years.indexOf(year) + 1}/${years.length})`);
      try {
        const res = await api.post(`/student/companies/${selected.company_id}/generate-questions`, { year });
        result[year] = res.data.questions || [];
      } catch { result[year] = []; }
    }
    setGeneratedData(result);
    setExpandedYears({ [years[0]]: true });
    setGenerating(false);
    setGenProgress('');
  };

  const toggleYear = (year) => setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));

  const downloadPDF = () => {
    if (!generatedData) return;
    const years = Object.keys(generatedData).sort();
    let questionsHtml = '';
    years.forEach(year => {
      const qs = generatedData[year];
      questionsHtml += `<div class="year-section"><h2>${selected.name} -- ${year} Placement Questions</h2>`;
      qs.forEach((q, i) => {
        questionsHtml += `<div class="question"><p class="qnum">Q${i + 1}. ${q.question_text}</p><ul>${(q.options || []).map(o => `<li class="${o.id === q.correct_answer ? 'correct' : ''}">${o.id}. ${o.text}</li>`).join('')}</ul><p class="answer">Answer: <strong>${q.correct_answer}</strong></p><p class="explanation">Explanation: ${q.explanation || ''}</p></div>`;
      });
      questionsHtml += `</div>`;
    });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${selected.name} Previous Year Questions</title><style>body{font-family:Arial,sans-serif;margin:30px;color:#111}.year-section{page-break-before:always;margin-bottom:40px}.year-section:first-child{page-break-before:avoid}h2{color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:6px}.question{margin:20px 0;padding:12px;border:1px solid #e5e7eb;border-radius:6px}.qnum{font-weight:bold;margin-bottom:6px}ul{list-style:none;padding-left:10px;margin:6px 0}li{padding:3px 0}li.correct{color:#16a34a;font-weight:bold}.answer{margin-top:8px;color:#16a34a}.explanation{color:#6b7280;font-size:.9em;margin-top:4px}@media print{body{margin:15px}}</style></head><body><h1>${selected.name} -- Previous Year Questions (${fromYear}-${toYear})</h1><p>Generated: ${new Date().toLocaleDateString()} | 25 questions per year</p>${questionsHtml}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const win = window.open(URL.createObjectURL(blob), '_blank');
    if (win) win.onload = () => setTimeout(() => win.print(), 300);
  };

  const yearsInRange = toYear - fromYear + 1;
  const topics = selected ? parseTopics(selected.important_topics) : null;

  const partnerCompaniesCount = companies.length;
  const interviewGuidesCount = companies.length;
  const prepTipsCount = companies.filter(c => c.interview_tips).length || (companies.length * 3);
  const cutoffsCount = companies.length > 0 ? "100% Verified" : "0 Verified";

  const STAT_CARDS = [
    { label: "Partner Companies", value: partnerCompaniesCount, icon: Building2, grad: "from-blue-500 to-indigo-650" },
    { label: "Interview Guides", value: `${interviewGuidesCount} Guides`, icon: FileText, grad: "from-emerald-500 to-teal-600" },
    { label: "Prep Tips", value: `${prepTipsCount} Tips`, icon: Zap, grad: "from-violet-500 to-purple-600" },
    { label: "Cutoffs Info", value: cutoffsCount, icon: BookOpen, grad: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Placement Prep</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Company Corner</h1>
            <p className="text-white/70 text-sm mt-1.5">Previous year papers &amp; topic-wise questions</p>
          </div>
          {selected ? (
            <button onClick={() => setSelected(null)}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div className="hidden sm:flex gap-3 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[72px]">
                <p className="text-xl font-black text-white">{companies.length}</p>
                <p className="text-white/60 text-xs mt-0.5">Companies</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">

      {!selected ? (
        <>
          {/* Stat cards */}
          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {STAT_CARDS.map(({ label, value, icon: Icon, grad }) => (
                <div key={label} className={"shadow-sm p-5 " + C}>
                  <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 " + grad}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search company..."
              value={search}
              onChange={e => { setSearch(e.target.value); }}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>

          {/* Company Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />)}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No companies found</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {filteredCompanies.map(c => (
                <button
                  key={c.company_id}
                  onClick={() => loadCompany(c.company_id)}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-7 h-7 object-contain" /> : <Building2 size={18} className="text-gray-400" />}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm text-left leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors shadow-sm w-fit mb-2"
          >
            <ArrowLeft size={14} className="text-gray-400" />
            Back to Companies
          </button>
          {/* Two-column: Topics LEFT | Generator RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* LEFT -- Topics */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-gray-500" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{selected.name}</h2>
                  <p className="text-xs text-gray-400">Click any topic to see sample questions</p>
                </div>
              </div>

              <TopicSection
                label="Most Important"
                icon={Zap}
                iconColor="text-red-500"
                bgColor="bg-red-50"
                borderColor="border-red-200"
                badgeColor="text-red-600"
                items={topics.mostImportant}
                activeTopic={activeTopic}
                onTopicClick={handleTopicClick}
              />
              <TopicSection
                label="Important"
                icon={Star}
                iconColor="text-amber-500"
                bgColor="bg-amber-50"
                borderColor="border-amber-200"
                badgeColor="text-amber-700"
                items={topics.important}
                activeTopic={activeTopic}
                onTopicClick={handleTopicClick}
              />
              <TopicSection
                label="Need to See"
                icon={BookOpen}
                iconColor="text-blue-500"
                bgColor="bg-blue-50"
                borderColor="border-blue-200"
                badgeColor="text-blue-600"
                items={topics.needToSee}
                activeTopic={activeTopic}
                onTopicClick={handleTopicClick}
              />
              {selected.interview_tips && (
                <p className="mt-2 text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                   {selected.interview_tips}
                </p>
              )}
            </div>

            {/* RIGHT -- Year Question Generator */}
            <div className="lg:col-span-3 bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-sm">
                <FileText size={16} className="text-indigo-500" />
                Generate Previous Year Questions
              </h3>
              <p className="text-xs text-gray-400 mb-4">25 questions per year x AI-based {selected.name} placement style</p>

              <div className="flex flex-wrap items-end gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From Year</label>
                  <select value={fromYear} onChange={e => { setFromYear(Number(e.target.value)); setGeneratedData(null); }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To Year</label>
                  <select value={toYear} onChange={e => { setToYear(Number(e.target.value)); setGeneratedData(null); }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {YEAR_OPTIONS.filter(y => y >= fromYear).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="text-xs text-gray-400 pb-2">
                  {yearsInRange} yr x 25 = <strong className="text-gray-700">{yearsInRange * 25} questions</strong>
                </div>
              </div>

              {yearsInRange > 5 && <p className="text-xs text-amber-600 mb-3">! Large range -- may take a minute</p>}

              <div className="flex gap-3 mb-4">
                <button onClick={handleGenerate} disabled={generating || fromYear > toYear}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  {generating ? genProgress : 'Generate Questions'}
                </button>
                {generatedData && (
                  <button onClick={downloadPDF}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    <Download size={14} /> Download PDF
                  </button>
                )}
              </div>

              {/* Generated Year Questions inline on the right */}
              {generatedData && (
                <div className="space-y-2 flex-1 overflow-auto">
                  {Object.keys(generatedData).sort().map(year => {
                    const qs = generatedData[year];
                    const isOpen = !!expandedYears[year];
                    return (
                      <div key={year} className="rounded-lg border border-gray-100 overflow-hidden">
                        <button onClick={() => toggleYear(year)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 text-sm">{selected.name} -- {year}</span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{qs.length} Qs</span>
                          </div>
                          {isOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-3 pt-3">
                            {qs.map((q, i) => (
                              <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <p className="text-sm font-medium text-gray-800 mb-1.5">
                                  <span className="text-indigo-600 font-bold mr-1.5">Q{i + 1}.</span>{q.question_text}
                                  {q.topic_name && <span className="ml-2 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">{q.topic_name}</span>}
                                </p>
                                <div className="grid grid-cols-2 gap-1 mb-1.5">
                                  {(q.options || []).map(opt => (
                                    <div key={opt.id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
                                      opt.id === q.correct_answer ? 'bg-green-50 border-green-300 text-green-800 font-medium' : 'bg-gray-50 border-gray-100 text-gray-600'
                                    }`}>
                                      <span className="font-bold w-3 shrink-0">{opt.id}</span>
                                      <span>{opt.text}</span>
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <p className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1">
                                    <strong>Exp:</strong> {q.explanation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Topic Questions Panel -- full width below */}
          {activeTopic && (
            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-indigo-50 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-indigo-700">Sample Questions -- {activeTopic}</span>
                  <span className="text-xs text-indigo-400">({selected.name})</span>
                </div>
                <button onClick={() => { setActiveTopic(null); setTopicQs([]); }} className="text-indigo-400 hover:text-indigo-600 text-xs font-medium">x Close</button>
              </div>
              {topicLoading ? (
                <div className="flex items-center gap-3 px-5 py-6 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                  Generating questions on "{activeTopic}"...
                </div>
              ) : topicQs.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">No questions generated.</p>
              ) : (
                <div className="px-5 pb-5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {topicQs.map((q, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-800 mb-2">
                        <span className="text-indigo-600 font-bold mr-2">Q{i + 1}.</span>{q.question_text}
                      </p>
                      <div className="space-y-1 mb-2">
                        {(q.options || []).map(opt => (
                          <div key={opt.id} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm border ${
                            opt.id === q.correct_answer ? 'bg-green-50 border-green-300 text-green-800 font-medium' : 'bg-gray-50 border-gray-100 text-gray-700'
                          }`}>
                            <span className="font-bold text-xs w-4 shrink-0">{opt.id}</span>
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
