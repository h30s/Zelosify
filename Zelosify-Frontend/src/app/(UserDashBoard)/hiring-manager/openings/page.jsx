"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import {
  Briefcase,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export default function HiringManagerOpeningsPage() {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOpenings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/hiring-manager/openings");
      if (res.data && res.data.success) {
        setOpenings(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching hiring manager openings:", err);
      toast.error(err.response?.data?.message || "Failed to load your openings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenings();
  }, [fetchOpenings]);

  const filtered = openings.filter(
    (op) =>
      op.title.toLowerCase().includes(search.toLowerCase()) ||
      (op.location && op.location.toLowerCase().includes(search.toLowerCase())) ||
      (op.contractType && op.contractType.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            My Contract Openings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your contractual roles and evaluate AI-ranked candidate profiles.
          </p>
        </div>

        <button
          onClick={fetchOpenings}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter your openings by title, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Openings Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse space-y-3"
            >
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded mt-4" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Briefcase className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              No Openings Found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You do not have any contract openings assigned to your account.
            </p>
          </div>
        ) : (
          filtered.map((opening) => (
            <div
              key={opening.id}
              className="flex flex-col justify-between p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition">
                    {opening.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex-shrink-0">
                    {opening.contractType || "Contract"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {opening.description || "No description provided."}
                </p>

                <div className="space-y-1.5 pt-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span>{opening.location || "Remote"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                    <span>Exp: {opening.experienceRange}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>Posted: {new Date(opening.postedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>
                    {opening.profilesCount} Candidate{opening.profilesCount === 1 ? "" : "s"}
                  </span>
                </div>

                <Link
                  href={`/hiring-manager/openings/${opening.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
                >
                  Review AI Profiles
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
