// Dialog HTML gốc giữ focus bên trong, hỗ trợ Esc và khóa tương tác với nền.
import { useEffect, useRef } from "react";
import Icon from "./Icon";
export default function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    // Lưu nút mở dialog để trả focus đúng vị trí khi đóng; đồng thời khôi phục cuộn trang.
    const previous = document.activeElement;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-header">
        <span className="eyebrow">{title}</span>
        <button
          className="icon-button secondary"
          onClick={onClose}
          aria-label="Close dialog"
          autoFocus
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
