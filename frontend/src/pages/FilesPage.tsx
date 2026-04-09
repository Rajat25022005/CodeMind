import { mockFiles } from '../data/mockData';
import './Pages.css';

/**
 * FilesPage — Repository file tree explorer with metadata.
 */
const FilesPage = () => {
  const totalFiles = mockFiles.reduce((acc, dir) => acc + (dir.children?.length || 0), 0);

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
