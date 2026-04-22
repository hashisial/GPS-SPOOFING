import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useSpring
} from "framer-motion";
import { useEffect, useState } from "react";

const easeOut = [0.16, 1, 0.3, 1];

export const fadeUpItemVariants = {
  hidden: {
    opacity: 0,
    y: 18
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: easeOut
    }
  }
};

const reducedItemVariants = {
  hidden: {
    opacity: 0
  },
  show: {
    opacity: 1,
    transition: {
      duration: 0.2
    }
  }
};

const staggerContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const routeTransitionVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(4px)"
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.38,
      ease: easeOut
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: {
      duration: 0.18,
      ease: "easeIn"
    }
  }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 16
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: easeOut
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: {
      duration: 0.18,
      ease: "easeIn"
    }
  }
};

export function AnimatedPage({ children, className = "" }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={shouldReduceMotion ? reducedItemVariants : fadeUpItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PageTransition({ children, className = "" }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit="exit"
      variants={shouldReduceMotion ? reducedItemVariants : routeTransitionVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredSection({ children, className = "", viewport = false }) {
  const shouldReduceMotion = useReducedMotion();
  const viewportProps = viewport
    ? {
        whileInView: "show",
        viewport: {
          once: true,
          margin: "-80px"
        }
      }
    : {
        animate: "show"
      };

  return (
    <motion.section
      initial="hidden"
      variants={shouldReduceMotion ? undefined : staggerContainerVariants}
      className={className}
      {...viewportProps}
    >
      {children}
    </motion.section>
  );
}

export function AnimatedItem({ children, className = "", viewport = false }) {
  const shouldReduceMotion = useReducedMotion();
  const viewportProps = viewport
    ? {
        initial: "hidden",
        whileInView: "show",
        viewport: {
          once: true,
          margin: "-60px"
        }
      }
    : {};

  return (
    <motion.div
      variants={shouldReduceMotion ? reducedItemVariants : fadeUpItemVariants}
      className={className}
      {...viewportProps}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredList({ children, className = "", as = "div" }) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] ?? motion.div;

  return (
    <Component
      initial="hidden"
      animate="show"
      variants={shouldReduceMotion ? undefined : staggerContainerVariants}
      className={className}
    >
      {children}
    </Component>
  );
}

export function MotionCard({ children, className = "", ...props }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      variants={shouldReduceMotion ? reducedItemVariants : fadeUpItemVariants}
      whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`motion-card ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.article>
  );
}

export function MotionTableRow({ children, className = "", ...props }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.tr
      variants={shouldReduceMotion ? reducedItemVariants : fadeUpItemVariants}
      whileHover={shouldReduceMotion ? undefined : { x: 3, backgroundColor: "rgba(27, 194, 213, 0.06)" }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`interactive-button ${className}`.trim()}
      {...props}
    >
      {children}
    </motion.tr>
  );
}

export function MotionModal({ children, className = "" }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.18 }}
        className="modal-backdrop-motion"
      >
        <motion.div
          variants={shouldReduceMotion ? reducedItemVariants : modalVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimatedInput({ as = "input", className = "", ...props }) {
  const Component = motion[as] ?? motion.input;
  const shouldReduceMotion = useReducedMotion();

  return (
    <Component
      whileFocus={shouldReduceMotion ? undefined : { scale: 1.005 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`animated-input ${className}`.trim()}
      {...props}
    />
  );
}

export function AnimatedTabs({ options, value, onChange, className = "" }) {
  return (
    <div className={`animated-tabs ${className}`.trim()}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <AnimatedButton
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`animated-tab ${isActive ? "is-active" : ""}`.trim()}
          >
            {isActive ? <motion.span layoutId="animated-tab-active" className="animated-tab-pill" /> : null}
            <span className="relative z-10">{option.label}</span>
          </AnimatedButton>
        );
      })}
    </div>
  );
}

export function AnimatedButton({ children, className = "", type = "button", ...props }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              scale: 1.05,
              boxShadow: "0 0 28px rgba(27, 194, 213, 0.2)"
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.97
            }
      }
      transition={{
        duration: 0.18,
        ease: "easeOut"
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function AnimatedCounter({ value, suffix = "", className = "" }) {
  const shouldReduceMotion = useReducedMotion();
  const numericValue = Number(value);
  const springValue = useSpring(0, {
    stiffness: 90,
    damping: 22,
    mass: 0.7
  });
  const [displayValue, setDisplayValue] = useState(
    Number.isFinite(numericValue) ? Math.round(numericValue) : value
  );

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      setDisplayValue(value);
      return;
    }

    if (shouldReduceMotion) {
      setDisplayValue(Math.round(numericValue));
      return;
    }

    springValue.set(numericValue);
  }, [numericValue, shouldReduceMotion, springValue, value]);

  return (
    <span className={className}>
      {displayValue}
      {suffix}
    </span>
  );
}

export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton-shimmer ${className}`.trim()} aria-hidden="true" />;
}

export function LoadingOverlay({ label = "Loading workspace..." }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="loading-overlay-motion"
    >
      <div className="loading-orb" />
      <p>{label}</p>
    </motion.div>
  );
}

export function ScrollReveal({ children, className = "" }) {
  return (
    <AnimatedItem className={className} viewport>
      {children}
    </AnimatedItem>
  );
}
