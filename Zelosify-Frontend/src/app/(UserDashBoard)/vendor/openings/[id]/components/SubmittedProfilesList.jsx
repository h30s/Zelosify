import { FileText, ExternalLink, Trash2, Loader2 } from "lucide-react";

export default function SubmittedProfilesList({
  profiles,
  onPreview,
  onDelete,
  deletingId,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          My Submitted Profiles ({profiles.length})
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Candidate profiles you submitted for this contract opening.
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="p-8 text-center border rounded-xl border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium">No candidate profiles submitted yet</p>
          <p className="text-xs mt-0.5">Use the upload box above to submit candidates.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700 border rounded-xl border-gray-200 dark:border-gray-700 overflow-hidden">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {p.fileName}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>Submitted: {new Date(p.submittedAt).toLocaleString()}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPreview(p.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Preview
                </button>

                <button
                  onClick={() => onDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
