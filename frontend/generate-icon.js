/**
 * 대출 계산기 앱 아이콘 생성 스크립트
 * sharp 라이브러리로 SVG → PNG 변환
 * 실행: node generate-icon.js
 */
const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const OUT_DIR = path.join(__dirname, 'assets');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

// ──────────────────────────────────────────────────
//  SVG 디자인 (1024×1024)
//  컨셉: 깊은 인디고 그라데이션 배경
//         중앙 흰색 건물(은행/집) + 원화 기호 원
// ──────────────────────────────────────────────────
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- 배경 그라데이션 -->
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#5C6BC0"/>
      <stop offset="100%" stop-color="#1A237E"/>
    </linearGradient>

    <!-- 빛나는 원 그라데이션 -->
    <radialGradient id="glow" cx="50%" cy="45%" r="45%">
      <stop offset="0%"   stop-color="#7986CB" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#1A237E"  stop-opacity="0"/>
    </radialGradient>

    <!-- 원화 배지 그라데이션 -->
    <linearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FFB300"/>
      <stop offset="100%" stop-color="#E65100"/>
    </linearGradient>
  </defs>

  <!-- 배경 -->
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>

  <!-- ───── 건물 본체 ───── -->
  <!-- 건물 그림자 (약간 오프셋) -->
  <rect x="268" y="462" width="490" height="368" rx="16" fill="#0D1B6E" opacity="0.35"/>

  <!-- 기둥 (건물 전면) -->
  <rect x="260" y="455" width="506" height="375" rx="14" fill="white"/>

  <!-- 건물 상단 가로 바 -->
  <rect x="240" y="420" width="546" height="54" rx="12" fill="white"/>

  <!-- 삼각 지붕 -->
  <polygon points="512,195  220,428  804,428" fill="white"/>

  <!-- 지붕 꼭대기 장식 -->
  <rect x="497" y="170" width="30" height="52" rx="6" fill="white"/>
  <rect x="479" y="155" width="66" height="24" rx="8" fill="white"/>

  <!-- 건물 내부 칸막이 선 -->
  <rect x="258" y="455" width="4" height="375" rx="2" fill="#E8EAF6" opacity="0.8"/>
  <rect x="762" y="455" width="4" height="375" rx="2" fill="#E8EAF6" opacity="0.8"/>

  <!-- 창문 1열 (3개) -->
  <rect x="302" y="492" width="100" height="80" rx="10" fill="#C5CAE9"/>
  <rect x="462" y="492" width="100" height="80" rx="10" fill="#C5CAE9"/>
  <rect x="622" y="492" width="100" height="80" rx="10" fill="#C5CAE9"/>

  <!-- 창문 내부 십자 (디테일) -->
  <rect x="350" y="492" width="4"  height="80" rx="2" fill="#9FA8DA"/>
  <rect x="302" y="531" width="100" height="4" rx="2" fill="#9FA8DA"/>
  <rect x="510" y="492" width="4"  height="80" rx="2" fill="#9FA8DA"/>
  <rect x="462" y="531" width="100" height="4" rx="2" fill="#9FA8DA"/>
  <rect x="670" y="492" width="4"  height="80" rx="2" fill="#9FA8DA"/>
  <rect x="622" y="531" width="100" height="4" rx="2" fill="#9FA8DA"/>

  <!-- 중앙 출입문 -->
  <rect x="437" y="620" width="152" height="212" rx="76" fill="#3F51B5"/>
  <rect x="437" y="620" width="152" height="160" rx="12" fill="#3F51B5"/>

  <!-- 문 손잡이 -->
  <circle cx="575" cy="718" r="10" fill="#7986CB"/>

  <!-- 계단 -->
  <rect x="400" y="825" width="226" height="8"  rx="4" fill="#E8EAF6"/>
  <rect x="370" y="818" width="286" height="10" rx="5" fill="#E8EAF6"/>

  <!-- ───── 원화(₩) 배지 ───── -->
  <circle cx="766" cy="262" r="112" fill="url(#badge)" opacity="0.97"/>
  <circle cx="766" cy="262" r="112" fill="none" stroke="white" stroke-width="6" opacity="0.5"/>

  <!-- ₩ 텍스트 -->
  <text
    x="766" y="303"
    text-anchor="middle"
    font-size="110"
    font-weight="900"
    fill="white"
    font-family="Arial Black, Arial, sans-serif"
    letter-spacing="-4"
  >₩</text>

  <!-- ───── 하단 그래프 바 (계산기 느낌) ───── -->
  <rect x="130" y="895" width="60" height="55" rx="8" fill="white" opacity="0.2"/>
  <rect x="210" y="872" width="60" height="78" rx="8" fill="white" opacity="0.25"/>
  <rect x="290" y="850" width="60" height="100" rx="8" fill="white" opacity="0.18"/>

  <rect x="674" y="850" width="60" height="100" rx="8" fill="white" opacity="0.18"/>
  <rect x="754" y="872" width="60" height="78" rx="8" fill="white" opacity="0.25"/>
  <rect x="834" y="895" width="60" height="55" rx="8" fill="white" opacity="0.2"/>
</svg>
`;

async function generate() {
  try {
    // 1024×1024 icon.png
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(OUT_DIR, 'icon.png'));
    console.log('✅ assets/icon.png 생성 완료 (1024×1024)');

    // splash.png (2048×2048 권장)
    const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" width="2048" height="2048">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="2048" y2="2048" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#5C6BC0"/>
      <stop offset="100%" stop-color="#1A237E"/>
    </linearGradient>
  </defs>
  <rect width="2048" height="2048" fill="url(#bg2)"/>
  <text x="1024" y="950"  text-anchor="middle" font-size="220" font-weight="900"
        fill="white" font-family="Arial Black, Arial" opacity="0.95">🏦</text>
  <text x="1024" y="1180" text-anchor="middle" font-size="130" font-weight="800"
        fill="white" font-family="Arial Black, Arial">대출 계산기</text>
  <text x="1024" y="1300" text-anchor="middle" font-size="64" font-weight="400"
        fill="#9FA8DA" font-family="Arial, sans-serif">Loan Calculator</text>
</svg>`;

    await sharp(Buffer.from(splashSvg))
      .png()
      .toFile(path.join(OUT_DIR, 'splash.png'));
    console.log('✅ assets/splash.png 생성 완료 (2048×2048)');

    // adaptive-icon.png (foreground, 1024×1024, 중앙 아이콘만)
    const adaptiveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#5C6BC0"/>
      <stop offset="100%" stop-color="#1A237E"/>
    </linearGradient>
    <linearGradient id="badge3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FFB300"/>
      <stop offset="100%" stop-color="#E65100"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg3)"/>

  <!-- 건물 그림자 -->
  <rect x="268" y="462" width="490" height="368" rx="16" fill="#0D1B6E" opacity="0.35"/>
  <rect x="260" y="455" width="506" height="375" rx="14" fill="white"/>
  <rect x="240" y="420" width="546" height="54" rx="12" fill="white"/>
  <polygon points="512,195  220,428  804,428" fill="white"/>
  <rect x="497" y="170" width="30" height="52" rx="6" fill="white"/>
  <rect x="479" y="155" width="66" height="24" rx="8" fill="white"/>
  <rect x="302" y="492" width="100" height="80" rx="10" fill="#C5CAE9"/>
  <rect x="462" y="492" width="100" height="80" rx="10" fill="#C5CAE9"/>
  <rect x="622" y="492" width="100" height="80" rx="10" fill="#C5CAE9"/>
  <rect x="350" y="492" width="4"  height="80" rx="2" fill="#9FA8DA"/>
  <rect x="302" y="531" width="100" height="4" rx="2" fill="#9FA8DA"/>
  <rect x="510" y="492" width="4"  height="80" rx="2" fill="#9FA8DA"/>
  <rect x="462" y="531" width="100" height="4" rx="2" fill="#9FA8DA"/>
  <rect x="670" y="492" width="4"  height="80" rx="2" fill="#9FA8DA"/>
  <rect x="622" y="531" width="100" height="4" rx="2" fill="#9FA8DA"/>
  <rect x="437" y="620" width="152" height="212" rx="76" fill="#3F51B5"/>
  <rect x="437" y="620" width="152" height="160" rx="12" fill="#3F51B5"/>
  <circle cx="575" cy="718" r="10" fill="#7986CB"/>
  <rect x="400" y="825" width="226" height="8"  rx="4" fill="#E8EAF6"/>
  <rect x="370" y="818" width="286" height="10" rx="5" fill="#E8EAF6"/>
  <circle cx="766" cy="262" r="112" fill="url(#badge3)" opacity="0.97"/>
  <circle cx="766" cy="262" r="112" fill="none" stroke="white" stroke-width="6" opacity="0.5"/>
  <text x="766" y="303" text-anchor="middle" font-size="110" font-weight="900"
        fill="white" font-family="Arial Black, Arial, sans-serif" letter-spacing="-4">₩</text>
</svg>`;

    await sharp(Buffer.from(adaptiveSvg))
      .png()
      .toFile(path.join(OUT_DIR, 'adaptive-icon.png'));
    console.log('✅ assets/adaptive-icon.png 생성 완료 (1024×1024)');

    console.log('\n📁 생성된 파일:');
    const { readdirSync, statSync } = require('fs');
    readdirSync(OUT_DIR).forEach(f => {
      const size = (statSync(path.join(OUT_DIR, f)).size / 1024).toFixed(1);
      console.log(`   assets/${f}  (${size} KB)`);
    });

  } catch (err) {
    console.error('❌ 생성 실패:', err.message);
    process.exit(1);
  }
}

generate();
