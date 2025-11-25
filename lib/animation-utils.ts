import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface ViewTransitionOptions {
  transitionName?: string;
  skipTransition?: boolean;
}

export const useViewTransition = () => {
  const router = useRouter();

  const navigateWithTransition = useCallback(
    (path: string, options: ViewTransitionOptions = {}) => {
      const { transitionName = "fade", skipTransition = false } = options;

      if (skipTransition || !document.startViewTransition) {
        router.push(path);
        return;
      }

      document.startViewTransition(() => {
        router.push(path);
      });
    },
    [router]
  );

  return { navigateWithTransition };
};

// Framer Motion animation variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export const cardHoverVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

export const checkmarkVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  },
};

export const slideInVariants = {
  initial: { x: -20, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
};
