import { useState, useRef, useCallback, useEffect } from 'react';
import PhotoCanvas from './components/PhotoCanvas';
import PhotoUploader from './components/PhotoUploader';
import LayoutSelector from './components/LayoutSelector';
import TextEditor from './components/TextEditor';

export interface PhotoItem {
  id: string;
  src: string;
  x: number; // 슬롯 내에서의 상대적 위치 (-0.5 ~ 0.5)
  y: number; // 슬롯 내에서의 상대적 위치 (-0.5 ~ 0.5)
  width: number;
  height: number;
  rotation: number;
  scale: number; // 확대/축소 비율
  slotX: number; // 슬롯의 절대 위치
  slotY: number;
  slotWidth: number; // 슬롯의 크기
  slotHeight: number;
}

export interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  slots: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

const layouts: LayoutTemplate[] = [
  {
    id: 'single',
    name: '1x1 (1장)',
    slots: [{ x: 0.02, y: 0.02, width: 0.96, height: 0.96 }],
  },
  {
    id: 'vertical-2',
    name: '1x2 세로 (2장)',
    slots: [
      { x: 0.05, y: 0.025, width: 0.9, height: 0.41 },
      { x: 0.05, y: 0.465, width: 0.9, height: 0.41 },
    ],
  },
  {
    id: 'horizontal-2',
    name: '1x2 가로 (2장)',
    slots: [
      { x: 0.025, y: 0.02, width: 0.4375, height: 0.96 },
      { x: 0.4875, y: 0.02, width: 0.4375, height: 0.96 },
    ],
  },
  {
    id: 'grid-4',
    name: '2x2 (4장)',
    slots: [
      { x: 0.025, y: 0.025, width: 0.4625, height: 0.4125 },
      { x: 0.5125, y: 0.025, width: 0.4625, height: 0.4125 },
      { x: 0.025, y: 0.4625, width: 0.4625, height: 0.4125 },
      { x: 0.5125, y: 0.4625, width: 0.4625, height: 0.4125 },
    ],
  },
  {
    id: 'grid-9',
    name: '3x3 (9장)',
    slots: [
      { x: 0.025, y: 0.025, width: 0.3, height: 0.27 },
      { x: 0.35, y: 0.025, width: 0.3, height: 0.27 },
      { x: 0.675, y: 0.025, width: 0.3, height: 0.27 },
      { x: 0.025, y: 0.32, width: 0.3, height: 0.27 },
      { x: 0.35, y: 0.32, width: 0.3, height: 0.27 },
      { x: 0.675, y: 0.32, width: 0.3, height: 0.27 },
      { x: 0.025, y: 0.615, width: 0.3, height: 0.27 },
      { x: 0.35, y: 0.615, width: 0.3, height: 0.27 },
      { x: 0.675, y: 0.615, width: 0.3, height: 0.27 },
    ],
  },
];

export default function PhotoEditor() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutTemplate>(layouts[0]);
  const [isTextMode, setIsTextMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePhotoUpload = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const currentPhotoCount = photos.length;
            const slot = selectedLayout.slots[currentPhotoCount + index];
            if (slot) {
              const img = new Image();
              img.onload = () => {
                // 3x3 레이아웃의 경우 이미지 압축 처리
                let finalImageSrc = e.target?.result as string;
                let finalImageWidth = img.width;
                let finalImageHeight = img.height;
                
                if (selectedLayout.id === 'grid-9') {
                  // 3x3 레이아웃에서만 이미지 압축
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                    // 최대 크기 설정 (화질 유지하면서 용량 감소)
                    const maxWidth = 1200;
                    const maxHeight = 1200;
                    
                    let { width, height } = img;
                    
                    // 비율 유지하면서 크기 조정
                    if (width > maxWidth || height > maxHeight) {
                      const ratio = Math.min(maxWidth / width, maxHeight / height);
                      width = width * ratio;
                      height = height * ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 고품질 리샘플링 설정
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // 이미지 그리기
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 압축된 이미지로 변환 (품질 0.85로 설정)
                    finalImageSrc = canvas.toDataURL('image/jpeg', 0.85);
                    
                    // 압축된 이미지의 실제 크기 업데이트
                    finalImageWidth = width;
                    finalImageHeight = height;
                  }
                }

                // 스케일 계산 로직 개선
                let optimalScale;
                
                if (selectedLayout.id === 'single') {
                  // 1x1 레이아웃: 4x6 인화지 비율 (2:3) 고려
                  // 캔버스 크기: 1600x2400 (2:3 비율)
                  const canvasWidth = 1600;
                  const canvasHeight = 2400;
                  const frameWidth = slot.width * canvasWidth;
                  const frameHeight = slot.height * canvasHeight;
                  
                  // 이미지가 프레임을 완전히 채우도록 하되, 원본 비율 유지
                  const scaleX = frameWidth / finalImageWidth;
                  const scaleY = frameHeight / finalImageHeight;
                  
                  // 더 큰 스케일을 사용하여 프레임을 완전히 채움 (crop 효과)
                  optimalScale = Math.max(scaleX, scaleY);
                } else {
                  // 다른 레이아웃들의 기존 로직 유지
                  const frameAspectRatio = slot.width / slot.height;
                  const imageAspectRatio = finalImageWidth / finalImageHeight;

                  if (imageAspectRatio > frameAspectRatio) {
                    optimalScale =
                      (slot.width *
                        (selectedLayout.id === 'horizontal-2' ? 2400 : 1600)) /
                      finalImageWidth;
                  } else {
                    optimalScale =
                      (slot.height *
                        (selectedLayout.id === 'horizontal-2' ? 1600 : 2400)) /
                      finalImageHeight;
                  }
                }

                const newPhoto: PhotoItem = {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
                  src: finalImageSrc,
                  x: 0,
                  y: 0,
                  width: slot.width,
                  height: slot.height,
                  rotation: 0,
                  scale: optimalScale,
                  slotX: slot.x,
                  slotY: slot.y,
                  slotWidth: slot.width,
                  slotHeight: slot.height,
                };
                setPhotos((prev) => [...prev, newPhoto]);
              };
              img.src = e.target?.result as string;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [selectedLayout, photos.length],
  );

  const handleAddText = useCallback(
    (x?: number, y?: number) => {
      const newText: TextItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: '텍스트를 입력하세요',
        x:
          x !== undefined
            ? x / (isHorizontalMode ? 600 : 400)
            : 0.5,
        y:
          y !== undefined
            ? y / (isHorizontalMode ? 400 : 600)
            : 0.5,
        fontSize: 30,
        fontFamily: 'Arial',
        color: '#000000',
        rotation: 0,
      };
      setTexts((prev) => [...prev, newText]);
    },
    [selectedLayout],
  );

  const isHorizontalMode = selectedLayout.id === 'horizontal-2';

  const handleUpdatePhoto = useCallback((id: string, updates: Partial<PhotoItem>) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo)),
    );
  }, []);

  const handleFitPhoto = useCallback(
    (id: string) => {
      const photo = photos.find((p) => p.id === id);
      if (!photo) return;

      const img = new Image();
      img.onload = () => {
        // 3x3 레이아웃의 경우 압축된 이미지 크기를 고려
        let imageWidth = img.width;
        let imageHeight = img.height;
        
        if (selectedLayout.id === 'grid-9') {
          // 압축된 이미지의 실제 크기 계산
          const maxWidth = 1200;
          const maxHeight = 1200;
          
          if (img.width > maxWidth || img.height > maxHeight) {
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            imageWidth = img.width * ratio;
            imageHeight = img.height * ratio;
          }
        }

        let optimalScale;
        
        if (selectedLayout.id === 'single') {
          // 1x1 레이아웃: 4x6 인화지 비율 (2:3) 고려
          const canvasWidth = 1600;
          const canvasHeight = 2400;
          const frameWidth = photo.slotWidth * canvasWidth;
          const frameHeight = photo.slotHeight * canvasHeight;
          
          // 이미지가 프레임을 완전히 채우도록 하되, 원본 비율 유지
          const scaleX = frameWidth / imageWidth;
          const scaleY = frameHeight / imageHeight;
          
          // 더 큰 스케일을 사용하여 프레임을 완전히 채움 (crop 효과)
          optimalScale = Math.max(scaleX, scaleY);
        } else {
          // 다른 레이아웃들의 기존 로직 유지
          const frameAspectRatio = photo.slotWidth / photo.slotHeight;
          const imageAspectRatio = imageWidth / imageHeight;

          if (imageAspectRatio > frameAspectRatio) {
            optimalScale =
              (photo.slotWidth *
                (selectedLayout.id === 'horizontal-2' ? 2400 : 1600)) /
              imageWidth;
          } else {
            optimalScale =
              (photo.slotHeight *
                (selectedLayout.id === 'horizontal-2' ? 1600 : 2400)) /
              imageHeight;
          }
        }

        handleUpdatePhoto(id, {
          scale: optimalScale,
          x: 0,
          y: 0,
        });
      };
      img.src = photo.src;
    },
    [photos, selectedLayout, handleUpdatePhoto],
  );

  const handleApplyScaleToAll = useCallback(
    (sourceId: string) => {
      const sourcePhoto = photos.find((p) => p.id === sourceId);
      if (!sourcePhoto) return;

      // 배치 업데이트를 위해 모든 변경사항을 한 번에 적용
      const updatedPhotos = photos.map((photo) => {
        if (photo.id !== sourceId) {
          return {
            ...photo,
            scale: sourcePhoto.scale,
          };
        }
        return photo;
      });

      // 한 번에 모든 사진 업데이트
      setPhotos(updatedPhotos);
    },
    [photos],
  );

  const handleUpdateText = useCallback((id: string, updates: Partial<TextItem>) => {
    setTexts((prev) =>
      prev.map((text) => (text.id === id ? { ...text, ...updates } : text)),
    );
  }, []);

  const handleDeletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  }, []);

  const handleDeleteText = useCallback((id: string) => {
    setTexts((prev) => prev.filter((text) => text.id !== id));
  }, []);

  const handleLayoutChange = useCallback((layout: LayoutTemplate) => {
    setSelectedLayout(layout);
    setPhotos([]);
    setTexts([]);
  }, []);

  const handlePrint = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const dpr = window.devicePixelRatio || 1;
      const CANVAS_WIDTH = isHorizontalMode ? 2400 : 1600;
      const CANVAS_HEIGHT = isHorizontalMode ? 1600 : 2400;

      // 1x2 가로 레이아웃의 경우 세로 용지에 맞게 캔버스 크기 조정
      let finalCanvasWidth, finalCanvasHeight;
      if (isHorizontalMode) {
        finalCanvasWidth = 1600;  // 세로 용지 너비
        finalCanvasHeight = 2400; // 세로 용지 높이
      } else {
        finalCanvasWidth = CANVAS_WIDTH;
        finalCanvasHeight = CANVAS_HEIGHT;
      }

      // 캔버스 크기를 최종 출력 크기로 설정
      canvas.width = finalCanvasWidth;
      canvas.height = finalCanvasHeight;

      ctx.clearRect(0, 0, finalCanvasWidth, finalCanvasHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);

      // 사진 렌더링을 위한 Promise 배열
      const photoPromises = photos.map((photo) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.save();

            // 1x2 가로 레이아웃의 경우 90도 회전
            if (isHorizontalMode) {
              ctx.translate(finalCanvasWidth / 2, finalCanvasHeight / 2);
              ctx.rotate(Math.PI / 2);
              ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
            }

            const slotX = photo.slotX * CANVAS_WIDTH;
            const slotY = photo.slotY * CANVAS_HEIGHT;
            const slotWidth = photo.slotWidth * CANVAS_WIDTH;
            const slotHeight = photo.slotHeight * CANVAS_HEIGHT;

            ctx.beginPath();
            ctx.rect(slotX, slotY, slotWidth, slotHeight);
            ctx.clip();

            const photoX = slotX + slotWidth / 2 + photo.x * slotWidth;
            const photoY = slotY + slotHeight / 2 + photo.y * slotHeight;

            ctx.translate(photoX, photoY);
            ctx.rotate((photo.rotation * Math.PI) / 180);

            const drawWidth = img.width * photo.scale;
            const drawHeight = img.height * photo.scale;

            ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            ctx.restore();
            resolve();
          };
          img.onerror = () => resolve(); // 에러가 발생해도 계속 진행
          img.src = photo.src;
        });
      });

      // 모든 사진이 로드된 후 텍스트 렌더링 및 저장
      Promise.all(photoPromises).then(() => {
        // 텍스트 렌더링
        texts.forEach((text) => {
          ctx.save();

          // 1x2 가로 레이아웃의 경우 90도 회전
          if (isHorizontalMode) {
            ctx.translate(finalCanvasWidth / 2, finalCanvasHeight / 2);
            ctx.rotate(Math.PI / 2);
            ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
          }

          const x = text.x * CANVAS_WIDTH;
          const y = text.y * CANVAS_HEIGHT;

          ctx.translate(x, y);

          if (isHorizontalMode) {
            // 세로 텍스트 (가로 모드에서)
            ctx.font = `${text.fontSize * 2}px ${text.fontFamily}, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
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
            ctx.font = `${text.fontSize * 2}px ${text.fontFamily}, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
            ctx.fillStyle = text.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text.text, 0, 0);
          }

          ctx.restore();
        });

        // 파일 다운로드
        setTimeout(() => {
          const link = document.createElement('a');
          link.download = '인화사진.png';
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();

          // 원본 캔버스 상태 복원
          canvas.width = CANVAS_WIDTH;
          canvas.height = CANVAS_HEIGHT;
          ctx.putImageData(imageData, 0, 0);
        }, 100);
      });
    }
  }, [photos, texts, isHorizontalMode]);

  const handleSystemPrint = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 현재 캔버스 상태 저장
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 캔버스 크기 상수 정의
      const CANVAS_WIDTH = isHorizontalMode ? 2400 : 1600;
      const CANVAS_HEIGHT = isHorizontalMode ? 1600 : 2400;

      // 1x2 가로 레이아웃의 경우 인쇄용 캔버스 크기를 세로로 설정
      let printCanvasWidth, printCanvasHeight;
      if (isHorizontalMode) {
        // 가로 레이아웃을 세로 용지에 인쇄하기 위해 90도 회전
        printCanvasWidth = 1600;  // 세로 용지 너비
        printCanvasHeight = 2400; // 세로 용지 높이
      } else {
        printCanvasWidth = CANVAS_WIDTH;
        printCanvasHeight = CANVAS_HEIGHT;
      }

      // 캔버스 크기를 인쇄용으로 설정
      canvas.width = printCanvasWidth;
      canvas.height = printCanvasHeight;

      // 캔버스 초기화 및 고해상도 렌더링
      ctx.clearRect(0, 0, printCanvasWidth, printCanvasHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, printCanvasWidth, printCanvasHeight);

      const renderAndPrint = () => {
        // 1x2 가로 레이아웃의 경우 90도 회전하여 렌더링
        if (isHorizontalMode) {
          ctx.save();
          // 캔버스 중심으로 이동 후 90도 회전
          ctx.translate(printCanvasWidth / 2, printCanvasHeight / 2);
          ctx.rotate(Math.PI / 2);
          ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
        }

        // 텍스트 그리기
        texts.forEach((text) => {
          ctx.save();
          const x = text.x * CANVAS_WIDTH;
          const y = text.y * CANVAS_HEIGHT;

          ctx.translate(x, y);

          if (isHorizontalMode) {
            ctx.font = `${text.fontSize * 2}px ${text.fontFamily}, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
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
            ctx.rotate((text.rotation * Math.PI) / 180);
            ctx.font = `${text.fontSize * 2}px ${text.fontFamily}, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
            ctx.fillStyle = text.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text.text, 0, 0);
          }

          ctx.restore();
        });

        // 1x2 가로 레이아웃의 경우 회전 상태 복원
        if (isHorizontalMode) {
          ctx.restore();
        }

        // 캔버스를 이미지로 변환하여 임시 이미지 엘리먼트 생성
        const imageUrl = canvas.toDataURL('image/png', 1.0);

        // 기존 인쇄용 요소들 모두 제거
        const existingElements = document.querySelectorAll('[id^="print-"]');
        existingElements.forEach((el) => el.remove());

        // 인쇄용 이미지 엘리먼트 생성 (단 하나만)
        const printImage = document.createElement('img');
        printImage.id = 'print-image-single';
        printImage.src = imageUrl;
        printImage.style.cssText = `
          position: fixed;
          top: -9999px;
          left: -9999px;
          width: 100%;
          height: auto;
          z-index: 9999;
          display: none;
        `;

        // 인쇄용 스타일 추가
        const printStyle = document.createElement('style');
        printStyle.id = 'print-style-single';
        printStyle.textContent = `
          @media print {
            body * {
              visibility: hidden !important;
              display: none !important;
            }
            #print-image-single {
              visibility: visible !important;
              display: block !important;
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: auto !important;
              max-width: none !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 0 !important;
              page-break-inside: avoid;
              z-index: 99999 !important;
            }
            @page {
              margin: 0;
              size: portrait;
            }
          }
        `;

        // DOM에 추가
        document.head.appendChild(printStyle);
        document.body.appendChild(printImage);

        // 이미지 로드 완료 후 인쇄
        printImage.onload = () => {
          setTimeout(() => {
            window.print();

            // 인쇄 후 정리
            setTimeout(() => {
              printImage.remove();
              printStyle.remove();
              // 원본 캔버스 상태 복원
              canvas.width = CANVAS_WIDTH;
              canvas.height = CANVAS_HEIGHT;
              ctx.putImageData(imageData, 0, 0);
            }, 1000);
          }, 100);
        };
      };

      if (photos.length === 0) {
        renderAndPrint();
        return;
      }

      // 사진 로드 및 그리기 - 한 번만 처리
      let loadedCount = 0;
      const totalPhotos = photos.length;

      photos.forEach((photo) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();

          // 1x2 가로 레이아웃의 경우 90도 회전
          if (isHorizontalMode) {
            ctx.translate(printCanvasWidth / 2, printCanvasHeight / 2);
            ctx.rotate(Math.PI / 2);
            ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);
          }

          const slotX = photo.slotX * CANVAS_WIDTH;
          const slotY = photo.slotY * CANVAS_HEIGHT;
          const slotWidth = photo.slotWidth * CANVAS_WIDTH;
          const slotHeight = photo.slotHeight * CANVAS_HEIGHT;

          ctx.beginPath();
          ctx.rect(slotX, slotY, slotWidth, slotHeight);
          ctx.clip();

          const photoX = slotX + slotWidth / 2 + photo.x * slotWidth;
          const photoY = slotY + slotHeight / 2 + photo.y * slotHeight;

          ctx.translate(photoX, photoY);
          ctx.rotate((photo.rotation * Math.PI) / 180);

          const drawWidth = img.width * photo.scale;
          const drawHeight = img.height * photo.scale;

          ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          ctx.restore();

          loadedCount++;
          if (loadedCount === totalPhotos) {
            renderAndPrint();
          }
        };
        img.onerror = () => {
          console.error('이미지 로드 실패:', photo.src);
          loadedCount++;
          if (loadedCount === totalPhotos) {
            renderAndPrint();
          }
        };
        img.src = photo.src;
      });
    }
  }, [photos, texts, isHorizontalMode]);

  const handleTextModeToggle = useCallback(() => {
    // 텍스트 추가 버튼 클릭 시 기본 30px 텍스트 생성하고 사진 편집 모드로 전환
    handleAddText();
    setIsTextMode(false);
  }, [handleAddText]);

  useEffect(() => {
    // 애드센스 광고 로드
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-gray-900">
              오우예 셀프스튜디오 사진 편집기
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handlePrint}
                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer text-sm sm:text-base"
              >
                <i className="ri-download-line mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">파일로 저장하기</span>
                <span className="sm:hidden">저장</span>
              </button>
              <button
                onClick={handleSystemPrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer text-sm sm:text-base"
              >
                <i className="ri-printer-line mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">인쇄하기</span>
                <span className="sm:hidden">인쇄</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽 도구 패널 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 레이아웃 선택 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">레이아웃 선택</h3>
              <LayoutSelector
                layouts={layouts}
                selectedLayout={selectedLayout}
                onLayoutChange={handleLayoutChange}
              />
            </div>

            {/* 사진 업로드 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">사진 업로드</h3>
              <PhotoUploader onUpload={handlePhotoUpload} />
            </div>

            {/* 모드 전환 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">편집 모드</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setIsTextMode(false)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    !isTextMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="ri-image-line mr-2"></i>
                  사진 편집
                </button>
                <button
                  onClick={handleTextModeToggle}
                  className="w-full px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <i className="ri-text mr-2"></i>
                  텍스트 추가
                </button>
              </div>
            </div>
          </div>

          {/* 중앙 캔버스 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">{selectedLayout.name}</h3>
              <div className="flex justify-center">
                <PhotoCanvas
                  ref={canvasRef}
                  photos={photos}
                  texts={texts}
                  layout={selectedLayout}
                  isTextMode={isTextMode}
                  onAddText={handleAddText}
                  onUpdatePhoto={handleUpdatePhoto}
                  onUpdateText={handleUpdateText}
                  showGuides={true}
                />
              </div>
            </div>
          </div>

          {/* 오른쪽 편집 패널 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">편집 도구</h3>

              {/* 사진 목록 */}
              {photos.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2 text-gray-700">사진 목록</h4>
                  <div className="space-y-2">
                    {photos
                      .sort((a, b) => {
                        if (Math.abs(a.slotY - b.slotY) < 0.01) {
                          return a.slotX - b.slotX;
                        }
                        return a.slotY - b.slotY;
                      })
                      .map((photo, index) => (
                        <div key={photo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">사진 {index + 1}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdatePhoto(photo.id, { scale: photo.scale + 0.01 })}
                              className="text-blue-500 hover:text-blue-700 cursor-pointer"
                              title="확대"
                            >
                              <i className="ri-zoom-in-line"></i>
                            </button>
                            <button
                              onClick={() =>
                                handleUpdatePhoto(photo.id, { scale: Math.max(photo.scale - 0.01, 0.01) })
                              }
                              className="text-blue-500 hover:text-blue-700 cursor-pointer"
                              title="축소"
                            >
                              <i className="ri-zoom-out-line"></i>
                            </button>
                            <button
                              onClick={() => handleApplyScaleToAll(photo.id)}
                              className="text-purple-500 hover:text-purple-700 cursor-pointer"
                              title="모든 사진에 동일한 확대율 적용"
                            >
                              <i className="ri-search-line"></i>
                            </button>
                            <button
                              onClick={() => handleFitPhoto(photo.id)}
                              className="text-green-500 hover:text-green-700 cursor-pointer"
                              title="프레임에 맞춤"
                            >
                              <i className="ri-restart-line"></i>
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 텍스트 편집 */}
              {texts.length > 0 && (
                <TextEditor texts={texts} onUpdateText={handleUpdateText} onDeleteText={handleDeleteText} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 광고 영역 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center text-xs text-gray-400 mb-2">Advertisement</div>
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-9037816875196395"
               data-ad-slot="auto"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
      </div>
    </div>
  );
}
