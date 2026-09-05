import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const usage = `새 글 작성

  npm run new -- my-slug --type tech --title '글 제목'

  --type   tech | papers | notes (기본: tech)
  --title  글 제목 (생략하면 slug 사용)
  --help   도움말

새 글은 항상 draft: true로 생성됩니다.`;

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      type: { type: 'string', default: 'tech' },
      title: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(usage);
  } else {
    const [slug] = positionals;
    if (positionals.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '') || slug.length > 80) {
      throw new Error('slug는 80자 이내의 영문 소문자·숫자·하이픈으로 작성해 주세요. 예: my-first-post');
    }
    if (!['tech', 'papers', 'notes'].includes(values.type)) {
      throw new Error('--type은 tech, papers, notes 중에서 선택해 주세요.');
    }
    const title = (values.title ?? slug).trim();
    if (!title) throw new Error('--title에 비어 있지 않은 제목을 적어 주세요.');

    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const date = ['year', 'month', 'day'].map((type) => dateParts.find((part) => part.type === type).value).join('-');
    const templateName = values.type === 'papers' ? 'paper' : 'technical';
    const template = await readFile(new URL(`../templates/${templateName}.md`, import.meta.url), 'utf8');
    const content = template
      .replace(/^title:.*$/m, () => `title: ${JSON.stringify(title)}`)
      .replace(/^pubDate:.*$/m, `pubDate: ${date}`)
      .replace(/^category:.*$/m, `category: ${values.type}`);
    const directory = resolve('src/content/blog');
    const destination = resolve(directory, `${slug}.md`);
    try {
      await access(resolve(directory, `${slug}.mdx`));
      throw new Error(`이미 같은 이름의 글이 있습니다: ${slug}.mdx`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await mkdir(directory, { recursive: true });
    try {
      await writeFile(destination, content, { encoding: 'utf8', flag: 'wx' });
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error(`이미 같은 이름의 글이 있습니다: ${slug}.md`);
      throw error;
    }
    console.log(`새 초안을 만들었습니다: src/content/blog/${slug}.md`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
