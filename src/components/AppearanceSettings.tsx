import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/hooks/useTheme";

/**
 * Appearance Settings Component
 * Allows users to toggle between light and dark mode
 */
const AppearanceSettings: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose between light and dark visual themes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="text-base">
                Dark Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable dark mode for better viewing in low-light conditions
              </p>
            </div>
            <Switch id="dark-mode" disabled />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDarkMode = theme === "dark";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose between light and dark visual themes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dark-mode" className="text-base">
              Dark Mode
            </Label>
            <p className="text-sm text-muted-foreground">Enable dark mode for better viewing in low-light conditions</p>
          </div>
          <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleTheme} />
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
