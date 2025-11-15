import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import AppearanceSettings from "@/components/AppearanceSettings";

const AccountView: React.FC = () => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAccountDeleteDialogOpen, setIsAccountDeleteDialogOpen] = useState(false);
  const [hasVoiceSample, setHasVoiceSample] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVoiceSample = async () => {
      try {
        const response = await fetch("/api/voice-sample");
        if (response.ok) {
          setHasVoiceSample(true);
        } else if (response.status === 404) {
          setHasVoiceSample(false);
        } else {
          throw new Error("Failed to fetch voice sample status");
        }
      } catch {
        // Error fetching voice sample, assume no sample exists
        setHasVoiceSample(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoiceSample();
  }, []);

  const handleDeleteSample = async () => {
    try {
      const response = await fetch("/api/voice-sample", { method: "DELETE" });
      if (response.ok) {
        setHasVoiceSample(false);
        setIsDeleteDialogOpen(false);
        toast.success("Success", { description: "Your voice sample has been deleted." });
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete voice sample.");
      }
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (response.ok || response.status === 202) {
        toast.success("Success", { description: "Your account is scheduled for deletion." });
        // Log out the user
        const logoutResponse = await fetch("/api/auth/logout", { method: "POST" });
        if (logoutResponse.ok) {
          window.location.href = "/login";
        } else {
          // If logout fails, still redirect to login
          window.location.href = "/login";
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to schedule account deletion.");
      }
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <AppearanceSettings />

      <Card>
        <CardHeader>
          <CardTitle>Voice Sample</CardTitle>
          <CardDescription>
            {hasVoiceSample
              ? "Manage your voice sample. Deleting it will remove your voice clone permanently."
              : "Record a voice sample to create personalized stories with your voice."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : hasVoiceSample ? (
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Voice Sample</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your voice sample and associated voice
                    clone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSample}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                You haven&apos;t recorded a voice sample yet. Record one to start creating personalized stories with
                your voice.
              </p>
              <Button asChild>
                <a href="/voice-sample">Record Voice Sample</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={isAccountDeleteDialogOpen} onOpenChange={setIsAccountDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account, voice sample, and all
                  generated stories.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountView;
