import { headers } from 'next/headers';
import { db, orderPhotos, clientOrders } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import ThreeViewer from '@/components/ThreeViewer';

export default async function ThreeDViewPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const { locale } = params;
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');

  if (!tenantId) {
    redirect(`/${locale}/login`);
  }

  // Get the order and verify tenant ownership
  const order = await db
    .select()
    .from(clientOrders)
    .where(
      and(
        eq(clientOrders.id, parseInt(params.id, 10)),
        eq(clientOrders.tenantId, parseInt(tenantId, 10))
      )
    )
    .limit(1);

  if (!order[0]) {
    notFound();
  }

  // Get 3D photos for this order
  const photos = await db
    .select()
    .from(orderPhotos)
    .where(
      and(
        eq(orderPhotos.orderId, parseInt(params.id, 10)),
        eq(orderPhotos.tenantId, parseInt(tenantId, 10))
      )
    );

  // Find the first photo with a 3D model
  const photoWith3D = photos.find((p) => p.gaussianSplatUrl);

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Back Navigation */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href={`/${locale}/account/orders/${params.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg shadow-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Order
        </Link>
      </div>

      {/* Controls Hint */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 text-gray-900 rounded-lg px-4 py-2 shadow-lg">
        <p className="text-sm font-medium">Controls</p>
        <p className="text-xs text-gray-600 mt-1">
          Drag to rotate • Scroll to zoom • Right-drag to pan
        </p>
      </div>

      {/* 3D Viewer */}
      {photoWith3D ? (
        <ThreeViewer splatUrl={photoWith3D.gaussianSplatUrl!} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">3D Model Not Ready</h2>
            <p className="text-gray-400 mb-4">
              The 3D reconstruction is still being processed or has not been
              generated yet.
            </p>
            <Link
              href={`/${locale}/account/orders/${params.id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Return to Order Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
