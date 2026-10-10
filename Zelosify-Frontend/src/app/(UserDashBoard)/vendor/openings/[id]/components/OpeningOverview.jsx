import { MapPin, User } from "lucide-react";

export default function OpeningOverview({ opening, experienceRange, hiringManagerName }) {
  if (!opening) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {opening.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
              {opening.status}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-3xl leading-relaxed">
            {opening.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Experience Range</div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
            {experienceRange}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            {opening.location || "Remote"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Contract Type</div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
            {opening.contractType || "C2C"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Hiring Manager</div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-gray-400" />
            {hiringManagerName}
          </div>
        </div>
      </div>
    </div>
  );
}
