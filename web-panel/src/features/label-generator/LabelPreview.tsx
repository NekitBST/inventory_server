import { useEffect, useState } from 'react';
import type { LabelItem, LabelSize } from './types';
import { generateLabelImage } from './utils';

type LabelPreviewProps = {
  item: LabelItem | null;
  size: LabelSize;
};

export function LabelPreview({ item, size }: LabelPreviewProps) {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!item) {
      setImageUrl('');
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const nextImageUrl = await generateLabelImage(item, size);
        if (!cancelled) {
          setImageUrl(nextImageUrl);
        }
      } catch {
        if (!cancelled) {
          setImageUrl('');
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [item, size]);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      style={{ width: `${size.width}cm`, height: `${size.height}cm` }}
    >
      {item ? (
        imageUrl ? (
          <img
            src={imageUrl}
            alt="Предпросмотр этикетки"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Загрузка...
          </div>
        )
      ) : (
        <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
          Выберите оборудование для предпросмотра
        </div>
      )}
    </div>
  );
}
