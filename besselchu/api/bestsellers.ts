import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function to fetch bestsellers from Aladin API
 * 알라딘 API는 공식 무료 API입니다.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 알라딘 API - TTB Key가 필요합니다
    // http://www.aladin.co.kr/ttb/wblog_manage.aspx 에서 발급받을 수 있습니다
    const TTB_KEY = process.env.ALADIN_TTB_KEY || 'ttbdidiuniverse1336001'; // 테스트용 키

    const apiUrl = `http://www.aladin.co.kr/ttb/api/ItemList.aspx?ttbkey=${TTB_KEY}&QueryType=Bestseller&MaxResults=20&start=1&SearchTarget=Book&output=js&Version=20131101&Cover=Big`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Aladin API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.errorCode) {
      throw new Error(`Aladin API Error: ${data.errorMessage || data.errorCode}`);
    }

    const items = data.item || [];

    // If no items, use fallback
    if (items.length === 0) {
      throw new Error('No items returned from Aladin API');
    }

    const books = items.slice(0, 10).map((item: any, index: number) => {
      return {
        title: item.title || '',
        author: item.author || '',
        description: item.description || `${index + 1}위 베스트셀러`,
        rank: index + 1,
        keyword: (item.categoryName || '').split('>').pop()?.trim() || '도서',
        isbn: item.isbn13 || item.isbn || '',
        coverUrl: item.cover || '',
        coverDescription: `"${item.title}" book cover`,
      };
    });

    return res.status(200).json({
      books,
      sourceUrls: ['http://www.aladin.co.kr/shop/common/wbest.aspx'],
    });

  } catch (error) {
    console.error('Aladin API error:', error);

    // Fallback data (10 books)
    const fallbackBooks = [
      {
        title: "이해찬 회고록",
        author: "이해찬",
        description: "꿈이 모여 역사가 되다",
        rank: 1,
        keyword: "정치인",
        isbn: "9791191438826",
        coverUrl: "https://image.aladin.co.kr/product/30175/15/cover500/k442839798_1.jpg",
        coverDescription: "이해찬 회고록 book cover"
      },
      {
        title: "눈과 돌멩이",
        author: "위수정 외",
        description: "2026년 제49회 이상문학상 작품집",
        rank: 2,
        keyword: "소설",
        isbn: "9791130674643",
        coverUrl: "https://image.aladin.co.kr/product/38496/16/cover500/k622135312_1.jpg",
        coverDescription: "눈과 돌멩이 book cover"
      },
      {
        title: "괴테는 모든 것을 말했다",
        author: "스즈키 유이",
        description: "제172회 아쿠타가와상 수상작",
        rank: 3,
        keyword: "소설",
        isbn: "9791194530701",
        coverUrl: "https://image.aladin.co.kr/product/37676/59/cover500/k212032349_3.jpg",
        coverDescription: "괴테는 모든 것을 말했다 book cover"
      },
      {
        title: "돈의 방정식",
        author: "모건 하우젤",
        description: "돈을 지위와 성공의 기준, 그 이상으로 다루기 위한 21가지 이야기",
        rank: 4,
        keyword: "재테크",
        isbn: "9791193904671",
        coverUrl: "https://image.aladin.co.kr/product/38325/60/cover500/k952034340_2.jpg",
        coverDescription: "돈의 방정식 book cover"
      },
      {
        title: "떠난 것은 돌아오지 않는다",
        author: "줄리언 반스",
        description: "부커상 수상 작가의 마지막 소설",
        rank: 5,
        keyword: "소설",
        isbn: "9791130681009",
        coverUrl: "https://image.aladin.co.kr/product/38434/78/cover500/k232135794_2.jpg",
        coverDescription: "떠난 것은 돌아오지 않는다 book cover"
      },
      {
        title: "퓨처 셀프",
        author: "벤저민 하디",
        description: "미래의 자신과 연결되어 현재를 변화시키는 방법",
        rank: 6,
        keyword: "자기계발",
        isbn: "9791140710225",
        coverUrl: "https://image.aladin.co.kr/product/32767/61/cover500/k232937637_1.jpg",
        coverDescription: "퓨처 셀프 book cover"
      },
      {
        title: "역행자",
        author: "자청",
        description: "돈과 시간으로부터 자유로워지는 방법",
        rank: 7,
        keyword: "자기계발",
        isbn: "9791168473690",
        coverUrl: "https://image.aladin.co.kr/product/29354/32/cover500/k552835893_1.jpg",
        coverDescription: "역행자 book cover"
      },
      {
        title: "불편한 편의점",
        author: "김호연",
        description: "따뜻한 위로를 전하는 감동 소설",
        rank: 8,
        keyword: "소설",
        isbn: "9788936434267",
        coverUrl: "https://image.aladin.co.kr/product/27338/6/cover500/k222835565_1.jpg",
        coverDescription: "불편한 편의점 book cover"
      },
      {
        title: "트렌드 코리아 2026",
        author: "김난도",
        description: "2026년을 이끌 10가지 트렌드 키워드",
        rank: 9,
        keyword: "트렌드",
        isbn: "9788959897629",
        coverUrl: "https://image.aladin.co.kr/product/34951/47/cover500/k212935465_1.jpg",
        coverDescription: "트렌드 코리아 2026 book cover"
      },
      {
        title: "마흔에 읽는 니체",
        author: "장재형",
        description: "인생의 전환점에서 읽는 니체 철학",
        rank: 10,
        keyword: "철학",
        isbn: "9791156759034",
        coverUrl: "https://image.aladin.co.kr/product/11821/67/cover500/k672434296_1.jpg",
        coverDescription: "마흔에 읽는 니체 book cover"
      }
    ];

    return res.status(200).json({
      books: fallbackBooks,
      sourceUrls: ['http://www.aladin.co.kr/shop/common/wbest.aspx'],
      note: 'Using fallback data due to API error',
    });
  }
}
