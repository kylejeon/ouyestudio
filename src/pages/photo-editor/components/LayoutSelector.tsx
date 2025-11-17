import { LayoutTemplate } from '../page';

interface LayoutSelectorProps {
  layouts: LayoutTemplate[];
  selectedLayout: LayoutTemplate;
  onLayoutChange: (layout: LayoutTemplate) => void;
}

export default function LayoutSelector({ layouts, selectedLayout, onLayoutChange }: LayoutSelectorProps) {
  return (
    <div className="space-y-3">
      {layouts.map((layout) => (
        <button
          key={layout.id}
          onClick={() => onLayoutChange(layout)}
          className={`w-full p-3 rounded-lg border-2 transition-all whitespace-nowrap cursor-pointer ${
            selectedLayout.id === layout.id
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="font-medium">{layout.name}</div>
              <div className="text-xs text-gray-500">
                {layout.slots.length}개 슬롯
              </div>
            </div>
            
            {/* 레이아웃 미리보기 */}
            <div className={`bg-white border border-gray-300 rounded relative overflow-hidden ${
              layout.id === 'horizontal-2' ? 'w-12 h-8' : 'w-8 h-12'
            }`}>
              {layout.slots.map((slot, index) => (
                <div
                  key={index}
                  className="absolute bg-gray-200 border border-gray-400"
                  style={{
                    left: `${slot.x * 100}%`,
                    top: `${slot.y * 100}%`,
                    width: `${slot.width * 100}%`,
                    height: `${slot.height * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </button>
      ))}
      
      <div className="text-xs text-gray-500 mt-3">
        <p>• 레이아웃 변경 시 기존 사진이 초기화됩니다</p>
      </div>
    </div>
  );
}
