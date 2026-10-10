import { MapPin, Briefcase } from "lucide-react";

export default function OpeningHeader({ opening, profileCount }) {
  if (!opening) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {opening.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {opening.location || "Remote"}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {opening.contractType || "C2C"}
            </span>
            <span>
              Experience: {opening.experienceMin} -{" "}
              {opening.experienceMax ? `${opening.experienceMax} yrs` : "+ yrs"}
            </span>
          </div>
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {profileCount} Profiles Submitted
          </span>
        </div>
      </div>
    </div>
  );
}
