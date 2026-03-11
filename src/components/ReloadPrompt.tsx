import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-blue-800 p-4 text-white shadow-lg">
      <p className="mb-2 text-sm">A new version is available!</p>
      <div className="flex gap-2">
        <button
          className="rounded bg-white px-3 py-1 text-sm font-medium text-blue-800 hover:bg-blue-50"
          onClick={() => updateServiceWorker(true)}
        >
          Update
        </button>
        <button
          className="rounded border border-white/30 px-3 py-1 text-sm hover:bg-white/10"
          onClick={() => setNeedRefresh(false)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
