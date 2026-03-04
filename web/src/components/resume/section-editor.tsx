'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface SectionEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'bg-purple-500 text-white'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-white/10" />;
}

export function SectionEditor({
  content,
  onChange,
  placeholder,
  minHeight = '100px',
  className,
}: SectionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start typing…' }),
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm max-w-none focus:outline-none text-slate-200 leading-relaxed`,
        style: `min-height:${minHeight}; padding: 12px 16px;`,
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  return (
    <div className={`overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] ${className ?? ''}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/8 bg-black/20 px-2 py-1.5">
        {/* Text style */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <span className="underline">U</span>
        </ToolbarBtn>

        <Divider />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><circle cx="2" cy="4" r="1.2"/><rect x="5" y="3.2" width="9" height="1.6" rx="0.8"/><circle cx="2" cy="8" r="1.2"/><rect x="5" y="7.2" width="9" height="1.6" rx="0.8"/><circle cx="2" cy="12" r="1.2"/><rect x="5" y="11.2" width="9" height="1.6" rx="0.8"/></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><text x="0" y="5" fontSize="5" fontFamily="monospace">1.</text><rect x="5" y="3.2" width="9" height="1.6" rx="0.8"/><text x="0" y="9" fontSize="5" fontFamily="monospace">2.</text><rect x="5" y="7.2" width="9" height="1.6" rx="0.8"/><text x="0" y="13" fontSize="5" fontFamily="monospace">3.</text><rect x="5" y="11.2" width="9" height="1.6" rx="0.8"/></svg>
        </ToolbarBtn>

        <Divider />

        {/* Alignment */}
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5" rx="0.75"/><rect x="1" y="5.5" width="9" height="1.5" rx="0.75"/><rect x="1" y="9" width="14" height="1.5" rx="0.75"/><rect x="1" y="12.5" width="7" height="1.5" rx="0.75"/></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5" rx="0.75"/><rect x="3.5" y="5.5" width="9" height="1.5" rx="0.75"/><rect x="1" y="9" width="14" height="1.5" rx="0.75"/><rect x="4.5" y="12.5" width="7" height="1.5" rx="0.75"/></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><rect x="1" y="2" width="14" height="1.5" rx="0.75"/><rect x="6" y="5.5" width="9" height="1.5" rx="0.75"/><rect x="1" y="9" width="14" height="1.5" rx="0.75"/><rect x="8" y="12.5" width="7" height="1.5" rx="0.75"/></svg>
        </ToolbarBtn>

        <Divider />

        {/* History */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><path d="M4 6 L2 4 L4 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M2 4 Q6 2 10 4 Q14 6 14 10 Q14 14 10 14 Q6 14 6 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current"><path d="M12 6 L14 4 L12 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M14 4 Q10 2 6 4 Q2 6 2 10 Q2 14 6 14 Q10 14 10 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        </ToolbarBtn>

        {/* ATS badge */}
        <div className="ml-auto flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          ATS Safe
        </div>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
