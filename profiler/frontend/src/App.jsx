import { useMemo, useState } from "react";
import axios from "axios";
import {
  Upload, Database, AlertTriangle, CheckCircle, XCircle, FileSpreadsheet,
  Columns3, Rows3, Copy, Settings2, BarChart3, Table2, RefreshCw,
  Eye, SlidersHorizontal, Filter, X
} from "lucide-react";

import MatrixView from "./components/MatrixView";
import Charts from "./components/Charts";
import Columns from "./components/Columns";
import Overview from "./components/Overview";
import FileUploadCenter from "./components/FileUploadCentre";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const COLORS = {
  indigo: "#4f46e5",
  cyan: "#0891b2",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
  violet: "#7c3aed",
  slate: "#475569",
  grid: "#dbe3ef",
};

const CHART_COLORS = {
  primary: "#06B6D4",      // Cyan (your area graph color)
  secondary: "#22D3EE",    // Light cyan
  accent: "#0891B2",       // Dark teal
  gradient: "url(#cyanGradient)",
};

const metricOptions = [
  { key: "recommendationScorePercentage", label: "Blank score %", dataKey: "Blank score %" },
  { key: "nullPercentage", label: "True blank %", dataKey: "True blank %" },
  { key: "customBlankPercentage", label: "Custom blank %", dataKey: "Custom blank %" },
  { key: "uniqueCount", label: "Unique values", dataKey: "Unique values" },
  { key: "invalidCount", label: "Invalid count", dataKey: "Invalid count" },
  { key: "issueCount", label: "Issue count", dataKey: "Issue count" },
];



function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [sheets, setSheets] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [chartColumnSearch, setChartColumnSearch] = useState("");
  const [fileId, setFileId] = useState(null);
  const [sheetCache, setSheetCache] = useState({});

  const [rules, setRules] = useState({
    reviewNullAbove: 25,
    discardNullAtLeast: 95,
    includeCustomBlanks: false,
    customBlankValues: "0, -, N/A, Unknown, None, NULL",
  });

  const [columnFilter, setColumnFilter] = useState("all");
  const [tableFilters, setTableFilters] = useState({ type: "all", minBlank: "", minUnique: "", search: "" });
  const [dataMode, setDataMode] = useState("issues");
  const [chartType, setChartType] = useState("bar");
  const [chartMetric, setChartMetric] = useState("recommendationScorePercentage");
  const [selectedChartColumns, setSelectedChartColumns] = useState([]);
  const [showChartPicker, setShowChartPicker] = useState(false);

  const [rowFilters, setRowFilters] = useState([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValues, setFilterValues] = useState([]);
  const [selectedFilterValues, setSelectedFilterValues] = useState([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterApplying, setFilterApplying] = useState(false);
  const [groupBy, setGroupBy] = useState("");
  const [matrixData, setMatrixData] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const handleUpload = async () => {
    console.log("UPLOAD CLICKED", { file, rules });

    if (!file) {
      console.warn("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("review_null_above", String(rules.reviewNullAbove));
    formData.append("discard_null_at_least", String(rules.discardNullAtLeast));
    formData.append("include_custom_blanks", String(rules.includeCustomBlanks));
    formData.append("custom_blank_values", rules.customBlankValues);
    formData.append("row_filters", JSON.stringify(rowFilters));

    setLoading(true);

    try {
      console.log("Sending /profile request...");
      console.time("profile request");

      const res = await axios.post(`${API_BASE_URL}/profile`, formData);

      console.timeEnd("profile request");
      console.log("PROFILE RESPONSE", res.data);

      setData(res.data);
      setSelectedColumn(res.data.columns?.[0] ?? null);

      if (res.data.fileType === "excel") {
        setFileId(res.data.fileId);
        setSheets(res.data.sheets ?? {});
        setSheetNames(res.data.sheetNames ?? []);
        setActiveSheet(res.data.activeSheet ?? null);
        setSheetCache({
          [res.data.activeSheet]: res.data,
        });
      } else {
        setFileId(null);
        setSheets(null);
        setSheetNames([]);
        setActiveSheet(null);
        setSheetCache({});
      }

      setSelectedChartColumns(
        (res.data.columns ?? []).slice(0, 12).map((c) => c.name)
      );

      setMatrixData(null);
      setActiveTab("overview");
    } catch (err) {
      console.error("PROFILE ERROR", err);
      console.error("ERROR RESPONSE", err.response?.data);
      alert(err.response?.data?.detail || err.message || "Upload failed");
    } finally {
      console.log("UPLOAD FINISHED - clearing loading");
      setLoading(false);
    }
  };

  const handleSheetChange = async (sheetName) => {
    console.log("SHEET CHANGE", {
      sheetName,
      fileId,
      cached: Boolean(sheetCache[sheetName]),
    });

    // 1. Use cache first. No fileId needed.
    if (sheetCache[sheetName]) {
      console.log("Using cached sheet", sheetName);

      const cachedSheet = sheetCache[sheetName];

      setData(cachedSheet);
      setActiveSheet(sheetName);
      setSelectedColumn(cachedSheet.columns?.[0] ?? null);
      setSelectedChartColumns(
        (cachedSheet.columns ?? []).slice(0, 12).map((c) => c.name)
      );

      return;
    }

    if (!fileId) {
      console.error("No fileId found", {
        sheetName,
        sheetCacheKeys: Object.keys(sheetCache),
      });
      return;
    }

    const formData = new FormData();
    formData.append("file_id", fileId);
    formData.append("sheet_name", sheetName);
    formData.append("review_null_above", String(rules.reviewNullAbove));
    formData.append("discard_null_at_least", String(rules.discardNullAtLeast));
    formData.append("include_custom_blanks", String(rules.includeCustomBlanks));
    formData.append("custom_blank_values", rules.customBlankValues);
    formData.append("row_filters", JSON.stringify(rowFilters));

    setFilterApplying(true);

    try {
      console.time("profile-sheet request");

      const res = await axios.post(`${API_BASE_URL}/profile-sheet`, formData);

      console.timeEnd("profile-sheet request");
      console.log("PROFILE SHEET RESPONSE", res.data);

      setSheetCache((prev) => ({
        ...prev,
        [sheetName]: res.data,
      }));

      setData(res.data);
      setActiveSheet(sheetName);
      setSelectedColumn(res.data.columns?.[0] ?? null);
      setSelectedChartColumns((res.data.columns ?? []).slice(0, 12).map((c) => c.name));
    } catch (err) {
      console.error("PROFILE SHEET ERROR", err);
      console.error("ERROR RESPONSE", err.response?.data);
      alert(err.response?.data?.detail || err.message || "Sheet profiling failed");
    } finally {
      setFilterApplying(false);
    }
  };

  const loadColumnValues = async (columnName, search = "") => {
    if (!fileId || !activeSheet || !columnName) return;

    const formData = new FormData();
    formData.append("file_id", fileId);
    formData.append("sheet_name", activeSheet);
    formData.append("column_name", columnName);
    formData.append("search", search);
    formData.append("limit", "150");

    const res = await axios.post(`${API_BASE_URL}/column-values`, formData);
    setFilterValues(res.data.values ?? []);
  };

  const openRowFilterModal = () => {
    const firstColumn = columns[0]?.name ?? "";

    setFilterColumn(firstColumn);
    setSelectedFilterValues([]);
    setFilterSearch("");
    setFilterModalOpen(true);

    if (firstColumn) {
      loadColumnValues(firstColumn);
    }
  };

  const reprofileWithFilters = async (filtersToUse) => {
    if (!fileId || !activeSheet) {
      await handleUpload();
      return;
    }

    const formData = new FormData();
    formData.append("file_id", fileId);
    formData.append("sheet_name", activeSheet);
    formData.append("review_null_above", String(rules.reviewNullAbove));
    formData.append("discard_null_at_least", String(rules.discardNullAtLeast));
    formData.append("include_custom_blanks", String(rules.includeCustomBlanks));
    formData.append("custom_blank_values", rules.customBlankValues);
    formData.append("row_filters", JSON.stringify(filtersToUse));

    setFilterApplying(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/profile-sheet`, formData);

      setData(res.data);
      setSelectedColumn(res.data.columns?.[0] ?? null);
      setSelectedChartColumns((res.data.columns ?? []).slice(0, 12).map((c) => c.name));
    } finally {
      setFilterApplying(false);
    }
  };

  const addRowFilter = async () => {
    if (!filterColumn || selectedFilterValues.length === 0) return;

    const nextFilters = [
      ...rowFilters.filter((f) => f.column !== filterColumn),
      {
        column: filterColumn,
        values: selectedFilterValues,
      },
    ];

    setRowFilters(nextFilters);
    setFilterModalOpen(false);
    await reprofileWithFilters(nextFilters);
  };

  const removeRowFilter = async (columnName) => {
    const nextFilters = rowFilters.filter((f) => f.column !== columnName);
    setRowFilters(nextFilters);
    await reprofileWithFilters(nextFilters);
  };

  const getFilterLabel = (filter) => {
    if (!filter?.values?.length) return "No values selected";

    if (filter.values.length <= 3) {
      return filter.values.join(", ");
    }

    return `${filter.values.slice(0, 3).join(", ")} +${filter.values.length - 3} more`;
  };



  const editRowFilter = async (filter) => {
    setFilterColumn(filter.column);
    setSelectedFilterValues(filter.values);
    setFilterSearch("");
    setFilterModalOpen(true);
    await loadColumnValues(filter.column);
  };

  const handleUploadClick = () => {
    if (file) {
      handleUpload();
    }
  };

  const loadMatrix = async (groupColumn = groupBy) => {
    if (!fileId || !activeSheet || !groupColumn) return;

    const formData = new FormData();

    formData.append("file_id", fileId);
    formData.append("sheet_name", activeSheet);
    formData.append("group_by", groupColumn);
    formData.append("review_null_above", String(rules.reviewNullAbove));
    formData.append("discard_null_at_least", String(rules.discardNullAtLeast));
    formData.append("include_custom_blanks", String(rules.includeCustomBlanks));
    formData.append("custom_blank_values", rules.customBlankValues);
    formData.append("row_filters", JSON.stringify(rowFilters));

    setMatrixLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/matrix`, formData);
      setMatrixData(res.data);
    } catch (err) {
      console.error("MATRIX ERROR", err);
      alert(err.response?.data?.detail || err.message || "Matrix failed");
    } finally {
      setMatrixLoading(false);
    }
  };
  const columns = data?.columns ?? [];

  const profileTypes = useMemo(() => ["all", ...new Set(columns.map((c) => c.profileType))], [columns]);

  const filteredColumns = useMemo(() => {
    return columns.filter((col) => {
      const recOk = columnFilter === "all" || (columnFilter === "issues" ? col.issues.length > 0 : col.recommendation === columnFilter);
      const typeOk = tableFilters.type === "all" || col.profileType === tableFilters.type;
      const blankOk = tableFilters.minBlank === "" || col.quality.recommendationScorePercentage >= Number(tableFilters.minBlank);
      const uniqueOk = tableFilters.minUnique === "" || col.quality.uniqueCount >= Number(tableFilters.minUnique);
      const searchOk = tableFilters.search.trim() === "" || col.name.toLowerCase().includes(tableFilters.search.toLowerCase());
      return recOk && typeOk && blankOk && uniqueOk && searchOk;
    });
  }, [columns, columnFilter, tableFilters]);

  const chartData = useMemo(() => {
    const selected = selectedChartColumns.length ? selectedChartColumns : columns.slice(0, 12).map((c) => c.name);
    return columns
      .filter((col) => selected.includes(col.name))
      .map((col) => ({
        name: col.name,
        "Blank score %": col.quality.recommendationScorePercentage,
        "True blank %": col.quality.nullPercentage,
        "Custom blank %": col.quality.customBlankPercentage,
        "Unique values": col.quality.uniqueCount,
        "Invalid count": col.quality.invalidCount,
        "Issue count": col.issues.length,
      }));
  }, [columns, selectedChartColumns]);

  const chartDataKey = metricOptions.find((m) => m.key === chartMetric)?.dataKey ?? "Blank score %";
  return (
    <div className="min-h-screen bg-slate-100 text-slate-200">
      {!data && !loading ? (
        // Show file upload center when no data
        <FileUploadCenter
          onFileSelect={setFile}
          onUpload={handleUploadClick}
        />
      ) : (
        // Show the main app when data exists or loading
        <>
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-gradient-to-r from-blue-50/80 via-white/80 to-teal-50/80 backdrop-blur-md px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-md">
                  <Database size={18} />
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-slate-800">Data Profiler</h1>
                  <p className="text-[11px] font-medium text-slate-400">Fast data quality review for CSV and Excel files</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
                  <FileSpreadsheet size={14} className="text-blue-500" />
                  <span className="max-w-[240px] truncate text-sm">{file ? file.name : "Choose file"}</span>
                  <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                  {data ? "Re-profile" : "Generate"}
                </button>
              </div>
            </div>
          </header>

          {loading && <LoadingState />}

          {data && !loading && (
            <div className="flex min-h-[calc(100vh-65px)]">
              <aside className="w-[380px] shrink-0 border-r border-slate-200 bg-white p-4">
                <div className="sticky top-[80px] space-y-4">
                  <Panel title="Data source" icon={<FileSpreadsheet size={16} />}>
                    <div className="space-y-3">
                      {/* File name */}
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {data.dataset.fileName}
                        </span>
                      </div>

                      {/* Row and column stats with icons */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50">
                            <Rows3 size={14} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Total rows</p>
                            <p className="text-sm font-bold text-slate-800">{data.dataset.rowCount.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                            <Columns3 size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Total columns</p>
                            <p className="text-sm font-bold text-slate-800">{data.dataset.columnCount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sheet selector - only for multi-sheet Excel files */}
                      {sheetNames.length > 1 && (
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <span className="text-sm">📄</span> Sheet
                          </label>
                          <select
                            value={activeSheet ?? ""}
                            onChange={(e) => handleSheetChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                          >
                            {sheetNames.map((s) => {
                              // Clean display name: remove the filename prefix if it exists
                              let displayName = s;
                              const fileNameWithoutExt = data.dataset.fileName.replace(/\.(xlsx|xls|csv)$/i, '');

                              if (displayName.startsWith(fileNameWithoutExt + " - ")) {
                                displayName = displayName.replace(fileNameWithoutExt + " - ", "");
                              } else if (displayName.startsWith(data.dataset.fileName.replace(/\.(xlsx|xls)$/i, '') + " - ")) {
                                displayName = displayName.replace(data.dataset.fileName.replace(/\.(xlsx|xls)$/i, '') + " - ", "");
                              }

                              return <option key={s} value={s}>{displayName}</option>;
                            })}
                          </select>
                          <p className="text-xs text-slate-400">
                            {sheetNames.length} sheets in this workbook
                          </p>
                        </div>
                      )}
                    </div>
                  </Panel>

                  <Panel title="Recommendation criteria" icon={<Settings2 size={16} />}>
                    <div className="space-y-4">
                      {/* Review threshold */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Review if blank score is above
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={rules.reviewNullAbove}
                            onChange={(e) => setRules((p) => ({ ...p, reviewNullAbove: Number(e.target.value) }))}
                            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>

                      {/* Discard threshold */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Discard if blank score is at least
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={rules.discardNullAtLeast}
                            onChange={(e) => setRules((p) => ({ ...p, discardNullAtLeast: Number(e.target.value) }))}
                            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </div>

                      {/* Custom blank values */}
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Treat these values as blank
                        </label>
                        <input
                          value={rules.customBlankValues}
                          onChange={(e) => setRules((p) => ({ ...p, customBlankValues: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                          placeholder="e.g., 0, -, N/A, Unknown"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                          Comma-separated values
                        </p>
                      </div>

                      {/* Checkbox */}
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={rules.includeCustomBlanks}
                          onChange={(e) => setRules((p) => ({ ...p, includeCustomBlanks: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-200"
                        />
                        <span className="text-xs text-slate-600 leading-relaxed">
                          Include custom blank values in recommendation score
                        </span>
                      </label>

                      {/* Button */}
                      <button
                        onClick={handleUpload}
                        className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        Apply and re-profile
                      </button>
                    </div>
                  </Panel>

                  <Panel title="Row filters" icon={<Filter size={16} />}>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={openRowFilterModal}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
                      >
                        <span className="text-lg leading-none">+</span>
                        Add row filter
                      </button>

                      <div className="space-y-2">
                        {rowFilters.length === 0 && (
                          <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-4 text-center">
                            <p className="text-xs text-slate-400">
                              No row filters applied
                            </p>
                          </div>
                        )}

                        {rowFilters.map((f) => (
                          <button
                            key={f.column}
                            type="button"
                            onClick={() => editRowFilter(f)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800">
                                  {f.column}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                  {getFilterLabel(f)}
                                </p>
                              </div>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRowFilter(f.column);
                                }}
                                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                              >
                                Remove
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Grouping" icon={<SlidersHorizontal size={16} />}>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-500">
                          Group By
                        </label>
                        <select
                          value={groupBy}
                          onChange={(e) => {
                            const value = e.target.value;
                            setGroupBy(value);
                            setMatrixData(null);
                            if (value) {
                              loadMatrix(value);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                        >
                          <option value="">-- None --</option>
                          {columns.map((col) => (
                            <option key={col.name} value={col.name}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-lg bg-blue-50/50 px-3 py-2">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Matrix compares blank % for each field across the selected group.
                        </p>
                      </div>
                    </div>
                  </Panel>
                </div>
              </aside>

              <main className="min-w-0 flex-1 p-5">
                <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-8">
                  <Stat icon={<Rows3 size={16} />} label="Rows" value={data.dataset.rowCount} />
                  <Stat icon={<Columns3 size={16} />} label="Columns" value={data.dataset.columnCount} />
                  <Stat icon={<Copy size={16} />} label="Duplicates" value={data.dataset.duplicateRows} />
                  <Stat icon={<AlertTriangle size={16} />} label="Blank cells" value={data.summary.totalBlankCells} tone="red" />
                  <Stat
                    label="Keep"
                    value={data.summary.recommendationCounts.keep}
                    tone="green"
                    active={columnFilter === "keep"}
                    onClick={() => {
                      setColumnFilter(columnFilter === "keep" ? "all" : "keep");
                      setActiveTab("columns");
                    }}
                  />
                  <Stat
                    label="Review"
                    value={data.summary.recommendationCounts.review}
                    tone="amber"
                    active={columnFilter === "review"}
                    onClick={() => {
                      setColumnFilter(columnFilter === "review" ? "all" : "review");
                      setActiveTab("columns");
                    }}
                  />
                  <Stat
                    label="Discard"
                    value={data.summary.recommendationCounts.discard}
                    tone="red"
                    active={columnFilter === "discard"}
                    onClick={() => {
                      setColumnFilter(columnFilter === "discard" ? "all" : "discard");
                      setActiveTab("columns");
                    }}
                  />
                  <Stat
                    label="Issues"
                    value={data.summary.columnsWithIssues}
                    tone="blue"
                    active={columnFilter === "issues"}
                    onClick={() => {
                      setColumnFilter(columnFilter === "issues" ? "all" : "issues");
                      setActiveTab("columns");
                    }}
                  />
                </div>

                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <Tab
                      active={activeTab === "overview"}
                      onClick={() => setActiveTab("overview")}
                      icon={<Eye size={14} />}
                      label="Overview"
                    />
                    <Tab
                      active={activeTab === "columns"}
                      onClick={() => setActiveTab("columns")}
                      icon={<Table2 size={14} />}
                      label="Columns"
                    />
                    <Tab
                      active={activeTab === "charts"}
                      onClick={() => setActiveTab("charts")}
                      icon={<BarChart3 size={14} />}
                      label="Charts"
                    />
                    <Tab
                      label="Matrix"
                      active={activeTab === "matrix"}
                      onClick={() => {
                        setActiveTab("matrix");
                        if (groupBy && !matrixData) {
                          loadMatrix(groupBy);
                        }
                      }}
                    />
                  </div>
                </div>

                {activeTab === "overview" && (
                  <Overview
                    data={data}
                    columns={columns}
                    setActiveTab={setActiveTab}
                    setSelectedColumn={setSelectedColumn}
                  />
                )}
                {activeTab === "columns" && (
                  <Columns
                    columns={columns}
                    filteredColumns={filteredColumns}
                    selectedColumn={selectedColumn}
                    setSelectedColumn={setSelectedColumn}
                    tableFilters={tableFilters}
                    setTableFilters={setTableFilters}
                    profileTypes={profileTypes}
                  />
                )}
                {activeTab === "charts" && (
                  <Charts
                    columns={columns}
                    chartData={chartData}
                    chartDataKey={chartDataKey}
                    chartType={chartType}
                    setChartType={setChartType}
                    chartMetric={chartMetric}
                    setChartMetric={setChartMetric}
                    selectedChartColumns={selectedChartColumns}
                    setSelectedChartColumns={setSelectedChartColumns}
                    showChartPicker={showChartPicker}
                    setShowChartPicker={setShowChartPicker}
                    chartColumnSearch={chartColumnSearch}
                    setChartColumnSearch={setChartColumnSearch}
                  />
                )}
                {activeTab === "matrix" && (
                  <MatrixView
                    matrixData={matrixData}
                    matrixLoading={matrixLoading}
                    groupBy={groupBy}
                    loadMatrix={loadMatrix}
                  />
                )}
              </main>
            </div>
          )}

          {/* Filter Modal */}
          {filterModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-800">Add row filter</h2>
                  <button
                    type="button"
                    onClick={() => setFilterModalOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Column selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Column
                    </label>
                    <select
                      value={filterColumn}
                      onChange={(e) => {
                        setFilterColumn(e.target.value);
                        setSelectedFilterValues([]);
                        loadColumnValues(e.target.value, filterSearch);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                    >
                      {columns.map((col) => (
                        <option key={col.name} value={col.name}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search input */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                      Search values
                    </label>
                    <div className="relative">
                      <input
                        value={filterSearch}
                        onChange={(e) => {
                          setFilterSearch(e.target.value);
                          loadColumnValues(filterColumn, e.target.value);
                        }}
                        placeholder="Type to search..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                      />
                      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFilterValues(filterValues.map((x) => x.value))}
                      className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFilterValues([])}
                      className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      Clear all
                    </button>
                    <span className="flex-1" />
                    <span className="text-xs text-slate-400">
                      {selectedFilterValues.length} selected
                    </span>
                  </div>

                  {/* Values list */}
                  <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
                    {filterValues.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-400">
                        No values found
                      </div>
                    ) : (
                      filterValues.map((item) => {
                        const checked = selectedFilterValues.includes(item.value);
                        return (
                          <label
                            key={item.value}
                            className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition ${checked ? "bg-blue-50" : "hover:bg-slate-50"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedFilterValues((prev) =>
                                  prev.includes(item.value)
                                    ? prev.filter((x) => x !== item.value)
                                    : [...prev, item.value]
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-1 focus:ring-blue-200"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                              {item.value === "" || item.value === null ? "(blank)" : item.value}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                              {item.count.toLocaleString()}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setFilterModalOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addRowFilter}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    Add filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

}

function LoadingState() { return <div className="flex min-h-[80vh] items-center justify-center"><div className="rounded-[2rem] border border-slate-200 bg-white px-10 py-8 text-center shadow-sm"><div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /><p className="text-lg font-black">Profiling your dataset...</p><p className="mt-2 text-sm text-slate-500">Checking structure, blanks, issues, and recommendations.</p></div></div>; }
function Panel({ title, icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="text-blue-600">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}
function Stat({ icon, label, value, tone = "slate", active = false, onClick }) {
  const colors = {
    slate: "text-slate-600",
    red: "text-red-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
  };

  const isClickable = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`rounded-xl border p-3 text-left transition-all ${active
        ? "border-blue-400 bg-blue-50"
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${colors[tone]}`}>
        {Number(value).toLocaleString()}
      </p>
    </button>
  );
}

function Tab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${active
        ? "border-blue-300 bg-blue-50 text-blue-600"
        : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
function RecommendationBadge({ value }) { const config = { keep: [<CheckCircle size={13} />, "Keep", "bg-emerald-50 text-emerald-700 ring-emerald-200"], review: [<AlertTriangle size={13} />, "Review", "bg-amber-50 text-amber-700 ring-amber-200"], discard: [<XCircle size={13} />, "Discard", "bg-red-50 text-red-700 ring-red-200"] }; const item = config[value] ?? config.review; return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${item[2]}`}>{item[0]}{item[1]}</span>; }
export default App;
