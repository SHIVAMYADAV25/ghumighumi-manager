import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export function Dropdown({ trigger, items, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handle);

    return () =>
      document.removeEventListener(
        'mousedown',
        handle
      );
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.96
            }}

            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}

            exit={{
              opacity: 0,
              y: -8,
              scale: 0.96
            }}

            transition={{
              duration: 0.15
            }}

            className={clsx(
              'absolute top-full mt-2 min-w-[180px] bg-ink-700 border border-white/8 rounded-xl shadow-2xl z-50 py-1 overflow-hidden',
              align === 'right'
                ? 'right-0'
                : 'left-0'
            )}
          >
            {items.map((item, i) =>
              item.divider ? (
                <div
                  key={i}
                  className="border-t border-white/6 my-1"
                />
              ) : (
                <button
                  key={i}

                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}

                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors',

                    item.danger
                      ? 'text-terracotta hover:bg-terracotta/10'
                      : 'text-sand-300 hover:bg-white/5 hover:text-sand-100'
                  )}
                >
                  {item.icon && (
                    <item.icon
                      size={15}
                      className="flex-shrink-0"
                    />
                  )}

                  {item.label}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
