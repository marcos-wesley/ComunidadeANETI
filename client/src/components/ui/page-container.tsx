import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  sidebar?: ReactNode;
  rightSidebar?: ReactNode;
}

export function PageContainer({ 
  children, 
  className, 
  maxWidth = "xl",
  sidebar,
  rightSidebar 
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-2xl", 
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full"
  };

  if (sidebar || rightSidebar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className={cn("mx-auto px-4", maxWidthClasses[maxWidth], className)}>
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            {sidebar && (
              <div className="col-span-12 lg:col-span-3">
                <div className="sticky top-24">
                  {sidebar}
                </div>
              </div>
            )}
            
            {/* Main Content */}
            <div className={cn(
              "col-span-12",
              sidebar && rightSidebar ? "lg:col-span-6" : 
              sidebar || rightSidebar ? "lg:col-span-9" : 
              "lg:col-span-12"
            )}>
              {children}
            </div>

            {/* Right Sidebar */}
            {rightSidebar && (
              <div className="col-span-12 lg:col-span-3">
                <div className="sticky top-24">
                  {rightSidebar}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className={cn("mx-auto px-4", maxWidthClasses[maxWidth], className)}>
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}