import { cn } from "@/lib/utils";
import React from "react";

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | "default" 
    | "blue" 
    | "green" 
    | "purple" 
    | "amber" 
    | "card" 
    | "pill" 
    | "toast";
  blurIntensity?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export function GlassContainer({
  variant = "default",
  blurIntensity = "md",
  className,
  children,
  ...props
}: GlassContainerProps) {
  // Map variants to appropriate class names
  const variantClasses = {
    default: "ios26-glass",
    blue: "glass-blue",
    green: "glass-green",
    purple: "glass-purple",
    amber: "glass-amber",
    card: "glass-card",
    pill: "glass-pill",
    toast: "glass-toast",
  };

  // Map blur intensities to class names
  const blurClasses = {
    sm: "glass-blur-sm",
    md: "glass-blur-md",
    lg: "glass-blur-lg",
    xl: "glass-blur-xl",
  };

  // Only apply blur class if using default variant
  const blurClass = variant === "default" ? blurClasses[blurIntensity] : "";

  return (
    <div 
      className={cn(
        variant !== "default" ? variantClasses[variant] : blurClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Example usage:
// <GlassContainer>Basic glass container with medium blur</GlassContainer>
// <GlassContainer variant="blue">Blue-tinted glass</GlassContainer>
// <GlassContainer variant="card">Card with glass effect</GlassContainer>
// <GlassContainer blurIntensity="xl">Extra blurry glass</GlassContainer>
