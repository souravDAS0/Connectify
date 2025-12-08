import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { TrackList } from './components/TrackList';
import { wsService } from './api/websocket';
import { Toaster } from 'react-hot-toast';

function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    wsService.connect();
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Layout>
        <div className="pt-8">
          <header className="px-6 mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent inline-block">
              Connectify
            </h1>
            <p className="text-gray-400 mt-2">Synchronized Music Playback</p>
          </header>
          <TrackList />
        </div>
      </Layout>
    </>
  );
}

export default App;
