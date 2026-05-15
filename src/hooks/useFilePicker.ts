import { useCallback, useRef, type ChangeEventHandler } from 'react'

// Thin hook owning the file-input boilerplate shared by ImportButton,
// RecurringImport, and BackupRestore: read the picked file's text content,
// then RESET the input's value so the user can re-pick the same file and
// re-trigger onChange. (Without the reset, picking the exact same file a
// second time does not fire onChange — the browser dedupes it.) The reset
// happens BEFORE the onFile callback runs so any UI state mutations made
// downstream are coherent with the now-empty input.

export interface UseFilePickerArgs {
  /** Called with the file's text content after read. Async errors propagate. */
  onFile: (text: string, file: File) => void | Promise<void>
}

export interface UseFilePicker {
  /** Attach to `<input type="file">` via `ref={inputRef}`. */
  inputRef: React.RefObject<HTMLInputElement | null>
  /** Attach to the same input's `onChange`. */
  onChange: ChangeEventHandler<HTMLInputElement>
}

export function useFilePicker(args: UseFilePickerArgs): UseFilePicker {
  const { onFile } = args
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const file = e.target.files?.[0]
      // Reset the input BEFORE we read the file or hand off to the
      // callback. Otherwise picking the same file twice in a row would
      // not re-fire onChange (the browser sees the value as unchanged).
      // We reset both via the event target and the ref — whichever the
      // caller wires, the clear lands.
      if (inputRef.current !== null) {
        inputRef.current.value = ''
      } else {
        e.target.value = ''
      }
      if (!file) return
      const text = await file.text()
      await onFile(text, file)
    },
    [onFile],
  )

  return { inputRef, onChange }
}
