import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const classCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

export function cn(...inputs: ClassValue[]): string {
  const key = clsx(inputs);
  if (!key) return "";
  
  const cached = classCache.get(key);
  if (cached) return cached;

  const result = twMerge(key);
  if (classCache.size >= MAX_CACHE_SIZE) {
    const firstKey = classCache.keys().next().value;
    if (firstKey) classCache.delete(firstKey);
  }
  classCache.set(key, result);
  return result;
}

