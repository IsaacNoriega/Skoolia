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

interface OnboardingSelectProps {
  label: string;
  options: readonly string[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  showSearch?: boolean;
}

export default function OnboardingSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  className,
  showSearch = false,
}: OnboardingSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-lg font-semibold">
        {label}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="
              w-full
              h-16
              justify-between
              rounded-full
              bg-[#f3f3f3]
              border-0
              text-lg
              px-8
              hover:bg-[#ececec]
              transition-all
              font-normal
            "
          >
            <span className={cn(!value && "text-neutral-500")}>
              {value || placeholder}
            </span>
            <ChevronDown className="ml-2 h-5 w-5 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-2 rounded-2xl border-none shadow-2xl"
          align="start"
        >
          <Command className="max-h-[300px]">
            {showSearch && <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />}
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup className="overflow-y-auto">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 text-lg rounded-xl cursor-pointer"
                >
                  {Icon && <Icon className="w-5 h-5 text-blue-600" />}

                  {option}

                  {value === option && (
                    <Check className="ml-auto w-4 h-4 text-black" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-sm text-red-500 px-2">
          {error}
        </p>
      )}
    </div>
  );
}
