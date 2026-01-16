import { createRoot, Root } from "react-dom/client";
import { NotificationToast } from "../components/NotificationToast";

interface ToastOptions {
  id: string;
  title: string;
  message: string;
  type: "message" | "friend_request" | "game" | "default";
  autoHideDuration?: number;
  metadata?: {
    senderId?: number;
    senderName?: string;
  };
}

class ToastManager {
  private activeToasts: Map<string, { container: HTMLDivElement; root: Root }> = new Map();

  show(options: ToastOptions) {
    // Destroy previous toast if exists
    this.destroyAll();

    const container = document.createElement("div");
    document.body.appendChild(container);

    const root = createRoot(container);

    const handleClose = () => {
      this.destroy(options.id);
    };

    root.render(
      <NotificationToast
        id={options.id}
        title={options.title}
        message={options.message}
        type={options.type}
        onClose={handleClose}
        autoHideDuration={options.autoHideDuration}
        metadata={options.metadata}
      />
    );

    this.activeToasts.set(options.id, { container, root });
  }

  destroy(id: string) {
    const toast = this.activeToasts.get(id);
    if (toast) {
      setTimeout(() => {
        toast.root.unmount();
        toast.container.remove();
        this.activeToasts.delete(id);
      }, 300); // Wait for animation
    }
  }

  destroyAll() {
    this.activeToasts.forEach((toast) => {
      toast.root.unmount();
      toast.container.remove();
    });
    this.activeToasts.clear();
  }
}

export const toastManager = new ToastManager();
