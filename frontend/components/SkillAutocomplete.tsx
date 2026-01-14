"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";

interface SkillAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder?: string;
  suggestions: string[];
}

export function SkillAutocomplete({
  value,
  onChange,
  onAdd,
  placeholder = "Add a skill...",
  suggestions
}: SkillAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter(skill =>
        skill.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(true);
    } else {
      setFilteredSuggestions(suggestions);
      setIsOpen(false);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (skill: string) => {
    onChange(skill);
    setIsOpen(false);
    setTimeout(() => {
      onAdd();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && filteredSuggestions[0].toLowerCase() === value.toLowerCase()) {
        handleSelect(filteredSuggestions[0]);
      } else {
        onAdd();
      }
    }
  };

  const showAddCustom = value && !suggestions.some(s => s.toLowerCase() === value.toLowerCase());

  return (
    <div className="relative flex-1">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
        />
        <button
          onClick={onAdd}
          disabled={!value.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {isOpen && (value || filteredSuggestions.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {showAddCustom && (
            <button
              onClick={() => handleSelect(value)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border-b border-border"
            >
              <Plus className="w-4 h-4 text-blue-500" />
              <span className="text-foreground">
                Add <span className="font-semibold text-blue-600 dark:text-blue-400">"{value}"</span>
              </span>
            </button>
          )}
          
          {filteredSuggestions.slice(0, 50).map((skill, index) => (
            <button
              key={index}
              onClick={() => handleSelect(skill)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-foreground/5 transition-colors text-left"
            >
              <span className="text-foreground">{skill}</span>
              {skill.toLowerCase() === value.toLowerCase() && (
                <Check className="w-4 h-4 text-blue-500" />
              )}
            </button>
          ))}
          
          {filteredSuggestions.length === 0 && !showAddCustom && (
            <div className="px-4 py-3 text-foreground/60 text-sm">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
