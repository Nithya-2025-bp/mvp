import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Columns3,
  Rows3,
  Copy,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [columnsCollapsed, setColumnsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("columns");
  const [columnFilter, setColumnFilter] = useState("all");

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);


  const filteredColumns = data?.columns?.filter((col) => {
    if (columnFilter === "all") return true;
    if (columnFilter === "issues") return col.issues.length > 0;
    return col.recommendation === columnFilter;
  }) ?? [];

  const totalNullCells =
    data?.columns?.reduce((sum, col) => sum + col.quality.nullCount, 0) ?? 0;


  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);


    try {
      const res = await axios.post("http://127.0.0.1:8000/profile", formData);
      setData(res.data);
      setSelectedColumn(res.data.columns?.[0] ?? null);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.detail ||
        err.message ||
        "Upload failed";

      alert(message);
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">      <div className="flex min-h-screen">
      <aside className="w-80 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">          <div className="sticky top-0 h-screen overflow-y-auto p-5">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Database size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Data Profiler
            </h1>
            <p className="text-xs text-slate-500">
              Dataset quality analysis
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center transition hover:border-slate-500 hover:bg-slate-50">
            <FileSpreadsheet className="mb-3 text-slate-500" size={28} />
            <span className="text-sm font-semibold">
              Choose CSV or Excel file
            </span>
            <span className="mt-1 max-w-full truncate text-xs text-slate-500">
              {file ? file.name : "No file selected"}
            </span>

            <input
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Upload size={16} />
            {loading ? "Profiling..." : "Generate Profile"}
          </button>
        </div>

        {data && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniStat
                icon={<Rows3 size={16} />}
                label="Rows"
                value={data.dataset.rowCount}
              />
              <MiniStat
                icon={<Columns3 size={16} />}
                label="Columns"
                value={data.dataset.columnCount}
              />
              <MiniStat
                icon={<Copy size={16} />}
                label="Duplicates"
                value={data.dataset.duplicateRows}
              />
              <MiniStat
                icon={<AlertTriangle size={16} />}
                label="Issues"
                value={data.summary.columnsWithIssues}
              />
            </div>

            <div className="mt-6">
              <button
                onClick={() => setColumnsCollapsed((prev) => !prev)}
                className="mb-3 flex w-full items-center justify-between rounded-xl px-1 py-2 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  {columnsCollapsed ? (
                    <ChevronRight size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}

                  <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Columns
                  </h2>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                  {data.columns.length}
                </span>
              </button>

              {!columnsCollapsed && (
                <div className="space-y-2">
                  {data.columns.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColumn(col)}
                      className={`w-full rounded-xl border p-3 text-left transition ${selectedColumn?.name === col.name
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{col.name}</span>
                        <RecommendationDot value={col.recommendation} />
                      </div>

                      <div
                        className={`mt-1 flex items-center justify-between text-xs ${selectedColumn?.name === col.name
                          ? "text-slate-300"
                          : "text-slate-500"
                          }`}
                      >
                        <span>{col.profileType}</span>
                        <span>{col.quality.nullPercentage}% missing</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {!data && !loading && <EmptyState />}

        {loading && (
          <div className="flex min-h-screen items-center justify-center">
            <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
              <p className="font-semibold">Profiling your dataset...</p>
              <p className="mt-1 text-sm text-slate-500">
                Checking quality, statistics, and patterns.
              </p>
            </div>
          </div>
        )}

        {data && (
          <div className="p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  {data.dataset.fileName}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Profile overview
                </h2>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {darkMode ? "☀️ Light" : "🌙 Dark"}
                </button>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-4 gap-4">
              <OverviewCard
                label="Keep"
                value={data.summary.recommendationCounts.keep}
                tone="green"
                active={columnFilter === "keep"}
                onClick={() => setColumnFilter(columnFilter === "keep" ? "all" : "keep")}
              />

              <OverviewCard
                label="Review"
                value={data.summary.recommendationCounts.review}
                tone="amber"
                active={columnFilter === "review"}
                onClick={() => setColumnFilter(columnFilter === "review" ? "all" : "review")}
              />

              <OverviewCard
                label="Discard"
                value={data.summary.recommendationCounts.discard}
                tone="red"
                active={columnFilter === "discard"}
                onClick={() => setColumnFilter(columnFilter === "discard" ? "all" : "discard")}
              />

              <OverviewCard
                label="Columns with issues"
                value={data.summary.columnsWithIssues}
                tone="slate"
                active={columnFilter === "issues"}
                onClick={() => setColumnFilter(columnFilter === "issues" ? "all" : "issues")}
              />
            </div>

            <div className="mb-6 flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setActiveTab("columns")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "columns"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                Columns
              </button>

              <button
                onClick={() => setActiveTab("sample")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === "sample"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                Sample Data
              </button>
            </div>

            {activeTab === "columns" && (
              <div className="grid grid-cols-[minmax(0,1fr)_600px] gap-6">
                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <h3 className="text-lg font-bold">Column overview</h3>


                    Showing <span className="font-semibold text-slate-900">{filteredColumns.length}</span> of{" "}
                    <span className="font-semibold text-slate-900">{data.columns.length}</span> columns
                    {columnFilter !== "all" && (
                      <button
                        onClick={() => setColumnFilter("all")}
                        className="ml-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Clear filter
                      </button>
                    )}
                    {/* <p className="mt-1 text-sm text-slate-500">
                        Select a column to inspect quality, distribution, and
                        statistics.
                      </p> */}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Null %</th>
                          <th className="px-6 py-3">Unique</th>
                          <th className="px-6 py-3">Recommendation</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredColumns.map((col) => {
                          const active = selectedColumn?.name === col.name;

                          return (
                            <tr
                              key={col.name}
                              onClick={() => setSelectedColumn(col)}
                              className={`cursor-pointer border-b border-slate-100 transition ${active
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-50"
                                }`}
                            >
                              <td className="px-6 py-3 font-semibold">
                                {col.name}
                              </td>
                              <td className="px-6 py-3">
                                <TypePill type={col.profileType} active={active} />
                              </td>
                              <td className="px-6 py-3">
                                {col.quality.nullPercentage}%
                              </td>
                              <td className="px-6 py-3">
                                {col.quality.uniqueCount}
                              </td>
                              <td className="px-6 py-3">
                                <RecommendationBadge
                                  value={col.recommendation}
                                  active={active}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>


                {selectedColumn && (
                  <ColumnInspector column={selectedColumn} />
                )}
              </div>
            )}
            {activeTab === "sample" && (
              <SampleTable data={data.sampleData ?? data.preview ?? []} />
            )}

          </div>
        )}
      </main>
    </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
          <Database size={28} className="text-slate-500  dark:text-slate-400" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight">
          Structure your data
        </h2>
        <p className="mt-4 text-lg leading-8 text-slate-500">
          Upload a CSV or Excel file to profile structure, missing values,
          duplicate patterns, data types, and quality issues.
        </p>
      </div>
    </div>
  );
}


const MISSING_COLORS = ["#10b981", "#ef4444"];

function ColumnInspector({ column }) {
  const stats = column.statistics ?? {};
  const statEntries = Object.entries(stats).filter(
    ([key, value]) =>
      key !== "histogram" &&
      value !== null &&
      value !== undefined
  );
  const topValueChartData = column.topValues.map((item) => ({
    name: item.value,
    count: item.count,
  }));

  const missingChartData = [
    {
      name: "Present",
      value: Math.max(100 - column.quality.nullPercentage, 0),
    },
    {
      name: "Missing",
      value: column.quality.nullPercentage,
    },
  ];

  const histogramData = column.statistics?.histogram ?? [];


  return (
    <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="break-all text-xl font-bold">{column.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {column.profileType} column
            </p>
          </div>
          <RecommendationBadge value={column.recommendation} />
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Null %" value={`${column.quality.nullPercentage}%`} />
          <MetricCard label="Null Count" value={column.quality.nullCount} />
          <MetricCard label="Unique" value={column.quality.uniqueCount} />
          <MetricCard label="Duplicates" value={column.quality.duplicateCount} />
        </div>

        {histogramData.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Numeric histogram
            </h4>

            <div className="h-64 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
            Data completeness
          </h4>

          <div className="flex items-center gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-40 w-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={missingChartData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {missingChartData.map((entry, index) => (
                      <Cell key={index} fill={MISSING_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              {missingChartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: MISSING_COLORS[i] }}
                  />
                  <span className="text-slate-600">{item.name}</span>
                  <span className="ml-auto font-semibold text-slate-900">
                    {item.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {column.issues.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800">
              <AlertTriangle size={16} />
              Issues detected
            </h4>
            <div className="mt-3 space-y-2">
              {column.issues.map((issue) => (
                <div key={issue} className="text-sm text-amber-700">
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}


        {statEntries.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {statEntries.map(([key, value]) => (
                <MetricCard
                  key={key}
                  label={formatLabel(key)}
                  value={String(value)}
                />
              ))}
            </div>
          </div>
        )}



        {column.topValues.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Value distribution
            </h4>

            <div className="h-64 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topValueChartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {column.topValues.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Top values
            </h4>

            <div className="space-y-3">
              {column.topValues.map((item) => {
                const max = column.topValues[0]?.count || 1;
                const width = Math.max((item.count / max) * 100, 4);

                return (
                  <div key={`${item.value}-${item.count}`}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="truncate font-medium">
                        {item.value}
                      </span>
                      <span className="shrink-0 text-slate-500">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 text-slate-400">{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-bold">
        {Number(value).toLocaleString()}
      </p>
    </div>
  );
}

function OverviewCard({ label, value, tone, active = false, onClick }) {
  const toneClasses = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-white text-slate-900",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[tone]
        } ${active ? "ring-2 ring-slate-900" : ""}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </button>
  );
}



function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-all text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}


function TypePill({ type, active = false }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active
        ? "bg-white/15 text-white"
        : "bg-slate-100 text-slate-600"
        }`}
    >
      {type}
    </span>
  );
}

function RecommendationDot({ value }) {
  const classes = {
    keep: "bg-emerald-500",
    review: "bg-amber-500",
    discard: "bg-red-500",
  };

  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${classes[value] ?? "bg-slate-400"
        }`}
    />
  );
}

function RecommendationBadge({ value, active = false }) {
  const config = {
    keep: {
      icon: <CheckCircle size={14} />,
      text: "Keep",
      className: active
        ? "bg-white/15 text-white"
        : "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    review: {
      icon: <AlertTriangle size={14} />,
      text: "Review",
      className: active
        ? "bg-white/15 text-white"
        : "bg-amber-50 text-amber-700 ring-amber-200",
    },
    discard: {
      icon: <XCircle size={14} />,
      text: "Discard",
      className: active
        ? "bg-white/15 text-white"
        : "bg-red-50 text-red-700 ring-red-200",
    },
  };

  const item = config[value] ?? config.review;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${item.className}`}
    >
      {item.icon}
      {item.text}
    </span>
  );
}

function formatLabel(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function SampleTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        No sample data available.
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-bold">Sample data</h3>
        <p className="mt-1 text-sm text-slate-500">
          Showing the first {data.length} rows from the uploaded file.
        </p>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
              {columns.map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="max-w-[220px] truncate whitespace-nowrap px-4 py-3 text-slate-700"
                    title={String(row[col] ?? "")}
                  >
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default App;