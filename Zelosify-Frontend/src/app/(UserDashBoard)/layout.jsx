"use client";
import SignOutConfirmation from "@/components/UI/SignOutConfirmation";
import Header from "@/components/UserDashboardPage/Header/Header";
import SideBarLayout from "@/components/UserDashboardPage/SideBar/SideBarLayout";
import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/Auth/useAuth";

export default function UserDashboardlayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showSignoutConfirmation, handleCloseSignoutConfirmation } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* main content */}
      <div className="flex flex-col min-h-screen bg-background">
        <SignOutConfirmation
          isOpen={showSignoutConfirmation}
          onCancel={handleCloseSignoutConfirmation}
        />
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <div className="flex flex-1 overflow-hidden">
          <SideBarLayout
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            className="transition-all duration-300"
          />
          <main
            className={`relative flex-1 justify-between items-center w-full transition-all duration-300 ${
              isSidebarOpen ? "lg:ml-48" : "lg:ml-20"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
