import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { PhotoItem, TextItem, LayoutTemplate } from '../page';

interface PhotoCanvasProps {
  photos: PhotoItem[];
  texts: TextItem[];
  layout: LayoutTemplate;
  isTextMode: boolean;
  onAddText: (x: number, y: number) => void;
  onUpdatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  onUpdateText: (id: string, updates: Partial<TextItem>) => void;
  showGuides?: boolean;
}

// 디바운스 함수 구현
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const PhotoCanvas = forwardRef<HTMLCanvasElement, PhotoCanvasProps>(({
  photos,
  texts,
  layout,
  isTextMode,
  onAddText,
  onUpdatePhoto,
  onUpdateText,
  showGuides = true
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ type: 'photo' | 'text'; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isRendering, setIsRendering] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 폰트 로딩 확인
  useEffect(() => {
    const checkFonts = async () => {
      try {
        // 폰트가 로드될 때까지 기다림
        await document.fonts.ready;
        setFontsLoaded(true);
      } catch (error) {
        console.error('폰트 로딩 오류:', error);
        setFontsLoaded(true); // 오류가 있어도 렌더링 진행
      }
    };

    checkFonts();
  }, []);

  // 가로 모드인지 확인
  const isHorizontalMode = layout.id === 'horizontal-2';
  
  // 캔버스 크기 설정 - 4x6 인화지 비율 (2:3)에 맞춤
  const CANVAS_WIDTH = isHorizontalMode ? 2400 : 1600;
  const CANVAS_HEIGHT = isHorizontalMode ? 1600 : 2400;
  
  // 모바일 반응형 표시 크기 설정
  const getDisplaySize = () => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    const isTablet = window.innerWidth < 1024; // lg breakpoint
    
    if (isMobile) {
      // 모바일: 화면 너비의 90%에 맞춤
      const maxWidth = Math.min(window.innerWidth * 0.9, 320);
      if (isHorizontalMode) {
        return {
          width: maxWidth,
          height: (maxWidth * 2) / 3  // 가로 모드: 3:2 비율 (가로가 더 김)
        };
      } else {
        return {
          width: maxWidth,
          height: (maxWidth * 3) / 2  // 세로 모드: 2:3 비율 (세로가 더 김)
        };
      }
    } else if (isTablet) {
      // 태블릿: 중간 크기
      if (isHorizontalMode) {
        return { width: 600, height: 400 };  // 3:2 비율 (가로가 더 김)
      } else {
        return { width: 320, height: 480 };  // 2:3 비율
      }
    } else {
      // 데스크톱: 기존 크기
      if (isHorizontalMode) {
        return { width: 600, height: 400 };  // 3:2 비율 (가로가 더 김)
      } else {
        return { width: 400, height: 600 };  // 2:3 비율
      }
    }
  };

  const [displaySize, setDisplaySize] = useState(getDisplaySize());

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setDisplaySize(getDisplaySize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isHorizontalMode]);

  // 레이아웃 변경 시 displaySize 즉시 업데이트
  useEffect(() => {
    setDisplaySize(getDisplaySize());
  }, [isHorizontalMode]);

  // 이미지 로드 및 캐싱
  useEffect(() => {
    const loadImages = async () => {
      const newLoadedImages = new Map<string, HTMLImageElement>();
      
      for (const photo of photos) {
        if (loadedImages.has(photo.id)) {
          newLoadedImages.set(photo.id, loadedImages.get(photo.id)!);
        } else {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = photo.src;
            });
            
            newLoadedImages.set(photo.id, img);
          } catch (error) {
            console.error('이미지 로드 실패:', photo.src);
          }
        }
      }
      
      setLoadedImages(newLoadedImages);
    };

    if (photos.length > 0) {
      loadImages();
    } else {
      setLoadedImages(new Map());
    }
  }, [photos]);

  // 캔버스 렌더링 함수
  const renderCanvasInternal = useCallback(async () => {
    if (isRendering || !canvasRef.current || !fontsLoaded) return;
    
    setIsRendering(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 캔버스 크기 설정
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      // 배경 그리기
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 레이아웃 슬롯 그리기 (가이드)
      if (showGuides) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        layout.slots.forEach((slot) => {
          const x = slot.x * CANVAS_WIDTH;
          const y = slot.y * CANVAS_HEIGHT;
          const width = slot.width * CANVAS_WIDTH;
          const height = slot.height * CANVAS_HEIGHT;
          ctx.strokeRect(x, y, width, height);
        });
      }

      // 사진 렌더링
      for (const photo of photos) {
        const img = loadedImages.get(photo.id);
        if (img && img.complete) {
          ctx.save();

          // 슬롯 영역으로 클리핑
          const slotX = photo.slotX * CANVAS_WIDTH;
          const slotY = photo.slotY * CANVAS_HEIGHT;
          const slotWidth = photo.slotWidth * CANVAS_WIDTH;
          const slotHeight = photo.slotHeight * CANVAS_HEIGHT;

          ctx.beginPath();
          ctx.rect(slotX, slotY, slotWidth, slotHeight);
          ctx.clip();

          // 사진 위치 계산
          const photoX = slotX + slotWidth / 2 + photo.x * slotWidth;
          const photoY = slotY + slotHeight / 2 + photo.y * slotHeight;

          ctx.translate(photoX, photoY);
          ctx.rotate((photo.rotation * Math.PI) / 180);

          // 이미지 크기 계산 - 원본 비율 유지하면서 스케일 적용
          const originalWidth = img.width;
          const originalHeight = img.height;
          
          // 스케일을 적용한 실제 그리기 크기
          const drawWidth = originalWidth * photo.scale;
          const drawHeight = originalHeight * photo.scale;

          // 이미지 품질 최적화
          ctx.imageSmoothingEnabled = photo.scale < 1;
          ctx.imageSmoothingQuality = photo.scale < 1 ? 'low' : 'high';

          // 원본 비율을 유지하면서 이미지 그리기
          ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          ctx.restore();
        }
      }

      // 텍스트 렌더링
      texts.forEach((text) => {
        ctx.save();
        const x = text.x * CANVAS_WIDTH;
        const y = text.y * CANVAS_HEIGHT;

        ctx.translate(x, y);

        // 폰트 설정 - 한글 폰트를 우선으로 설정
        const fontFamily = text.fontFamily === 'Arial' || text.fontFamily === 'serif' || text.fontFamily === 'sans-serif' 
          ? `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", ${text.fontFamily}` 
          : `"${text.fontFamily}", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Malgun Gothic", sans-serif`;

        if (isHorizontalMode) {
          // 세로 텍스트 (가로 모드에서)
          ctx.font = `${text.fontSize * 2}px ${fontFamily}`;
          ctx.fillStyle = text.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const chars = text.text.split('');
          const lineHeight = text.fontSize * 2.4;
          const startY = -(chars.length - 1) * lineHeight / 2;

          chars.forEach((char, index) => {
            ctx.fillText(char, 0, startY + index * lineHeight);
          });
        } else {
          // 가로 텍스트
          ctx.rotate((text.rotation * Math.PI) / 180);
          ctx.font = `${text.fontSize * 2}px ${fontFamily}`;
          ctx.fillStyle = text.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text.text, 0, 0);
        }

        ctx.restore();
      });

    } catch (error) {
      console.error('Canvas rendering error:', error);
    } finally {
      setIsRendering(false);
    }
  }, [photos, texts, layout, loadedImages, isRendering, showGuides, isHorizontalMode, CANVAS_WIDTH, CANVAS_HEIGHT, fontsLoaded]);

  // 디바운싱된 렌더링 함수
  const debouncedRender = useCallback(
    debounce(renderCanvasInternal, 30),
    [renderCanvasInternal]
  );

  useEffect(() => {
    debouncedRender();
    
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [debouncedRender]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTextMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onAddText(x, y);
  };

  const getEventPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        return { x: 0, y: 0 };
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isTextMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getEventPosition(e);

    // 텍스트 클릭 확인
    for (const text of texts) {
      const fontFamily = text.fontFamily === 'Arial' || text.fontFamily === 'serif' || text.fontFamily === 'sans-serif' 
        ? `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", ${text.fontFamily}` 
        : `"${text.fontFamily}", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Malgun Gothic", sans-serif`;
      
      ctx.font = `${text.fontSize * 2}px ${fontFamily}`;
      
      let textWidth, textHeight;
      
      if (isHorizontalMode) {
        const chars = text.text.split('');
        const lineHeight = text.fontSize * 2.4;
        textWidth = (text.fontSize * 2 + 80) / CANVAS_WIDTH;
        textHeight = (chars.length * lineHeight + 80) / CANVAS_HEIGHT;
      } else {
        const textMetrics = ctx.measureText(text.text);
        textWidth = (textMetrics.width + 80) / CANVAS_WIDTH;
        textHeight = (text.fontSize * 2 + 80) / CANVAS_HEIGHT;
      }
      
      if (x >= text.x - textWidth / 2 && x <= text.x + textWidth / 2 &&
          y >= text.y - textHeight / 2 && y <= text.y + textHeight / 2) {
        setIsDragging(true);
        setDragTarget({ type: 'text', id: text.id });
        setDragOffset({
          x: x - text.x,
          y: y - text.y
        });
        e.preventDefault();
        return;
      }
    }

    // 사진 클릭 확인
    for (const photo of photos) {
      const slotX = photo.slotX;
      const slotY = photo.slotY;
      const slotWidth = photo.slotWidth;
      const slotHeight = photo.slotHeight;
      
      if (x >= slotX && x <= slotX + slotWidth &&
          y >= slotY && y <= slotY + slotHeight) {
        setIsDragging(true);
        setDragTarget({ type: 'photo', id: photo.id });
        
        const relativeX = (x - slotX - slotWidth / 2) / slotWidth;
        const relativeY = (y - slotY - slotHeight / 2) / slotHeight;
        
        setDragOffset({
          x: relativeX - photo.x,
          y: relativeY - photo.y
        });
        e.preventDefault();
        return;
      }
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragTarget) return;

    const { x, y } = getEventPosition(e);

    if (dragTarget.type === 'text') {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      onUpdateText(dragTarget.id, { 
        x: Math.max(0, Math.min(1, newX)), 
        y: Math.max(0, Math.min(1, newY)) 
      });
    } else if (dragTarget.type === 'photo') {
      const photo = photos.find(p => p.id === dragTarget.id);
      if (!photo) return;
      
      const slotX = photo.slotX;
      const slotY = photo.slotY;
      const slotWidth = photo.slotWidth;
      const slotHeight = photo.slotHeight;
      
      if (x >= slotX && x <= slotX + slotWidth &&
          y >= slotY && y <= slotY + slotHeight) {
        const relativeX = (x - slotX - slotWidth / 2) / slotWidth;
        const relativeY = (y - slotY - slotHeight / 2) / slotHeight;
        
        const newX = relativeX - dragOffset.x;
        const newY = relativeY - dragOffset.y;
        
        onUpdatePhoto(dragTarget.id, { 
          x: Math.max(-1, Math.min(1, newX)), 
          y: Math.max(-1, Math.min(1, newY)) 
        });
      }
    }

    e.preventDefault();
  };

  const handleEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    setDragTarget(null);
    setDragOffset({ x: 0, y: 0 });
    e.preventDefault();
  };

  return (
    <div className="relative">
      <canvas
        ref={(node) => {
          canvasRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={`border-2 border-gray-300 rounded-lg shadow-lg ${
          isTextMode ? 'cursor-crosshair' : 'cursor-move'
        }`}
        style={{ 
          width: `${displaySize.width}px`,
          height: `${displaySize.height}px`,
          touchAction: 'none'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      
      <div className="mt-2 text-sm text-gray-500 text-center">
        {isTextMode ? '클릭하여 텍스트 추가' : '사진과 텍스트를 드래그하여 위치 조정'}
      </div>
    </div>
  );
});

PhotoCanvas.displayName = 'PhotoCanvas';

export default PhotoCanvas;
