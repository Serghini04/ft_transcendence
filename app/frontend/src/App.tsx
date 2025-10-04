import MyHeader from "./components/MyHeader";
import SideMenu from "./components/SideMenu";

export default function App() {
  return (
    <div className="relative min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat z-0" />

      {/* UI */}
      <SideMenu />
      <MyHeader />

      {/* Page Content Placeholder */}
      <main className="pl-20 pt-20 p-6 relative z-10">
        {/* <h1 className="text-3xl font-semibold">Dashboard</h1> */}
      </main>
    </div>
  );
}


