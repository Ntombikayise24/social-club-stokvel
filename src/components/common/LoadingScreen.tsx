import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({ message = 'Loading...', fullScreen = false }: LoadingScreenProps) {
  const content = (
    <div className="text-center">
      <div className="relative inline-flex">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 animate-pulse"></div>
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 absolute inset-0" />
      </div>
      <p className="text-gray-500 mt-3 text-sm font-medium">{message}</p>
      <div className="flex justify-center space-x-1 mt-2">
        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  );
}
