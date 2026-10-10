"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/utils/Axios/AxiosInstance";
import axios from "axios";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import OpeningOverview from "./components/OpeningOverview";
import ProfileDropzone from "./components/ProfileDropzone";
import SubmittedProfilesList from "./components/SubmittedProfilesList";

export default function VendorOpeningDetailPage() {
  const params = useParams();
  const openingId = params.id;

  const [openingData, setOpeningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOpeningDetails = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/vendor/openings/${openingId}`);
      if (res.data?.success) {
        setOpeningData(res.data.data);
      }
    } catch (err) {
      console.error("Error loading opening details:", err);
      toast.error(err.response?.data?.message || "Failed to load opening details");
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    if (openingId) fetchOpeningDetails();
  }, [openingId, fetchOpeningDetails]);

  const handleUploadSubmit = async () => {
    if (filesToUpload.length === 0) {
      toast.error("Please select at least one candidate profile to submit.");
      return;
    }

    setUploading(true);
    try {
      const presign = await axiosInstance.post(
        `/vendor/openings/${openingId}/profiles/presign`,
        { filenames: filesToUpload.map((file) => file.name) }
      );
      const uploads = presign.data.files;
      await Promise.all(
        uploads.map((upload, index) =>
          axios.put(upload.uploadUrl, filesToUpload[index], {
            headers: { "Content-Type": upload.contentType },
          })
        )
      );
      const res = await axiosInstance.post(`/vendor/openings/${openingId}/profiles/upload`, {
        s3Keys: uploads.map((upload) => upload.s3Key),
      });

      if (res.data?.success) {
        toast.success(`Submitted ${res.data.count} candidate profile(s)!`);
        setFilesToUpload([]);
        fetchOpeningDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit profiles");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm("Are you sure you want to remove this profile?")) return;

    setDeletingId(profileId);
    try {
      const res = await axiosInstance.delete(`/vendor/profiles/${profileId}`);
      if (res.data?.success) {
        toast.success("Profile soft-deleted");
        fetchOpeningDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete profile");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreviewProfile = async (profileId) => {
    const previewTab = window.open("", "_blank");
    try {
      const res = await axiosInstance.get(`/vendor/profiles/${profileId}/preview`, {
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
      toast.error("Unable to generate preview");
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span>Loading opening details...</span>
        </div>
      </div>
    );
  }

  if (!openingData) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Opening Not Found</h2>
        <Link
          href="/vendor/openings"
          className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Openings
        </Link>
      </div>
    );
  }

  const { opening, hiringManagerName, experienceRange, uploadedProfiles } = openingData;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/vendor/openings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Openings
        </Link>
      </div>

      <OpeningOverview
        opening={opening}
        experienceRange={experienceRange}
        hiringManagerName={hiringManagerName}
      />

      <ProfileDropzone
        filesToUpload={filesToUpload}
        setFilesToUpload={setFilesToUpload}
        onSubmit={handleUploadSubmit}
        isUploading={uploading}
      />

      <SubmittedProfilesList
        profiles={uploadedProfiles}
        onPreview={handlePreviewProfile}
        onDelete={handleDeleteProfile}
        deletingId={deletingId}
      />
    </div>
  );
}
