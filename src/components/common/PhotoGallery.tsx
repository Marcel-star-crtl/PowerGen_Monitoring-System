import React, { useState } from 'react';
import { Photo } from '@/types/common.types';
import { getImageUrl } from '@/utils/helpers';
import { Modal } from './Modal';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PhotoGalleryProps {
  photos: Photo[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  if (photos.length === 0) {
    return <p className="text-gray-500">No photos available</p>;
  }

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
              src={getImageUrl(photo.url)}
              alt={photo.description || 'Photo'}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs truncate">{photo.category}</p>
            </div>
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

