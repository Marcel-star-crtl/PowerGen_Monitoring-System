import React, { useState, useEffect } from 'react';
import { Photo } from '@/types/common.types';
import { getImageUrl } from '@/utils/helpers';
import { Modal } from './Modal';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PhotoGalleryProps {
  photos: Photo[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [srcs, setSrcs] = useState<string[]>([]);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  useEffect(() => {
    const resolved = photos.map(p => getImageUrl(p.url));
    console.log('PhotoGallery resolved URLs:', resolved);
    setSrcs(resolved);
    setFailed({});
  }, [photos]);

  if (photos.length === 0) {
    return <p className="text-gray-500">No photos available</p>;
  }

  const tryAlternate = (index: number) => {
    const photo = photos[index];
    const tried = srcs[index] || '';
    const attempts: string[] = [];
    if (photo.url) {
      // window origin + path
      attempts.push(window.location.origin + photo.url);
      // raw path
      attempts.push(photo.url);
    }
    // keep existing src last
    if (tried) attempts.push(tried);

    const next = attempts.find(a => a !== tried) || attempts[0];
    if (next) {
      const copy = [...srcs];
      copy[index] = next;
      setSrcs(copy);
      setFailed(prev => ({ ...prev, [index]: false }));
      console.log(`PhotoGallery retry[${index}] ->`, next);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:border-primary-500 transition-colors"
            onClick={() => openLightbox(index)}
          >
            <img
              src={srcs[index] || getImageUrl(photo.url)}
              alt={photo.description || 'Photo'}
              className="w-full h-full object-cover"
              onError={(e: any) => {
                console.warn('Image failed to load:', e.currentTarget.src, 'original:', photo.url);
                setFailed(prev => ({ ...prev, [index]: true }));
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs truncate">{photo.category}</p>
            </div>
            {failed[index] && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center p-3">
                <div className="text-center">
                  <p className="text-sm text-gray-700 mb-2">Failed to load image</p>
                  <div className="flex justify-center gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={(ev) => { ev.stopPropagation(); tryAlternate(index); }}>Retry</button>
                    <a className="px-3 py-1 bg-gray-200 text-gray-800 rounded" href={srcs[index] || photo.url} target="_blank" rel="noreferrer" onClick={(ev)=>ev.stopPropagation()}>Open</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <FiX className="h-8 w-8" />
          </button>

          {/* Navigation buttons */}
          {selectedIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <FiChevronLeft className="h-12 w-12" />
            </button>
          )}
          {selectedIndex < photos.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <FiChevronRight className="h-12 w-12" />
            </button>
          )}

          {/* Image */}
          <div className="flex items-center justify-center h-full p-8">
            <div className="max-w-4xl max-h-full">
              <img
                src={getImageUrl(photos[selectedIndex].url)}
                alt={photos[selectedIndex].description || 'Photo'}
                className="max-w-full max-h-full object-contain"
              />
              {photos[selectedIndex].description && (
                <p className="text-white text-center mt-4">{photos[selectedIndex].description}</p>
              )}
            </div>
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
};

