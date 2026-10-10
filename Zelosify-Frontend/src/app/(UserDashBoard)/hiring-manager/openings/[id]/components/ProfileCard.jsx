import {
  FileText,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Cpu,
} from "lucide-react";

export default function ProfileCard({
  profile,
  isLoadingAction,
  onShortlist,
  onReject,
  onPreview,
}) {
  const isShortlisted = profile.status === "SHORTLISTED";
  const isRejected = profile.status === "REJECTED";

  return (
    <div
      className={`flex flex-col justify-between p-5 rounded-xl border bg-white dark:bg-gray-800 shadow-sm transition ${
        isShortlisted
          ? "border-green-300 dark:border-green-800/60 bg-green-50/20 dark:bg-green-950/10"
          : isRejected
          ? "border-red-200 dark:border-red-900/40 opacity-75"
          : "border-gray-200 dark:border-gray-700 hover:shadow-md"
      }`}
    >
      <div className="space-y-3">
        {/* Top: File info and Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 truncate">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate" title={profile.fileName}>
                {profile.fileName}
              </h3>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{new Date(profile.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            {profile.badge === "Recommended" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-3.5 w-3.5" /> Recommended
              </span>
            ) : profile.badge === "Borderline" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" /> Borderline
              </span>
            ) : profile.badge === "Not Recommended" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                <XCircle className="h-3.5 w-3.5" /> Not Recommended
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                Pending AI
              </span>
            )}
          </div>
        </div>

        {/* AI Scoring Metrics */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 text-center">
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Score</div>
            <div
              className={`text-base font-extrabold mt-0.5 ${
                profile.score >= 75
                  ? "text-green-600 dark:text-green-400"
                  : profile.score >= 50
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {profile.score !== null ? `${profile.score}%` : "N/A"}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">Confidence</div>
            <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {profile.confidence !== null ? `${profile.confidence}%` : "N/A"}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-0.5">
              <Cpu className="h-3 w-3" /> Latency
            </div>
            <div className="text-base font-extrabold text-gray-700 dark:text-gray-300 mt-0.5">
              {profile.latencyMs !== null ? `${profile.latencyMs} ms` : "N/A"}
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" /> AI Agent Assessment:
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white/60 dark:bg-gray-800/60 p-2 rounded border border-gray-100 dark:border-gray-700/60">
            {profile.explanation}
          </p>
        </div>

        {isShortlisted && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 p-2 rounded">
            <CheckCircle className="h-4 w-4" /> Candidate Shortlisted
          </div>
        )}
        {isRejected && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 p-2 rounded">
            <XCircle className="h-4 w-4" /> Candidate Rejected
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
        <button
          onClick={() => onPreview(profile.id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Preview
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onReject(profile.id)}
            disabled={isLoadingAction || isRejected}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition"
          >
            <ThumbsDown className="h-3.5 w-3.5" /> Reject
          </button>

          <button
            onClick={() => onShortlist(profile.id)}
            disabled={isLoadingAction || isShortlisted}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition shadow-sm"
          >
            <ThumbsUp className="h-3.5 w-3.5" /> Shortlist
          </button>
        </div>
      </div>
    </div>
  );
}
