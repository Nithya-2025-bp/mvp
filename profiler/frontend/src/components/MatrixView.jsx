// MatrixView.jsx - Soft green/yellow/red palette

import { Layers, Info } from "lucide-react";

const MATRIX_THEME = {
    // Soft, approachable scale from green → yellow → red
    scale: [
        "#E8F5E9",  // 0%   - very soft green
        "#C8E6C9",  // 25%  - light green
        "#FFF9C4",  // 50%  - faint yellow
        "#FFECB3",  // 65%  - warm yellow
        "#FFE0B2",  // 75%  - light orange
        "#FFCDD2",  // 100% - soft red
    ],
    recommendation: {
        keep: "#2E7D32",   // deep green - clear and readable
        review: "#E65100",  // deep orange - stands out but not harsh
        discard: "#C62828", // deep red - clearly negative but not aggressive
    },
};

function interpolateColor(color1, color2, factor) {
    const hex = (color) => {
        const cleaned = color.replace("#", "");
        return [
            parseInt(cleaned.substring(0, 2), 16),
            parseInt(cleaned.substring(2, 4), 16),
            parseInt(cleaned.substring(4, 6), 16),
        ];
    };

    const c1 = hex(color1);
    const c2 = hex(color2);

    const result = c1.map((v, i) =>
        Math.round(v + factor * (c2[i] - v))
    );

    return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

function getMatrixColor(value) {
    const scale = MATRIX_THEME.scale;
    const clamped = Math.max(0, Math.min(100, Number(value) || 0));

    // Map 0-100 to 0-5 scale indices
    const position = (clamped / 100) * (scale.length - 1);
    const index = Math.floor(position);
    const factor = position - index;

    if (index >= scale.length - 1) {
        return scale[scale.length - 1];
    }

    return interpolateColor(scale[index], scale[index + 1], factor);
}

// Helper to determine if background is dark (for text contrast)
function isDarkBackground(backgroundColor) {
    const match = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return false;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance < 160;
}

function MatrixView({ matrixData, matrixLoading, groupBy, loadMatrix }) {
    if (!groupBy) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Layers size={20} className="text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">Select a group</h3>
                <p className="mt-1 text-sm text-slate-400">
                    Choose a "Group By" column from the sidebar
                </p>
            </section>
        );
    }

    if (matrixLoading) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
                <p className="text-sm font-medium text-slate-500">Loading matrix...</p>
            </section>
        );
    }

    if (!matrixData) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="mb-4 text-sm text-slate-500">
                    Grouping by <span className="font-mono font-medium text-slate-700">{groupBy}</span>
                </p>
                <button
                    onClick={() => loadMatrix(groupBy)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                    Generate matrix
                </button>
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">
                            Matrix by <span className="font-sans">{matrixData.groupBy}</span>
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Blank percentage by column and group value
                        </p>
                    </div>

                    {/* Legend with soft colors */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Low blank</span>
                        <div className="flex h-5 overflow-hidden rounded-md shadow-inner">
                            <div className="flex h-full w-32">
                                <div className="w-1/6 bg-[#E8F5E9] border-r border-white" title="0%" />
                                <div className="w-1/6 bg-[#C8E6C9] border-r border-white" title="25%" />
                                <div className="w-1/6 bg-[#FFF9C4] border-r border-white" title="50%" />
                                <div className="w-1/6 bg-[#FFECB3] border-r border-white" title="65%" />
                                <div className="w-1/6 bg-[#FFE0B2] border-r border-white" title="75%" />
                                <div className="w-1/6 bg-[#FFCDD2]" title="100%" />
                            </div>
                        </div>
                        <span className="text-slate-500">High blank →</span>
                    </div>
                </div>
            </div>

            {/* Scrollable table */}
            <div className="max-h-[calc(100vh-260px)] overflow-auto">
                <table className="min-w-max text-sm">
                    <thead>
                        <tr className="bg-slate-50">
                            {/* Field column header */}
                            <th
                                className="sticky left-0 top-0 z-20 min-w-[200px] border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                                style={{ backgroundColor: "#F8FAFC" }}
                            >
                                Field
                            </th>

                            {/* Group headers */}
                            {matrixData.groups?.map((group) => (
                                <th
                                    key={group.value}
                                    className="sticky top-0 z-10 min-w-[120px] border-b border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-600"
                                    style={{ backgroundColor: "#F8FAFC" }}
                                >
                                    <div className="truncate max-w-[100px]" title={group.value}>
                                        {group.value}
                                    </div>
                                    <div className="mt-1 text-[10px] font-normal text-slate-400">
                                        {group.rowCount?.toLocaleString()} rows
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {matrixData.rows?.map((row, idx) => (
                            <tr key={row.field} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-100`}>
                                {/* Field column - sticky */}
                                <td
                                    className="sticky left-0 z-10 border-b border-r border-slate-100 px-4 py-2.5 font-sans text-sm font-medium text-slate-700"
                                    style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}
                                >
                                    {row.field}
                                </td>

                                {row.cells?.map((cell) => {
                                    const blankPct = Number(cell.blankPercentage) || 0;
                                    const bgColor = getMatrixColor(blankPct);
                                    const isDark = isDarkBackground(bgColor);

                                    // Use the theme's recommendation colors (already optimized for contrast)
                                    const recColor = MATRIX_THEME.recommendation[cell.recommendation] || MATRIX_THEME.recommendation.review;

                                    return (
                                        <td
                                            key={`${row.field}-${cell.groupValue}`}
                                            className="border border-slate-100 px-3 py-2.5 text-center transition-all duration-150"
                                            style={{ backgroundColor: bgColor }}
                                            title={`Blank: ${blankPct}% · ${cell.recommendation}`}
                                        >
                                            <div>
                                                <span className={`text-sm font-semibold ${blankPct > 65 ? "text-slate-800" : "text-slate-700"}`}>
                                                    {blankPct}%
                                                </span>
                                            </div>
                                            <div className="mt-0.5">
                                                <span
                                                    className="text-[10px] font-bold uppercase tracking-wide"
                                                    style={{ color: recColor }}
                                                >
                                                    {cell.recommendation}
                                                </span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {matrixData.rows?.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-2.5">
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Info size={12} />
                        {matrixData.rows.length} fields · {matrixData.groups?.length} groups
                    </p>
                </div>
            )}
        </section>
    );
}

export default MatrixView;