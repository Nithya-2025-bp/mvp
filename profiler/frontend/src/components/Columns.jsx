// components/Columns.jsx
import { useState } from "react";
import {
  AlertTriangle, CheckCircle, XCircle, X, BarChart3
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";

// Reusable components needed for Columns
function RecommendationBadge({ value }) {
  const config = {
    keep: [<CheckCircle size={13} />, "Keep", "bg-emerald-50 text-emerald-700 ring-emerald-200"],
    review: [<AlertTriangle size={13} />, "Review", "bg-amber-50 text-amber-700 ring-amber-200"],
    discard: [<XCircle size={13} />, "Discard", "bg-red-50 text-red-700 ring-red-200"]
  };
  const item = config[value] ?? config.review;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${item[2]}`}>
      {item[0]}{item[1]}
    </span>
  );
}

function MetricCompact({ label, value, tone = "default" }) {
  const textColor = {
    default: "text-slate-800",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-rose-600",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-base font-bold ${textColor}`}>{value}</p>
    </div>
  );
}

function formatLabel(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function ColumnInspector({ column }) {
  const [showCharts, setShowCharts] = useState(false);

  const stats = column.statistics ?? {};
  const statEntries = Object.entries(stats).filter(
    ([k, v]) => k !== "histogram" && v !== null && v !== undefined
  );

  const histogram = column.statistics?.histogram ?? [];
  const topValues = column.topValues?.map((x) => ({ name: x.value, count: x.count })) ?? [];
  const hasCharts = histogram.length > 0 || topValues.length > 0;

  return (
    <>
      {/* Sidebar Inspector - Compact */}
      <aside className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-800 truncate">
                {column.name}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {column.profileType}
                </span>
              </div>
            </div>
            <RecommendationBadge value={column.recommendation} />
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Key Metrics */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Quality metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCompact
                label="Blank score"
                value={`${column.quality.recommendationScorePercentage}%`}
                tone={column.quality.recommendationScorePercentage >= 80 ? "red" : column.quality.recommendationScorePercentage >= 50 ? "amber" : "green"}
              />
              <MetricCompact label="True blanks" value={column.quality.nullCount.toLocaleString()} />
              <MetricCompact label="Custom blanks" value={column.quality.customBlankCount.toLocaleString()} />
              <MetricCompact label="Unique values" value={column.quality.uniqueCount.toLocaleString()} />
            </div>
          </div>

          {/* Issues */}
          {column.issues.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Issues detected
              </h3>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
                {column.issues.map((i) => (
                  <p key={i} className="text-sm text-amber-700 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    {i}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {statEntries.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {statEntries.map(([k, v]) => (
                  <MetricCompact key={k} label={formatLabel(k)} value={String(v)} />
                ))}
              </div>
            </div>
          )}

          {/* View Charts Button */}
          {hasCharts && (
            <button
              onClick={() => setShowCharts(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <BarChart3 size={14} />
              View visualizations
            </button>
          )}
        </div>
      </aside>

      {/* Modal for Charts */}
      {showCharts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{column.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {column.profileType}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{column.quality.uniqueCount.toLocaleString()} unique values</span>
                </div>
              </div>
              <button
                onClick={() => setShowCharts(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Charts */}
            <div className="max-h-[65vh] overflow-auto p-6 space-y-8">
              {histogram.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">Numeric histogram</h3>
                    <span className="text-xs text-slate-400">{histogram.length} bins</span>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={histogram} margin={{ top: 10, right: 30, left: 40, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis
                          dataKey="range"
                          tick={{ fontSize: 11, fill: "#64748B" }}
                          angle={-25}
                          textAnchor="end"
                          height={60}
                          axisLine={{ stroke: "#CBD5E1" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748B" }}
                          axisLine={{ stroke: "#CBD5E1" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white' }}
                          cursor={{ fill: '#F1F5F9' }}
                        />
                        <Bar dataKey="count" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {topValues.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">Top values</h3>
                    <span className="text-xs text-slate-400">showing top {Math.min(topValues.length, 20)}</span>
                  </div>
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topValues.slice(0, 20)}
                        layout="vertical"
                        margin={{ top: 10, right: 30, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: "#64748B" }}
                          axisLine={{ stroke: "#CBD5E1" }}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#475569" }}
                          width={110}
                          axisLine={{ stroke: "#CBD5E1" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white' }}
                          cursor={{ fill: '#F1F5F9' }}
                        />
                        <Bar dataKey="count" fill="#0284C7" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Columns({ 
  columns, 
  filteredColumns, 
  selectedColumn, 
  setSelectedColumn, 
  tableFilters, 
  setTableFilters, 
  profileTypes 
}) {
  return (
    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* Column overview table */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Column overview</h2>
              <p className="mt-0.5 text-sm text-slate-400">
                Showing {filteredColumns.length} of {columns.length} columns
              </p>
            </div>
            <button
              onClick={() => setTableFilters({ type: "all", minBlank: "", minUnique: "", search: "" })}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
            >
              <X size={13} />
              Clear filters
            </button>
          </div>

          {/* Filters row */}
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
            <div className="relative">
              <input
                value={tableFilters.search}
                onChange={(e) => setTableFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Search column"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
              />
            </div>
            <select
              value={tableFilters.type}
              onChange={(e) => setTableFilters((p) => ({ ...p, type: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
            >
              {profileTypes.map((t) => (
                <option key={t} value={t}>{t === "all" ? "All types" : t}</option>
              ))}
            </select>
            <input
              type="number"
              value={tableFilters.minBlank}
              onChange={(e) => setTableFilters((p) => ({ ...p, minBlank: e.target.value }))}
              placeholder="Min blank %"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
            />
            <input
              type="number"
              value={tableFilters.minUnique}
              onChange={(e) => setTableFilters((p) => ({ ...p, minUnique: e.target.value }))}
              placeholder="Min unique"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Blank score</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">True blanks</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Custom blanks</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Unique</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {filteredColumns.map((col) => (
                <tr
                  key={col.name}
                  onClick={() => setSelectedColumn(col)}
                  className={`cursor-pointer border-b border-slate-100 transition-colors ${
                    selectedColumn?.name === col.name
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{col.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {col.profileType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      col.quality.recommendationScorePercentage >= 80 ? "text-rose-600" :
                      col.quality.recommendationScorePercentage >= 50 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {col.quality.recommendationScorePercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{col.quality.nullCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{col.quality.customBlankCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{col.quality.uniqueCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <RecommendationBadge value={col.recommendation} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Column inspector */}
      {selectedColumn && <ColumnInspector column={selectedColumn} />}
    </div>
  );
}