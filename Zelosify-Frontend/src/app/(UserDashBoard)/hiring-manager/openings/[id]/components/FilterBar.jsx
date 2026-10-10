import { Search } from "lucide-react";

const FILTER_TABS = [
  { id: "ALL", label: "All" },
  { id: "RECOMMENDED", label: "Recommended" },
  { id: "BORDERLINE", label: "Borderline" },
  { id: "NOT_RECOMMENDED", label: "Not Recommended" },
  { id: "SHORTLISTED", label: "Shortlisted" },
  { id: "REJECTED", label: "Rejected" },
];

export default function FilterBar({ search, onSearchChange, activeFilter, onFilterChange }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search candidate profiles, skills, reasons..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-lg text-xs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeFilter === tab.id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
