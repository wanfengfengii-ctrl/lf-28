import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMuseumStore } from '@/store/museumStore';
import { Building2, Upload, Download, RotateCcw } from 'lucide-react';

export default function Toolbar() {
  const importConfig = useMuseumStore((s) => s.importConfig);
  const exportConfig = useMuseumStore((s) => s.exportConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importConfig(text);
      if (!result.success) {
        alert('导入失败：\n' + result.errors.join('\n'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `museum-guide-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex h-12 items-center gap-3 bg-museum-teal px-4 shadow-lg">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-white" />
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          博物馆语音导览路线编排器
        </span>
      </div>

      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>导入</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>导出</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>重置</span>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Link
          to="/"
          className="rounded-md px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          主工作台
        </Link>
        <Link
          to="/plans"
          className="rounded-md px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 transition-colors"
        >
          方案管理
        </Link>
      </div>
    </div>
  );
}
