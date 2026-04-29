import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  
  if (!slug || slug.length === 0) {
    notFound();
  }

  // Construct the file path relative to the project root
  const docsPath = path.join(process.cwd(), 'docs', ...slug);
  const filePath = slug[slug.length - 1].endsWith('.md') 
    ? docsPath 
    : `${docsPath}.md`;
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    notFound();
  }

  // Convert markdown to HTML (simple conversion for display)
  const htmlContent = markdownToHtml(content);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
}

function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Tables (basic support)
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    if (cells.some(c => /^-+$/.test(c.trim()))) {
      return '';
    }
    const row = cells.map(c => `<td>${c.trim()}</td>`).join('');
    return `<tr>${row}</tr>`;
  });
  
  // Wrap <tr> in <table>
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table class="border-collapse border border-gray-300 dark:border-gray-700">$&</table>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[123]>)/g, '$1');
  html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<table)/g, '$1');
  html = html.replace(/(<\/table>)<\/p>/g, '$1');
  
  // Line breaks
  html = html.replace(/\n/g, '<br />');
  
  return html;
}

export async function generateStaticParams() {
  // Get all markdown files in the docs folder
  const docsDir = path.join(process.cwd(), 'docs');
  
  function getAllFiles(dir: string, basePath = ''): { slug: string[] }[] {
    const files: { slug: string[] }[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...getAllFiles(fullPath, path.join(basePath, entry.name)));
        } else if (entry.name.endsWith('.md')) {
          const slug = path.join(basePath, entry.name).split(path.sep);
          files.push({ slug });
        }
      }
    } catch {
      // Directory might not exist
    }
    
    return files;
  }
  
  return getAllFiles(docsDir);
}
