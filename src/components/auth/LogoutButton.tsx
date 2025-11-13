import { useState } from "react";
import { LogOut } from "lucide-react";
import Button from "@/components/ui/button";

const LogoutButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Redirect to login page
        window.location.assign("/login");
      } else {
        // Still redirect on error to ensure user is logged out client-side
        window.location.assign("/login");
      }
    } catch {
      // Still redirect on error
      window.location.assign("/login");
    }
  };

  return (
    <>
      {/* Mobile view: Icon only */}
      <LogOut
        className="size-4 cursor-pointer mr-2"
        onClick={handleLogout}
        aria-label={isLoading ? "Signing out..." : "Sign out"}
      />

      {/* Desktop view: Full button with text */}
      <Button variant="outline" onClick={handleLogout} disabled={isLoading} className="hidden sm:inline-flex">
        {isLoading ? "Signing out..." : "Sign out"}
      </Button>
    </>
  );
};

export default LogoutButton;
