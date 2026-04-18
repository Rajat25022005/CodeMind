import { useState } from 'react';
import { mockFiles } from '../data/mockData';
import './Pages.css';

/**
 * FilesPage — Repository file tree explorer with metadata.
 */
const FilesPage = () => {
  const totalFiles = mockFiles.reduce((acc, dir) => acc + (dir.children?.length || 0), 0);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    new Set(mockFiles.map((d) => d.path))
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Files</div>
        <div className="pageSubtitle">
          {mockFiles.length} directories · {totalFiles} files indexed
        </div>
      </div>

      <div className="pageContent">
        <div className="fileTree">
          {mockFiles.map((dir) => (
            <div key={dir.path} className="fileDir">
              <div
                className="fileDirName"
                onClick={() => toggleDir(dir.path)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: expandedDirs.has(dir.path) ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {dir.path}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)' }}>
                  {dir.children?.length || 0} files
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginLeft: 'auto', opacity: 0.5 }}
                >
                  <polyline points={expandedDirs.has(dir.path) ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                </svg>
              </div>
              {expandedDirs.has(dir.path) && dir.children?.map((file) => (
                <div
                  key={file.path}
                  className={`fileEntry ${selectedFile === file.path ? 'fileEntryActive' : ''}`}
                  onClick={() => setSelectedFile(selectedFile === file.path ? null : file.path)}
                >
                  <div className="fileName">
                    <span className="fileIcon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </span>
                    {file.path.split('/').pop()}
                  </div>
                  <div className="fileMeta">
                    <span className="fileMetaItem">{file.language}</span>
                    <span className="fileMetaItem">{file.lines} lines</span>
                    <span className="fileMetaItem">{file.lastModified}</span>
                    <span className="fileMetaItem" style={{ color: 'var(--cyan)' }}>
                      {file.connections} connections
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
