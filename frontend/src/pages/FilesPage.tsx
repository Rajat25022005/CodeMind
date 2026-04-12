import { useState, useEffect } from 'react';
import { fetchFiles } from '../lib/api';
import { mockFiles } from '../data/repo.mock';
import type { FileItem } from '../types';
import './Pages.css';

function buildFileTree(flatFiles: any[]): FileItem[] {
  const tree: Record<string, FileItem> = {};

  flatFiles.forEach((f) => {
    const parts = f.path.split('/');
    if (parts.length === 1) {
      if (!tree['/']) tree['/'] = { path: '/', isDir: true, language: '', lines: 0, lastModified: '', connections: 0, children: [] };
      tree['/'].children!.push({
         path: f.path,
         language: f.language || 'text',
         lines: f.lines || 0,
         lastModified: '-', 
         connections: f.commit_count || 0,
         isDir: false
      });
    } else {
      const dirPath = parts.slice(0, -1).join('/') + '/';
      if (!tree[dirPath]) {
        tree[dirPath] = { path: dirPath, isDir: true, language: '', lines: 0, lastModified: '', connections: 0, children: [] };
      }
      tree[dirPath].children!.push({
         path: f.path,
         language: f.language || 'text',
         lines: f.lines || 0,
         lastModified: '-',
         connections: f.commit_count || 0,
         isDir: false
      });
    }
  });

  return Object.values(tree).sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * FilesPage — Repository file tree explorer with metadata.
 */
const FilesPage = () => {
  const [fileDirs, setFileDirs] = useState<FileItem[]>(mockFiles);

  useEffect(() => {
    fetchFiles()
      .then((res) => {
        if (res.files && res.files.length > 0) {
          setFileDirs(buildFileTree(res.files));
        }
      })
      .catch((err) => console.warn('Failed to fetch files, using mock:', err));
  }, []);

  const totalFiles = fileDirs.reduce((acc, dir) => acc + (dir.children?.length || 0), 0);

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <div className="pageTitle">Files</div>
        <div className="pageSubtitle">
          {fileDirs.length} directories · {totalFiles} files indexed
        </div>
      </div>

      <div className="pageContent">
        <div className="fileTree">
          {fileDirs.map((dir) => (
            <div key={dir.path} className="fileDir">
              <div className="fileDirName">
                📂 {dir.path}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)' }}>
                  {dir.children?.length || 0} files
                </span>
              </div>
              {dir.children?.map((file) => (
                <div key={file.path} className="fileEntry">
                  <div className="fileName">
                    <span className="fileIcon">📄</span>
                    {file.path.split('/').pop()}
                  </div>
                  <div className="fileMeta">
                    <span className="fileMetaItem">{file.language}</span>
                    <span className="fileMetaItem">{file.lines} lines</span>
                    <span className="fileMetaItem">{file.lastModified}</span>
                    <span className="fileMetaItem" style={{ color: 'var(--cyan)' }}>
                      ⬡ {file.connections}
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
