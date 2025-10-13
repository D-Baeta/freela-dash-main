// components/ActionIconButton.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface ActionIconButtonProps {
  icon: ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "ghost" | "destructive" | "outline" | "secondary";
}

export function ActionIconButton({
  icon,
  title,
  onClick,
  className,
  variant = "ghost",
}: ActionIconButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={cn("h-8 w-8", className)}
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        {title && <TooltipContent>{title}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
