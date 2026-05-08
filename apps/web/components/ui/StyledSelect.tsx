"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import { Check, ChevronDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyledSelectProps {
  label?: string;
  options: readonly string[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  showSearch?: boolean;
  variant?: "onboarding" | "minimal" | "outline";
}

export default function StyledSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  className,
  triggerClassName,
  contentClassName,
  showSearch = false,
  variant = "outline",
}: StyledSelectProps) {
  const [open, setOpen] = useState(false);

  const variants = {
    onboarding: "h-16 rounded-full bg-[#f3f3f3] border-none px-8 text-lg hover:bg-[#ececec] font-normal",
    minimal: "h-auto p-0 bg-transparent border-none shadow-none hover:bg-transparent text-base font-bold",
    outline: "h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-6 hover:bg-slate-100 font-bold",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between transition-all text-slate-950",
              variants[variant],
              triggerClassName
            )}
          >
            <span className={cn("truncate", !value && "text-slate-400 font-medium")}>
              {value || placeholder}
            </span>
            <ChevronDown className={cn("ml-2 h-4 w-4 opacity-50 shrink-0 transition-transform", open && "rotate-180")} />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-2 rounded-[2rem] border border-slate-100 shadow-2xl bg-white/95 backdrop-blur-xl z-[200]",
            contentClassName
          )}
          align="start"
        >
          <Command className="max-h-[300px] bg-transparent">
            {showSearch && <CommandInput placeholder={`Buscar...`} className="border-none focus:ring-0" />}
            <CommandEmpty className="py-6 text-center text-sm text-slate-400">No se encontraron resultados.</CommandEmpty>
            <CommandGroup className="overflow-y-auto custom-scrollbar">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 px-4 text-sm font-bold rounded-2xl cursor-pointer aria-selected:bg-slate-100 hover:bg-slate-50 transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4 text-indigo-600" />}

                  {option}

                  {value === option && (
                    <Check className="ml-auto w-4 h-4 text-indigo-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-xs text-red-500 px-2 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
