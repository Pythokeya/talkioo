import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name: string): string => {
  if (!name) return "?";
  
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatDate = (date: Date): string => {
  const today = new Date();
  const messageDate = new Date(date);
  
  if (
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }
  
  return messageDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const validateAgeGroup = (ageGroup: string): boolean => {
  return ["under13", "13-17", "18plus"].includes(ageGroup);
};

// Check if a string is a valid URL for images, stickers, GIFs, etc.
export const isValidUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// Function to safely truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// Get random avatar URL 
export const getRandomAvatarUrl = (name: string): string => {
  // Using DiceBear avatars API
  return `https://avatars.dicebear.com/api/avataaars/${encodeURIComponent(name)}.svg`;
};

// Check if device is mobile
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

// Create a deep copy of an object
export const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
