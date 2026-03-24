interface ConfirmDialogProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg border border-low p-5 w-[360px]">
        <h3 className="text-sm font-medium text-t1 mb-2">{title}</h3>
        <p className="text-xs text-t2 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-t2 hover:text-t1 rounded border border-low"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
