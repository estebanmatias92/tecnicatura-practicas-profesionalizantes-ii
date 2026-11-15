declare module 'epubjs' {
  const ePub: (urlOrData?: string | ArrayBuffer) => {
    open: (input: string | ArrayBuffer, what?: string) => Promise<unknown>;
    renderTo: (element: HTMLElement, options?: Record<string, unknown>) => {
      display: () => Promise<void>;
      destroy: () => void;
    };
    destroy: () => void;
  };
  export default ePub;
}
