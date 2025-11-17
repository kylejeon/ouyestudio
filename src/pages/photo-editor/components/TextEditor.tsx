import { TextItem } from '../page';

interface TextEditorProps {
  texts: TextItem[];
  onUpdateText: (id: string, updates: Partial<TextItem>) => void;
  onDeleteText: (id: string) => void;
}

const fontOptions = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Noto Sans KR', label: '노토 산스' },
  { value: 'Nanum Gothic', label: '나눔고딕' },
  { value: 'Nanum Myeongjo', label: '나눔명조' },
  { value: 'Nanum Pen Script', label: '나눔펜스크립트' },
  { value: 'Cute Font', label: '큐트폰트' },
  { value: 'Jua', label: '주아' },
  { value: 'Sunflower', label: '해바라기' },
  { value: 'Gamja Flower', label: '감자꽃' },
  { value: 'Stylish', label: '스타일리시' },
  { value: 'Poor Story', label: '가난한 이야기' },
  { value: 'Gaegu', label: '개구' },
  { value: 'Do Hyeon', label: '도현' },
  { value: 'Black Han Sans', label: '검은고딕' },
  { value: 'Song Myung', label: '송명' },
  { value: 'Yeon Sung', label: '연성' },
  { value: 'Gowun Batang', label: '고운바탕체' },
  { value: 'Dongle', label: '동글' },
  { value: 'Single Day', label: '싱글데이' }
];

const specialCharacters = [
  '♡', '❤️', '💙', '★', '☆', '♪', '♫', '♬', '♩',
  '☺', '😊', '😍', '😘', '😎', '😢', '😂',
  '♠', '♣', '♦', '♧', '♤', '♢', '♛', '♚',
  '☀', '☁', '☂', '☃', '❄', '⚡', '🌙', '⭐',
  '→', '←', '↑', '↓', '↗', '↖', '↘', '↙',
  '✓', '✗', '✕', '✖', '○', '●', '◯', '◉'
];

export default function TextEditor({ texts, onUpdateText, onDeleteText }: TextEditorProps) {
  const handleAddSpecialChar = (textId: string, char: string) => {
    const text = texts.find(t => t.id === textId);
    if (text) {
      onUpdateText(textId, { text: text.text + char });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">텍스트 편집</h4>
      {texts.map((text, index) => (
        <div key={text.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">텍스트 {index + 1}</span>
            <button
              onClick={() => onDeleteText(text.id)}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
          
          {/* 텍스트 내용 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">내용</label>
            <input
              type="text"
              value={text.text}
              onChange={(e) => onUpdateText(text.id, { text: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              style={{ 
                fontFamily: text.fontFamily,
                fontVariantEmoji: 'emoji'
              }}
            />
          </div>

          {/* 특수문자 선택 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">특수문자</label>
            <div className="grid grid-cols-8 gap-1 p-2 bg-white border border-gray-200 rounded max-h-24 overflow-y-auto">
              {specialCharacters.map((char, charIndex) => (
                <button
                  key={charIndex}
                  onClick={() => handleAddSpecialChar(text.id, char)}
                  className="w-6 h-6 text-sm border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer flex items-center justify-center"
                  title={`특수문자 추가: ${char}`}
                  style={{ 
                    fontVariantEmoji: 'emoji',
                    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif'
                  }}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
          
          {/* 폰트 선택 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">폰트</label>
            <select
              value={text.fontFamily}
              onChange={(e) => onUpdateText(text.id, { fontFamily: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded pr-8"
              style={{ fontFamily: text.fontFamily }}
            >
              {fontOptions.map(font => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 폰트 미리보기 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">미리보기</label>
            <div 
              className="w-full px-2 py-2 text-sm border border-gray-200 rounded bg-white"
              style={{ 
                fontFamily: text.fontFamily,
                fontSize: `${Math.min(text.fontSize, 16)}px`,
                color: text.color,
                fontVariantEmoji: 'emoji'
              }}
            >
              {text.text || '텍스트를 입력하세요'}
            </div>
          </div>
          
          {/* 크기 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">크기: {text.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="48"
              value={text.fontSize}
              onChange={(e) => onUpdateText(text.id, { fontSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          
          {/* 색상 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">색상</label>
            <input
              type="color"
              value={text.color}
              onChange={(e) => onUpdateText(text.id, { color: e.target.value })}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          
          {/* 회전 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">회전: {text.rotation}°</label>
            <input
              type="range"
              min="-180"
              max="180"
              value={text.rotation}
              onChange={(e) => onUpdateText(text.id, { rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
