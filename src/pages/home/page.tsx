import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // 애드센스 광고 로드
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            오우예 셀프스튜디오 사진 편집기
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            4x6 인화지에 사진을 배치하고 텍스트를 추가하여 나만의 인화 사진을 만들어보세요
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  간편한 사진 편집
                </h2>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <i className="ri-check-line text-green-500 mr-3"></i>
                    1x1, 1x2, 2x2, 3x3 레이아웃 지원
                  </li>
                  <li className="flex items-center">
                    <i className="ri-check-line text-green-500 mr-3"></i>
                    드래그로 사진 위치 조정
                  </li>
                  <li className="flex items-center">
                    <i className="ri-check-line text-green-500 mr-3"></i>
                    텍스트 추가 및 폰트 선택
                  </li>
                  <li className="flex items-center">
                    <i className="ri-check-line text-green-500 mr-3"></i>
                    4x6 인화지 세로 방향
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <div className="w-32 h-48 bg-gray-100 border-2 border-gray-300 rounded-lg mx-auto mb-6 relative overflow-hidden">
                  <div className="absolute inset-2 grid grid-cols-2 gap-1">
                    <div className="bg-blue-200 rounded"></div>
                    <div className="bg-green-200 rounded"></div>
                    <div className="bg-yellow-200 rounded"></div>
                    <div className="bg-pink-200 rounded"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">4x6 인화지 미리보기</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/photo-editor"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-lg"
            >
              <i className="ri-image-edit-line mr-3 text-xl"></i>
              사진 편집 시작하기
            </Link>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-upload-2-line text-blue-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. 사진 업로드</h3>
              <p className="text-gray-600 text-sm">
                JPG, PNG 파일을 드래그하거나 클릭하여 업로드하세요
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-layout-grid-line text-green-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. 레이아웃 선택</h3>
              <p className="text-gray-600 text-sm">
                원하는 레이아웃을 선택하고 사진을 배치하세요
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <i className="ri-printer-line text-purple-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. 인쇄하기</h3>
              <p className="text-gray-600 text-sm">
                편집이 완료되면 인쇄 버튼을 클릭하여 저장하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 광고 영역 */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-4">
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
