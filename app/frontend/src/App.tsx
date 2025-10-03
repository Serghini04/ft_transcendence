import MyHeader from "./components/MyHeader";
import SideMenu from "./components/SideMenu";

function App() {
  return (
    <div className="relative min-h-screen">
    <div 
      className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0"
    />

      
      <SideMenu />
      <MyHeader />
      
      {/* Main content area */}
      <main className="relative ml-16 pt-16 p-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Transcendence</h1>
            <p className="text-gray-600">
              This is the main content area with a semi-transparent background to show the background image.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App
