import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to conditionally construct and merge Tailwind CSS class names.
 * It uses clsx to conditionally join classes and tailwind-merge to resolve conflicts.
 * 
 * @param inputs - An array of class names, objects, or conditional arrays
 * @returns A single string of resolved tailwind utility classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
