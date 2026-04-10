import ErrorBoundary from '../components/ErrorBoundary';
import GraphCanvas from '../components/GraphCanvas';
import QueryPanel from '../components/QueryPanel';

/**
 * GraphPage — Main graph + query panel side-by-side view.
 * This is the default landing page.
 */
const GraphPage = () => {
  return (
    <>
      <div className="mainArea">
        <ErrorBoundary>
          <GraphCanvas />
        </ErrorBoundary>
      </div>
      <ErrorBoundary>
        <QueryPanel />
      </ErrorBoundary>
    </>
  );
};

export default GraphPage;
