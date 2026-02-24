import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The website you are looking for does not exist or has not been configured.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}
