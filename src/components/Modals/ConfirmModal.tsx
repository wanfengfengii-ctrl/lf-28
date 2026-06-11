import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/store/shared';

export default function ConfirmModal() {
  const confirmModal = useUIStore((s) => s.confirmModal);
  const closeConfirmModal = useUIStore((s) => s.closeConfirmModal);

  return (
    <AnimatePresence>
      {confirmModal?.open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeConfirmModal}
          />

          <motion.div
            className="relative z-10 mx-4 w-full max-w-sm rounded-xl bg-museum-canvas-light border border-white/10 p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className="text-base font-semibold text-white mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-museum-slate-light mb-6 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                className="rounded-lg px-4 py-2 text-sm text-museum-slate-light hover:text-white hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="rounded-lg bg-museum-gold px-4 py-2 text-sm font-medium text-white hover:bg-museum-gold-light transition-colors"
              >
                确认
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
