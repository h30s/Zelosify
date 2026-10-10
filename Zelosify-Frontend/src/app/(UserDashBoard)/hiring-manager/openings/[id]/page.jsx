"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import { ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";

import OpeningHeader from "./components/OpeningHeader";
import FilterBar from "./components/FilterBar";
import VirtualizedProfileGrid from "./components/VirtualizedProfileGrid";

export default function HiringManagerOpeningProfilesPage() {
  const params = useParams();
  const openingId = params.id;

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [filterBadge, setFilterBadge] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchOpeningAndProfiles = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/hiring-manager/openings/${openingId}/profiles`);
      if (res.data?.success) {
        setOpening(res.data.opening);
        setProfiles(res.data.profiles || []);
      }
    } catch (err) {
      console.error("Error loading candidate profiles:", err);
      toast.error(err.response?.data?.message || "Failed to load candidate profiles");
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    if (openingId) fetchOpeningAndProfiles();
  }, [openingId, fetchOpeningAndProfiles]);

  const handleShortlist = async (profileId) => {
    setActionLoadingId(profileId);
    try {
      const res = await axiosInstance.post(`/hiring-manager/profiles/${profileId}/shortlist`);
      if (res.data?.success) {
        toast.success("Candidate shortlisted!");
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: "SHORTLISTED" } : p))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to shortlist profile");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (profileId) => {
    setActionLoadingId(profileId);
    try {
      const res = await axiosInstance.post(`/hiring-manager/profiles/${profileId}/reject`);
      if (res.data?.success) {
        toast.info("Candidate rejected");
        setProfiles((prev) =>
          prev.map((p) => (p.id === profileId ? { ...p, status: "REJECTED" } : p))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject profile");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePreview = async (profileId) => {
    // Open a blank tab synchronously during user click to prevent browser popup blockers
    const previewTab = window.open("", "_blank");
    try {
      const res = await axiosInstance.get(`/hiring-manager/profiles/${profileId}/preview`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (previewTab) {
        previewTab.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener,noreferrer";
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch {
      if (previewTab) previewTab.close();
      toast.error("Could not preview file");
    }
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        p.fileName.toLowerCase().includes(search.toLowerCase()) ||
        p.explanation.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (filterBadge === "RECOMMENDED") return p.badge === "Recommended";
      if (filterBadge === "BORDERLINE") return p.badge === "Borderline";
      if (filterBadge === "NOT_RECOMMENDED") return p.badge === "Not Recommended";
      if (filterBadge === "SHORTLISTED") return p.status === "SHORTLISTED";
      if (filterBadge === "REJECTED") return p.status === "REJECTED";
      return true;
    });
  }, [profiles, search, filterBadge]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/hiring-manager/openings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Openings
        </Link>
        <button
          onClick={fetchOpeningAndProfiles}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <OpeningHeader opening={opening} profileCount={profiles.length} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        activeFilter={filterBadge}
        onFilterChange={setFilterBadge}
      />

      {filteredProfiles.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            No candidate profiles found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Adjust your search or filter options.
          </p>
        </div>
      ) : (
        <VirtualizedProfileGrid
          profiles={filteredProfiles}
          cardProps={(profile) => ({
            isLoadingAction: actionLoadingId === profile.id,
            onShortlist: handleShortlist,
            onReject: handleReject,
            onPreview: handlePreview,
          })}
        />
      )}
    </div>
  );
}
