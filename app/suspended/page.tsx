import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';

function SuspendedContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Service Temporarily Unavailable
        </h1>
        <p className="text-gray-600 mb-6">
          This website is currently suspended. Please contact the business owner for more information.
        </p>
        <p className="text-sm text-gray-500">
          If you are the owner, please log in to your admin panel to check your service status.
        </p>
      </div>
    </div>
  );
}

export default function SuspendedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SuspendedContent />
    </Suspense>
  );
}
