import 'dotenv/config';
import { readFileSync } from 'fs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client';

// 앱(PrismaService)과 동일하게 driver adapter 로 접속 (Prisma 7)
const url = new URL(process.env.DATABASE_URL as string);
const dbCaPath = process.env.DB_SSL_CA_PATH;
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: dbCaPath
    ? { ca: readFileSync(dbCaPath), rejectUnauthorized: true }
    : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

/**
 * 스킬 카테고리 → 스킬 목록 시드 데이터
 * 백엔드 / 프론트엔드 / 디자이너 / PM 이 쓸 법한 언어·프레임워크·툴 등을 카테고리로 정리
 * (Skill.name 은 전역 unique 이므로 카테고리 간 중복 없이 배치)
 */
const SKILL_SEED: Record<string, string[]> = {
  '프로그래밍 언어': [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'Kotlin',
    'Go',
    'Swift',
    'C',
    'C++',
    'C#',
    'PHP',
    'Ruby',
    'Dart',
    'Rust',
    'SQL',
    'HTML/CSS',
  ],
  '프레임워크·라이브러리': [
    'React',
    'Next.js',
    'Vue.js',
    'Nuxt.js',
    'Angular',
    'Svelte',
    'Node.js',
    'NestJS',
    'Express',
    'Spring Boot',
    'Spring',
    'Django',
    'FastAPI',
    'Flask',
    'Flutter',
    'React Native',
    'Redux',
    'Zustand',
    'React Query',
    'Tailwind CSS',
    'Styled Components',
    'jQuery',
  ],
  데이터베이스: [
    'MySQL',
    'PostgreSQL',
    'MariaDB',
    'MongoDB',
    'Redis',
    'Oracle',
    'Elasticsearch',
    'DynamoDB',
    'Prisma',
    'TypeORM',
  ],
  '데브옵스·인프라': [
    'Docker',
    'Kubernetes',
    'AWS',
    'GCP',
    'Azure',
    'Nginx',
    'Jenkins',
    'GitHub Actions',
    'Terraform',
    'Vercel',
    'Netlify',
    'Kafka',
  ],
  '버전 관리': ['Git', 'GitHub', 'GitLab', 'Bitbucket'],
  '디자인 툴': [
    'Figma',
    'Sketch',
    'Adobe XD',
    'Photoshop',
    'Illustrator',
    'After Effects',
    'Premiere Pro',
    'Zeplin',
    'Framer',
    'ProtoPie',
  ],
  '협업 툴': [
    'Slack',
    'Notion',
    'Jira',
    'Confluence',
    'Trello',
    'Asana',
    'Discord',
    'Zoom',
    'Google Workspace',
    'Microsoft Teams',
  ],
  '기획·데이터 분석': [
    'Google Analytics',
    'Amplitude',
    'Mixpanel',
    'Google Sheets',
    'Excel',
    'Tableau',
    'Power BI',
    'Google Optimize',
  ],
};

/**
 * 관심사 시드 데이터 (프로필 카드의 관심사 태그)
 * 개발/디자인/기획 직군이 붙일 법한 직무·개인 관심사 (Interest.name 은 unique)
 */
const INTEREST_SEED: string[] = [
  '사이드 프로젝트',
  '오픈소스',
  '스타트업',
  'AI',
  '테크 블로그',
  '해커톤',
  'UX/UI',
  '창업',
  '주식·투자',
  '독서',
  '글쓰기',
  '여행',
  '운동',
  '러닝',
  '등산',
  '요가',
  '게임',
  '음악',
  '악기 연주',
  '영화',
  '사진',
  '그림',
  '요리',
  '베이킹',
  '커피',
  '와인',
  '반려동물',
  '봉사활동',
  '외국어',
  '캠핑',
];

async function main() {
  let categoryCount = 0;
  let skillCount = 0;

  for (const [categoryName, skills] of Object.entries(SKILL_SEED)) {
    // 카테고리 upsert (재실행해도 중복 생성 안 함)
    const category = await prisma.skillCategory.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    categoryCount += 1;

    for (const skillName of skills) {
      // 스킬 upsert — 이미 있으면 카테고리만 최신화
      await prisma.skill.upsert({
        where: { name: skillName },
        update: { categoryId: category.id },
        create: { name: skillName, categoryId: category.id },
      });
      skillCount += 1;
    }

    console.log(`  [${categoryName}] 스킬 ${skills.length}개 시드 완료`);
  }

  // 관심사 upsert (재실행해도 중복 생성 안 함)
  for (const interestName of INTEREST_SEED) {
    await prisma.interest.upsert({
      where: { name: interestName },
      update: {},
      create: { name: interestName },
    });
  }
  console.log(`  [관심사] ${INTEREST_SEED.length}개 시드 완료`);

  console.log(
    `\n✅ 카테고리 ${categoryCount}개 / 스킬 ${skillCount}개 / 관심사 ${INTEREST_SEED.length}개 시드 완료`,
  );
}

main()
  .catch((e) => {
    console.error('시드 실패:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
